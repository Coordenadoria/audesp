import React, { useState, useEffect } from 'react';
import { SystemHealthChecker, SystemHealth, PerformanceMonitor } from '../services/systemHealthService';
import { errorRecoveryEngine } from '../services/errorRecoveryService';

interface SystemMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'OK':
    case 'HEALTHY':
      return 'text-emerald-600 bg-emerald-50';
    case 'WARNING':
    case 'DEGRADED':
      return 'text-yellow-600 bg-yellow-50';
    case 'ERROR':
    case 'CRITICAL':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
};

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'HEALTHY':
      return '✅';
    case 'DEGRADED':
      return '⚠️';
    case 'CRITICAL':
      return '❌';
    case 'OK':
      return '✓';
    case 'WARNING':
      return '⚠';
    case 'ERROR':
      return '✗';
    default:
      return '?';
  }
};

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  compact = false
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recovery, setRecovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        const [healthData, perfData, recoveryData] = await Promise.all([
          SystemHealthChecker.checkSystemHealth(),
          Promise.resolve(PerformanceMonitor.getPerformanceReport()),
          Promise.resolve(errorRecoveryEngine.getRecoveryStats())
        ]);

        setHealth(healthData);
        setPerformance(perfData);
        setRecovery(recoveryData);
      } catch (error) {
        console.error('[SystemMonitor] Erro ao atualizar:', error);
      } finally {
        setLoading(false);
      }
    };

    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (!health || loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-sm text-slate-500">Carregando saúde do sistema...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded cursor-pointer hover:bg-slate-100 transition" onClick={() => setExpanded(true)}>
        <span className="text-lg">{getStatusBadge(health.status)}</span>
        <span className="text-xs font-medium text-slate-600">Sistema</span>
        <span className={`text-xs font-bold ${getStatusColor(health.status)}`}>{health.status}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusBadge(health.status)}</span>
          <div>
            <h3 className="font-bold text-slate-900">Monitor de Saúde do Sistema</h3>
            <p className="text-xs text-slate-500">Última verificação: {new Date(health.lastCheck).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full font-bold text-sm ${getStatusColor(health.status)}`}>
          {health.status}
        </div>
      </div>

      {/* Status Geral */}
      <div className="p-6 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Taxa de Sucesso</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(health.metrics.transmissionSuccessRate * 100)}%</div>
            <div className="text-xs text-slate-500 mt-2">{health.metrics.errorRate > 0 ? '❌ Erros detectados' : '✅ Sem erros'}</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Latência Média</div>
            <div className="text-2xl font-bold text-purple-600">{health.metrics.averageLatency}ms</div>
            <div className="text-xs text-slate-500 mt-2">{health.metrics.averageLatency > 2000 ? '⚠️ Lento' : '✅ Rápido'}</div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Uptime</div>
            <div className="text-2xl font-bold text-green-600">{Math.round(health.metrics.uptime / 60)}m</div>
            <div className="text-xs text-slate-500 mt-2">Tempo desde início</div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Componentes OK</div>
            <div className="text-2xl font-bold text-indigo-600">
              {health.components.filter(c => c.status === 'OK').length}/{health.components.length}
            </div>
            <div className="text-xs text-slate-500 mt-2">Todos operacionais</div>
          </div>
        </div>
      </div>

      {/* Componentes */}
      <div className="p-6 border-b border-slate-200">
        <h4 className="font-bold text-slate-900 mb-4">Componentes do Sistema</h4>
        <div className="space-y-3">
          {health.components.map((component, idx) => (
            <div key={idx} className={`p-3 rounded-lg border-l-4 ${getStatusColor(component.status)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {getStatusBadge(component.status)} {component.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{component.message}</div>
                </div>
                {component.latency && (
                  <div className="text-xs font-mono text-slate-500">{component.latency}ms</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendações */}
      {health.recommendations.length > 0 && (
        <div className="p-6 border-b border-slate-200 bg-blue-50">
          <h4 className="font-bold text-slate-900 mb-3">💡 Recomendações</h4>
          <div className="space-y-2">
            {health.recommendations.map((rec, idx) => (
              <div key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance */}
      {performance && (
        <div className="p-6 border-b border-slate-200">
          <h4 className="font-bold text-slate-900 mb-4">📊 Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-2">Score de Saúde</div>
              <div className="text-3xl font-bold text-slate-900">{performance.summary.healthScore}</div>
              <div className="text-xs text-slate-600 mt-2">Status: {performance.summary.status}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Transmissões:</span>
                <span className="font-medium">{performance.details.totalTransmissions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sucesso:</span>
                <span className="font-medium text-green-600">{performance.details.successRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Erros:</span>
                <span className="font-medium text-red-600">{performance.details.errorRate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Stats */}
      {recovery && recovery.totalAttempts > 0 && (
        <div className="p-6">
          <h4 className="font-bold text-slate-900 mb-4">🔧 Recuperação de Erros</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Total Tentativas</div>
              <div className="text-2xl font-bold text-slate-900">{recovery.totalAttempts}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-slate-500">Recuperadas</div>
              <div className="text-2xl font-bold text-green-600">{recovery.successfulRecoveries}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-xs text-slate-500">Falhadas</div>
              <div className="text-2xl font-bold text-red-600">{recovery.failedRecoveries}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-slate-500">Taxa Sucesso</div>
              <div className="text-2xl font-bold text-blue-600">{recovery.successRate}</div>
            </div>
          </div>
          {recovery.mostUsedStrategy && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">Estratégia Mais Usada</div>
              <div className="font-medium text-slate-900 mt-1">{recovery.mostUsedStrategy}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;
