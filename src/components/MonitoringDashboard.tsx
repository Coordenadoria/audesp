import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Zap, TrendingUp, Activity } from 'lucide-react';
import PerformanceMonitor, { PerformanceMetric, ResourceMetrics } from '../services/PerformanceMonitor';
import AnalyticsService, { AnalyticsEvent, ErrorEvent } from '../services/AnalyticsService';
import CacheOptimizer, { CacheStats } from '../services/CacheOptimizer';

interface MonitoringDashboardProps {
  refreshInterval?: number; // em ms
}

/**
 * MonitoringDashboard - Componente para visualizar métricas de produção
 */
const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ refreshInterval = 5000 }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'analytics' | 'cache' | 'errors'>(
    'performance',
  );
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  const perfMonitor = PerformanceMonitor.getInstance();
  const analytics = AnalyticsService.getInstance();
  const cache = CacheOptimizer.getInstance();

  useEffect(() => {
    const refreshData = () => {
      setMetrics(perfMonitor.getMetrics(10));
      setResourceMetrics(perfMonitor.getResourceMetrics(10));
      setAnalyticsEvents(analytics.getEvents(10));
      setErrors(analytics.getErrors(5));
      setCacheStats(cache.getStats());
    };

    refreshData();
    const interval = setInterval(refreshData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, perfMonitor, analytics, cache]);

  const chartData = metrics.map((m, idx) => ({
    name: m.name,
    value: m.value,
    status: m.status,
  }));

  const resourceChartData = resourceMetrics.map((r, idx) => ({
    name: `Sample ${idx + 1}`,
    memory: r.memory.percentage,
    cpu: r.cpu,
    latency: r.networkLatency,
  }));

  const eventsByCategory = analyticsEvents.reduce(
    (acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const eventChartData = Object.entries(eventsByCategory).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const criticalErrors = errors.filter((e) => e.severity === 'critical').length;
  const avgCacheHitRate = cacheStats?.hitRate || 0;

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Production Monitoring</h1>
        <p className="text-gray-400">Real-time metrics and analytics dashboard</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {['performance', 'analytics', 'cache', 'errors'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold">
                    {resourceMetrics.length > 0
                      ? (
                          resourceMetrics.reduce((sum, r) => sum + r.apiResponseTime, 0) /
                          resourceMetrics.length
                        ).toFixed(0)
                      : 'N/A'}
                    ms
                  </p>
                </div>
                <Zap className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Memory Usage</p>
                  <p className="text-2xl font-bold">
                    {resourceMetrics.length > 0
                      ? (
                          resourceMetrics.reduce((sum, r) => sum + r.memory.percentage, 0) /
                          resourceMetrics.length
                        ).toFixed(1)
                      : 'N/A'}
                    %
                  </p>
                </div>
                <Activity className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Cache Hit Rate</p>
                  <p className="text-2xl font-bold">{avgCacheHitRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Critical Errors</p>
                  <p className="text-2xl font-bold text-red-400">{criticalErrors}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Performance Metrics Chart */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            {metrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-600 p-3 rounded">
                    <div>
                      <p className="font-semibold">{metric.name}</p>
                      <p className="text-xs text-gray-400">
                        {metric.timestamp.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        metric.status === 'critical' ? 'text-red-400' :
                        metric.status === 'warning' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {metric.value}{metric.unit}
                      </p>
                      <p className="text-xs text-gray-400">
                        {metric.threshold ? `Limiar: ${metric.threshold}${metric.unit}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Sem dados de performance</p>
            )}
          </div>

          {/* Resource Metrics Chart */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
            {resourceMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={resourceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Memory %" />
                  <Line type="monotone" dataKey="cpu" stroke="#f59e0b" strokeWidth={2} name="CPU %" />
                  <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} name="Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">Sem dados de recursos</p>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Events by Category</h3>
            {eventChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={eventChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400">Sem eventos registrados</p>
            )}
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
            {analyticsEvents.length > 0 ? (
              <div className="space-y-2">
                {analyticsEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-600 p-3 rounded">
                    <div>
                      <p className="font-semibold">{event.eventName}</p>
                      <p className="text-xs text-gray-400">{event.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cyan-400">{event.timestamp.toLocaleTimeString('pt-BR')}</p>
                      {event.value && <p className="text-xs text-gray-400">Value: {event.value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Sem eventos</p>
            )}
          </div>
        </div>
      )}

      {/* Cache Tab */}
      {activeTab === 'cache' && (
        <div className="space-y-6">
          {cacheStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Cache Entries</p>
                  <p className="text-2xl font-bold">{cacheStats.entries}</p>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Total Size</p>
                  <p className="text-2xl font-bold">
                    {(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Cache Hits</p>
                  <p className="text-2xl font-bold text-green-400">{cacheStats.hits}</p>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm">Cache Misses</p>
                  <p className="text-2xl font-bold text-red-400">{cacheStats.misses}</p>
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Cache Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-semibold">{cacheStats.hitRate}%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${cacheStats.hitRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
            {errors.length > 0 ? (
              <div className="space-y-3">
                {errors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border-l-4 ${
                      error.severity === 'critical'
                        ? 'bg-red-900 border-red-500'
                        : error.severity === 'high'
                          ? 'bg-orange-900 border-orange-500'
                          : 'bg-yellow-900 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{error.message}</p>
                        <p className="text-xs text-gray-300 mt-1">ID: {error.errorId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        error.severity === 'critical'
                          ? 'bg-red-500'
                          : error.severity === 'high'
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                      }`}>
                        {error.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-2">
                      {error.timestamp.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Sem erros registrados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
