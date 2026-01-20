import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Loader,
  RefreshCw,
  Download,
  Copy,
} from 'lucide-react';
import { TransmissionResponse, AUDESPWebService } from '../services/AUDESPWebService';

interface TransmissionMonitorProps {
  webService: AUDESPWebService;
  transactionIds?: string[];
  onStatusChange?: (transaction: TransmissionResponse) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface MonitoredTransaction {
  id: string;
  response: TransmissionResponse;
  lastChecked: Date;
  attempts: number;
}

export const TransmissionMonitor: React.FC<TransmissionMonitorProps> = ({
  webService,
  transactionIds = [],
  onStatusChange,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const [transactions, setTransactions] = useState<Map<string, MonitoredTransaction>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Inicializar com transações passadas
  useEffect(() => {
    transactionIds.forEach((id) => {
      const newMap = new Map(transactions);
      if (!newMap.has(id)) {
        newMap.set(id, {
          id,
          response: {
            id,
            status: 'pending',
            protocol: '',
            message: 'Aguardando...',
            errors: [],
            timestamp: new Date(),
          },
          lastChecked: new Date(),
          attempts: 0,
        });
      }
      setTransactions(newMap);
    });
  }, [transactionIds]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshTransactions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const refreshTransactions = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const history = webService.getTransmissionHistory();

      const newMap = new Map(transactions);
      for (const item of history) {
        const monitored = newMap.get(item.id) || {
          id: item.id,
          attempts: 0,
        };

        const updated: MonitoredTransaction = {
          ...monitored,
          response: item.response,
          lastChecked: new Date(),
          attempts: monitored.attempts + 1,
        };

        newMap.set(item.id, updated);
        onStatusChange?.(item.response);
      }

      setTransactions(newMap);
    } catch (error) {
      console.error('Erro ao atualizar transações:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [webService]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'pending':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'rejected':
        return 'bg-orange-50 border-orange-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      success: 'Sucesso',
      error: 'Erro',
      rejected: 'Rejeitado',
      pending: 'Pendente',
    };
    return labels[status] || 'Desconhecido';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const selectedTransactionData = selectedTransaction
    ? transactions.get(selectedTransaction)
    : null;

  const summaryData = {
    total: transactions.size,
    success: Array.from(transactions.values()).filter((t) => t.response.status === 'success')
      .length,
    error: Array.from(transactions.values()).filter((t) => t.response.status === 'error').length,
    rejected: Array.from(transactions.values()).filter(
      (t) => t.response.status === 'rejected'
    ).length,
    pending: Array.from(transactions.values()).filter((t) => t.response.status === 'pending')
      .length,
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">📡 Monitor de Transmissões AUDESP</h2>
        <button
          onClick={refreshTransactions}
          disabled={isRefreshing}
          className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{summaryData.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm text-green-600">Sucesso</p>
          <p className="text-2xl font-bold text-green-900">{summaryData.success}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-600">Pendente</p>
          <p className="text-2xl font-bold text-blue-900">{summaryData.pending}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-sm text-orange-600">Rejeitado</p>
          <p className="text-2xl font-bold text-orange-900">{summaryData.rejected}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-sm text-red-600">Erro</p>
          <p className="text-2xl font-bold text-red-900">{summaryData.error}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-3 font-semibold text-gray-900 text-sm">
            Transações ({transactions.size})
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {transactions.size === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma transação</p>
              </div>
            ) : (
              Array.from(transactions.values()).map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => setSelectedTransaction(transaction.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition border-l-4 ${
                    selectedTransaction === transaction.id
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'border-l-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(transaction.response.status)}
                    <span className="text-xs text-gray-500 font-mono truncate">
                      {transaction.id.substr(-12)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {getStatusLabel(transaction.response.status)}
                  </p>
                  {transaction.response.protocol && (
                    <p className="text-xs text-blue-600 font-mono">
                      {transaction.response.protocol}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 border border-gray-200 rounded-lg overflow-hidden">
          {selectedTransactionData ? (
            <div className="divide-y divide-gray-200">
              {/* Header */}
              <div className={`p-4 ${getStatusColor(selectedTransactionData.response.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTransactionData.response.status)}
                    <h3 className="font-semibold text-gray-900">
                      {getStatusLabel(selectedTransactionData.response.status)}
                    </h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedTransactionData.id)}
                    className="p-1 text-gray-600 hover:bg-white rounded transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">ID da Transação</p>
                  <p className="text-sm text-gray-900 font-mono">{selectedTransactionData.id}</p>
                </div>

                {selectedTransactionData.response.protocol && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Protocolo</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900 font-mono">
                        {selectedTransactionData.response.protocol}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(selectedTransactionData.response.protocol)
                        }
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 font-medium">Mensagem</p>
                  <p className="text-sm text-gray-900">{selectedTransactionData.response.message}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Último Acesso</p>
                  <p className="text-sm text-gray-900">
                    {selectedTransactionData.lastChecked.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Tentativas de Sincronização</p>
                  <p className="text-sm text-gray-900">{selectedTransactionData.attempts}</p>
                </div>

                {/* Errors */}
                {selectedTransactionData.response.errors.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Erros Reportados</p>
                    <div className="mt-2 space-y-2">
                      {selectedTransactionData.response.errors.map((error, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs font-mono text-red-700">{error.code}</p>
                          <p className="text-xs text-red-600 mt-1">{error.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 flex gap-2">
                <button className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Detalhes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Selecione uma transação para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransmissionMonitor;
