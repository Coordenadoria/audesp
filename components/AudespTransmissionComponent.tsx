/**
 * Componente de Transmissão AUDESP
 * Interface para envio de dados com protocolo imutável
 */

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Loader, DownloadCloud, Eye, EyeOff } from 'lucide-react';
import { PrestacaoContasAudesp } from '../services/audespSchemaTypes';
import { AudespTransmissionService, ProtocolLog } from '../services/audespTransmissionService';

interface AudespTransmissionComponentProps {
  formData: Partial<PrestacaoContasAudesp>;
  isValid: boolean;
  onTransmissionComplete?: (protocolNumber: string) => void;
}

export const AudespTransmissionComponent: React.FC<AudespTransmissionComponentProps> = ({
  formData,
  isValid,
  onTransmissionComplete
}) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [ambiente, setAmbiente] = useState<'piloto' | 'producao'>('piloto');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [logs, setLogs] = useState<ProtocolLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<ProtocolLog | null>(null);
  const [message, setMessage] = useState('');

  // Carregar logs ao montar
  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    const allLogs = AudespTransmissionService.getLogs();
    setLogs(allLogs);
    setSummary(AudespTransmissionService.getSummary());
  };

  const handleTransmit = async () => {
    if (!isValid && !dryRun) {
      setMessage('Erro: Formulário contém erros. Corrija-os antes de transmitir.');
      return;
    }

    setIsTransmitting(true);
    setMessage('');

    try {
      const response = await AudespTransmissionService.transmit(formData, {
        ambiente,
        email: email || undefined,
        senhaSuporte: senha || undefined,
        autoValidate: true,
        dryRun
      });

      if (response.success) {
        setMessage(`✅ ${response.message}`);
        if (response.protocolNumber) {
          onTransmissionComplete?.(response.protocolNumber);
        }
      } else {
        setMessage(`❌ ${response.message}`);
      }

      refreshLogs();
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleDownloadLogs = () => {
    const logsJson = AudespTransmissionService.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audesp-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCleanupLogs = () => {
    if (confirm('Remover logs com mais de 30 dias?')) {
      const removed = AudespTransmissionService.cleanupOldLogs(30);
      setMessage(`✅ ${removed} log(s) removido(s)`);
      refreshLogs();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Transmissão para AUDESP</h2>
        <p className="text-sm text-gray-600 mt-1">Envie dados com protocolo rastreável e imutável</p>
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.startsWith('✅')
            ? 'bg-green-50 border-green-200 text-green-700'
            : message.startsWith('❌')
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* Painel de Configuração */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
        <h3 className="font-semibold text-gray-900">Configurações de Transmissão</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Ambiente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
            <select
              value={ambiente}
              onChange={(e) => setAmbiente(e.target.value as 'piloto' | 'producao')}
              disabled={isTransmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="piloto">🧪 Piloto (Testes)</option>
              <option value="producao">🚀 Produção</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isTransmitting}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha (opcional)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isTransmitting}
                placeholder="••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dry Run */}
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={isTransmitting}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Modo Teste (Dry Run)</span>
            </label>
          </div>
        </div>

        {/* Status de Validação */}
        <div className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm">
              Formulário: <strong>{isValid ? '✓ Válido' : '✗ Inválido'}</strong>
            </span>
          </div>
        </div>

        {/* Botão de Transmissão */}
        <button
          onClick={handleTransmit}
          disabled={isTransmitting || (!isValid && !dryRun)}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            isTransmitting || (!isValid && !dryRun)
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTransmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Transmitindo...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Transmitir Agora
            </>
          )}
        </button>
      </div>

      {/* Resumo de Transmissões */}
      {summary && (
        <div className="grid grid-cols-5 gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-green-600">Sucesso</p>
            <p className="text-2xl font-bold text-green-600">{summary.successful}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-yellow-600">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-red-600">Erro</p>
            <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-orange-600">Rejeitado</p>
            <p className="text-2xl font-bold text-orange-600">{summary.rejected}</p>
          </div>
        </div>
      )}

      {/* Histórico de Transmissões */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Histórico de Transmissões</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadLogs}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <DownloadCloud className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={handleCleanupLogs}
                className="px-3 py-1 bg-gray-400 text-white text-sm rounded-lg hover:bg-gray-500"
              >
                Limpar Antigos
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice().reverse().map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`w-full p-3 rounded-lg border-l-4 text-left transition-colors ${
                  log.status === 'sucesso'
                    ? 'bg-green-50 border-green-500 hover:bg-green-100'
                    : log.status === 'erro'
                    ? 'bg-red-50 border-red-500 hover:bg-red-100'
                    : log.status === 'rejeitado'
                    ? 'bg-orange-50 border-orange-500 hover:bg-orange-100'
                    : 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {log.municipio} - {log.entidade}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {log.timestamp.toLocaleString('pt-BR')}
                      {log.protocolNumber && ` • Protocolo: ${log.protocolNumber}`}
                    </p>
                  </div>
                  {log.status === 'sucesso' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {log.status === 'erro' && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {log.status === 'pendente' && <Loader className="w-5 h-5 text-yellow-600 animate-spin" />}
                </div>
              </button>
            ))}
          </div>

          {/* Detalhes do Log Selecionado */}
          {selectedLog && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <h4 className="font-semibold text-gray-900">Detalhes da Transmissão</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">ID do Log</p>
                  <p className="font-mono text-xs">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-semibold">
                    {selectedLog.status.toUpperCase()}
                  </p>
                </div>
                {selectedLog.protocolNumber && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Protocolo AUDESP</p>
                    <p className="font-mono font-bold text-lg">{selectedLog.protocolNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Período</p>
                  <p>{selectedLog.mes}/{selectedLog.ano}</p>
                </div>
                <div>
                  <p className="text-gray-600">Erros de Validação</p>
                  <p>{selectedLog.validationResult?.errors.length ?? 0}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Mensagem</p>
                <p className="text-sm p-2 bg-white rounded border border-gray-300 font-mono">
                  {selectedLog.mensagem}
                </p>
              </div>

              {selectedLog.validationResult?.errors.length ? 0 && (
                <div>
                  <p className="text-gray-600 text-sm">Erros de Validação</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedLog.validationResult.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-xs text-red-700 bg-red-50 p-1 rounded">
                        {err.path}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudespTransmissionComponent;
