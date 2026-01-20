import React, { useState, useCallback } from 'react';
import {
  Play,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { TestSuite, TestResult } from '../tests/TestSuite';

interface TestRunnerProps {
  testSuite?: TestSuite;
}

type FilterType = 'all' | 'passed' | 'failed' | 'error' | 'skipped';

export const TestRunner: React.FC<TestRunnerProps> = ({ testSuite = TestSuite.getInstance() }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const handleRunAll = useCallback(async () => {
    setIsRunning(true);
    try {
      const runResults = await testSuite.runAll();
      setResults(runResults);
    } finally {
      setIsRunning(false);
    }
  }, [testSuite]);

  const handleRunByTag = useCallback(
    async (tag: string) => {
      setIsRunning(true);
      try {
        const runResults = await testSuite.runByTag(tag);
        setResults(runResults);
      } finally {
        setIsRunning(false);
      }
    },
    [testSuite]
  );

  const handleDownloadReport = () => {
    const report = testSuite.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-orange-50 border-orange-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredResults = results.filter((r) => {
    if (filterType === 'all') return true;
    return r.status === filterType;
  });

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const total = results.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">🧪 Test Runner</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isRunning ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Executar Todos
            </button>
            {results.length > 0 && (
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Relatório
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {total > 0 && (
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <p className="text-xs text-green-600">Passou</p>
              <p className="text-2xl font-bold text-green-900">{passed}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
              <p className="text-xs text-red-600">Falhou</p>
              <p className="text-2xl font-bold text-red-900">{failed}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
              <p className="text-xs text-orange-600">Erro</p>
              <p className="text-2xl font-bold text-orange-900">{errors}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
              <p className="text-xs text-gray-600">Pulado</p>
              <p className="text-2xl font-bold text-gray-900">{skipped}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'passed', 'failed', 'error', 'skipped'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterType(status as FilterType)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filterType === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'Todos'}
              {status === 'passed' && '✅ Passou'}
              {status === 'failed' && '❌ Falhou'}
              {status === 'error' && '🚫 Erro'}
              {status === 'skipped' && '⏭️ Pulado'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filteredResults.length > 0 ? (
        <div className="space-y-2">
          {filteredResults.map((result) => (
            <div
              key={result.testId}
              className={`border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition ${getStatusColor(
                result.status
              )}`}
            >
              <div
                onClick={() =>
                  setExpandedTest(expandedTest === result.testId ? null : result.testId)
                }
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{result.name}</h3>
                    <p className="text-xs text-gray-600">ID: {result.testId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200">
                    {result.duration}ms
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      result.status === 'passed'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : result.status === 'error'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Details */}
              {expandedTest === result.testId && (result.message || result.error) && (
                <div className="border-t border-current opacity-20 p-4 bg-gray-50">
                  {result.message && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Resultado:</p>
                      <p className="text-sm text-gray-900 font-mono">{result.message}</p>
                    </div>
                  )}
                  {result.error && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Erro:</p>
                      <p className="text-sm text-red-700 font-mono">{result.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : total > 0 ? (
        <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-600">Nenhum resultado corresponde ao filtro</p>
        </div>
      ) : (
        <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-600">Clique em "Executar Todos" para começar</p>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
