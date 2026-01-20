import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { CheckCircle, AlertCircle, Clock, TrendingUp, FileText, Send } from 'lucide-react';

interface TransmissionRecord {
  id: string;
  date: string;
  status: 'sucesso' | 'pendente' | 'erro';
  registros: number;
  valor: number;
  environment: string;
  nsu?: string;
}

const Dashboard: React.FC<{ formData: any; transmissionHistory?: TransmissionRecord[] }> = ({ 
  formData, 
  transmissionHistory = [] 
}) => {
  const [stats, setStats] = useState({
    totalDocumentos: 0,
    totalPagamentos: 0,
    totalValor: 0,
    ultimaTransmissao: null as TransmissionRecord | null,
    transmissoesHoje: 0,
    taxa100: 0
  });

  const [statusChart, setStatusChart] = useState([
    { name: 'Sucesso', value: 0, color: '#10b981' },
    { name: 'Pendente', value: 0, color: '#f59e0b' },
    { name: 'Erro', value: 0, color: '#ef4444' }
  ]);

  useEffect(() => {
    // Calcular estatísticas
    const docs = formData.documentos_fiscais?.length || 0;
    const pagamentos = formData.pagamentos?.length || 0;
    const totalValor = (formData.documentos_fiscais || []).reduce(
      (sum: number, doc: any) => sum + (parseFloat(doc.valor) || 0), 
      0
    );

    const hoje = new Date().toISOString().split('T')[0];
    const hojeTransmissoes = transmissionHistory.filter(t => t.date.startsWith(hoje)).length;

    const sucessos = transmissionHistory.filter(t => t.status === 'sucesso').length;
    const taxa = transmissionHistory.length > 0 ? Math.round((sucessos / transmissionHistory.length) * 100) : 0;

    const last = transmissionHistory.length > 0 ? transmissionHistory[transmissionHistory.length - 1] : null;

    setStats({
      totalDocumentos: docs,
      totalPagamentos: pagamentos,
      totalValor: totalValor,
      ultimaTransmissao: last,
      transmissoesHoje: hojeTransmissoes,
      taxa100: taxa
    });

    // Atualizar chart de status
    const status = transmissionHistory.reduce((acc, record) => {
      const idx = acc.findIndex(s => s.name === (record.status === 'sucesso' ? 'Sucesso' : record.status === 'pendente' ? 'Pendente' : 'Erro'));
      if (idx >= 0) acc[idx].value++;
      return acc;
    }, [
      { name: 'Sucesso', value: 0, color: '#10b981' },
      { name: 'Pendente', value: 0, color: '#f59e0b' },
      { name: 'Erro', value: 0, color: '#ef4444' }
    ]);
    setStatusChart(status);
  }, [formData, transmissionHistory]);

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Operacional</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Documentos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDocumentos}</p>
            </div>
            <FileText size={32} className="text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Valor Total</p>
              <p className="text-3xl font-bold text-gray-900">
                R$ {(stats.totalValor / 1000).toFixed(1)}k
              </p>
            </div>
            <TrendingUp size={32} className="text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Transmissões Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{stats.transmissoesHoje}</p>
            </div>
            <Send size={32} className="text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Taxa de Sucesso</p>
              <p className="text-3xl font-bold text-gray-900">{stats.taxa100}%</p>
            </div>
            <CheckCircle size={32} className="text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Última Transmissão */}
      {stats.ultimaTransmissao && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Última Transmissão</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {stats.ultimaTransmissao.status === 'sucesso' ? (
                  <CheckCircle size={24} className="text-green-600" />
                ) : stats.ultimaTransmissao.status === 'pendente' ? (
                  <Clock size={24} className="text-yellow-600" />
                ) : (
                  <AlertCircle size={24} className="text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {stats.ultimaTransmissao.status === 'sucesso' ? '✓ Transmitido com Sucesso' : 
                     stats.ultimaTransmissao.status === 'pendente' ? '⏳ Pendente de Processamento' :
                     '✗ Falha na Transmissão'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(stats.ultimaTransmissao.date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Registros: {stats.ultimaTransmissao.registros} | 
                Valor: R$ {stats.ultimaTransmissao.valor.toLocaleString('pt-BR')}
                {stats.ultimaTransmissao.nsu && ` | NSU: ${stats.ultimaTransmissao.nsu}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de Transmissões</h3>
          {statusChart.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              Nenhuma transmissão realizada
            </div>
          )}
        </div>

        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Mensal</h3>
          <div className="h-300 flex items-center justify-center text-gray-500">
            Gráfico de tendência mensal
          </div>
        </div>
      </div>

      {/* Histórico de Transmissões */}
      {transmissionHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico (Últimas 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data/Hora</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Registros</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ambiente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">NSU</th>
                </tr>
              </thead>
              <tbody>
                {transmissionHistory.slice(-10).reverse().map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'sucesso' ? 'bg-green-100 text-green-800' :
                        record.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'sucesso' ? '✓' : record.status === 'pendente' ? '⏳' : '✗'}
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{record.registros}</td>
                    <td className="py-3 px-4 text-right">R$ {record.valor.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{record.environment}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-600">{record.nsu || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
