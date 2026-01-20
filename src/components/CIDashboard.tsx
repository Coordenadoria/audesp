import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import CIPipelineService, {
  DeploymentPipeline,
  BuildResult,
  TestResult,
  SecurityCheckResult,
} from '../services/CIPipelineService';

interface CIDashboardProps {
  refreshInterval?: number; // em ms
}

/**
 * CIDashboard - Componente para visualizar CI/CD Pipeline
 */
const CIDashboard: React.FC<CIDashboardProps> = ({ refreshInterval = 5000 }) => {
  const [currentPipeline, setCurrentPipeline] = useState<DeploymentPipeline | null>(null);
  const [buildHistory, setBuildHistory] = useState<BuildResult[]>([]);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [securityHistory, setSecurityHistory] = useState<SecurityCheckResult[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'tests' | 'security'>(
    'overview',
  );
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);

  const service = CIPipelineService.getInstance();

  useEffect(() => {
    const refreshData = () => {
      setCurrentPipeline(service.getCurrentPipeline());
      setBuildHistory(service.getBuildHistory(20));
      setTestHistory(service.getTestHistory(20));
      setSecurityHistory(service.getSecurityHistory(20));
    };

    refreshData();
    const interval = setInterval(refreshData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, service]);

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const buildChartData = buildHistory.map((build, idx) => ({
    name: `Build ${idx + 1}`,
    duration: build.duration / 1000,
    success: build.success ? 1 : 0,
  }));

  const testChartData = testHistory.map((test, idx) => ({
    name: `Test ${idx + 1}`,
    passed: test.passed,
    failed: test.failed,
  }));

  const successRate = buildHistory.length > 0 
    ? (buildHistory.filter((b) => b.success).length / buildHistory.length) * 100
    : 0;

  const avgTestsPerRun = testHistory.length > 0 
    ? testHistory.reduce((sum, t) => sum + t.total, 0) / testHistory.length
    : 0;

  const criticalVulnerabilities = securityHistory.length > 0 
    ? securityHistory[securityHistory.length - 1].vulnerabilities.critical
    : 0;

  const pieData = [
    { name: 'Sucesso', value: buildHistory.filter((b) => b.success).length, color: '#10b981' },
    { name: 'Falha', value: buildHistory.filter((b) => !b.success).length, color: '#ef4444' },
  ];

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔄 CI/CD Pipeline Dashboard</h1>
        <p className="text-gray-400">Monitoramento em tempo real da integração contínua</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {['overview', 'builds', 'tests', 'security'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total de Builds</p>
                  <p className="text-2xl font-bold">{buildHistory.length}</p>
                </div>
                <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Testes Médios</p>
                  <p className="text-2xl font-bold">{avgTestsPerRun.toFixed(0)}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Vulnerabilidades</p>
                  <p className="text-2xl font-bold text-red-400">{criticalVulnerabilities}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Build Success Rate */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Taxa de Sucesso de Builds</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Build Duration */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Duração dos Builds</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={buildChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#666" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline Atual */}
          {currentPipeline && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pipeline Atual</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentPipeline.status)}`}>
                  {currentPipeline.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Branch:</span>
                  <span className="font-mono">{currentPipeline.branch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Commit:</span>
                  <span className="font-mono">{currentPipeline.commit.substring(0, 8)}</span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-3">Estágios:</p>
                  <div className="space-y-2">
                    {currentPipeline.stages.map((stage, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-600 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          {getStageIcon(stage.status)}
                          <span className="text-sm">{stage.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{stage.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Builds Tab */}
      {activeTab === 'builds' && (
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Histórico de Builds</h3>
            {buildHistory.length > 0 ? (
              <div className="space-y-2">
                {buildHistory.map((build, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                    <div className="flex items-center gap-3">
                      {build.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-semibold">{build.version}</p>
                        <p className="text-xs text-gray-400">
                          {build.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-400">{(build.duration / 1000).toFixed(2)}s</p>
                      {build.errors.length > 0 && (
                        <p className="text-red-400">❌ {build.errors.length} erro(s)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Nenhum build registrado</p>
            )}
          </div>
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Resultados de Testes</h3>
            {testHistory.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={testChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#666" />
                    <XAxis dataKey="name" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="passed" fill="#10b981" />
                    <Bar dataKey="failed" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {testHistory.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-600 p-3 rounded">
                      <div>
                        <p className="font-semibold">
                          {test.passed + test.failed + test.skipped} testes
                        </p>
                        <p className="text-xs text-gray-400">
                          {test.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right text-sm space-y-1">
                        <p className="text-green-400">✅ {test.passed} passed</p>
                        {test.failed > 0 && <p className="text-red-400">❌ {test.failed} failed</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Nenhum teste registrado</p>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Verificações de Segurança</h3>
            {securityHistory.length > 0 ? (
              <div className="space-y-3">
                {securityHistory.map((security, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border-l-4 ${
                      security.passed
                        ? 'bg-green-900 border-green-500'
                        : 'bg-red-900 border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {security.passed ? (
                            <>
                              <CheckCircle className="w-5 h-5" /> Seguro
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5" /> Vulnerabilidades
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {security.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Críticos</p>
                        <p className="text-red-400 font-bold">{security.vulnerabilities.critical}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Altos</p>
                        <p className="text-orange-400 font-bold">{security.vulnerabilities.high}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Médios</p>
                        <p className="text-yellow-400 font-bold">{security.vulnerabilities.medium}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Baixos</p>
                        <p className="text-blue-400 font-bold">{security.vulnerabilities.low}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Nenhuma verificação registrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CIDashboard;
