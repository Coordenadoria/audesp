/**
 * ErrorHelpPanel.tsx
 * 
 * Componente para exibir erros de transmissão com diagnóstico e sugestões
 */

import React from 'react';
import ErrorDiagnosticsService, { ErrorDiagnostic } from '../services/errorDiagnosticsService';
import JSONErrorViewer from './JSONErrorViewer';

interface ErrorHelpPanelProps {
  error: any;
  onDismiss: () => void;
  onRetry?: () => void;
  onAutoFix?: (fixedData: any) => void;
  jsonData?: any;
}

export const ErrorHelpPanel: React.FC<ErrorHelpPanelProps> = ({
  error,
  onDismiss,
  onRetry,
  onAutoFix,
  jsonData
}) => {
  const [diagnostics, setDiagnostics] = React.useState<ErrorDiagnostic[]>([]);
  const [expandedDiag, setExpandedDiag] = React.useState<number | null>(0);
  const [showJSON, setShowJSON] = React.useState(false);
  const [editedJSON, setEditedJSON] = React.useState(jsonData);

  React.useEffect(() => {
    const diags = ErrorDiagnosticsService.diagnoseError(error);
    setDiagnostics(diags);
  }, [error]);

  const handleAutoFix = () => {
    if (onAutoFix && jsonData) {
      const fixed = ErrorDiagnosticsService.suggestFixesForJSON(jsonData, diagnostics);
      onAutoFix(fixed);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-orange-50 border-orange-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🔍</span> Diagnóstico de Erro
            </h2>
            <button
              onClick={onDismiss}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">📋 Resumo</h3>
            <p className="text-blue-800 text-sm">
              {diagnostics.length} {diagnostics.length === 1 ? 'problema encontrado' : 'problemas encontrados'}.
              {diagnostics.some(d => d.code === 'SCHEMA_UNDEFINED') && (
                <> Seu JSON contém campos que não são permitidos pelo schema.</>
              )}
            </p>
          </div>

          {/* JSON Viewer Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowJSON(!showJSON)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
            >
              <span>📄</span>
              {showJSON ? '▼ Ocultar JSON' : '▶ Ver JSON com Erros'}
            </button>
          </div>

          {/* JSON Error Viewer */}
          {showJSON && jsonData && (
            <div className="mb-6 bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <JSONErrorViewer
                jsonData={editedJSON || jsonData}
                diagnostics={diagnostics}
                onEdit={(newData) => {
                  setEditedJSON(newData);
                }}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (onAutoFix && editedJSON) {
                      onAutoFix(editedJSON);
                      onDismiss();
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                >
                  ✨ Usar JSON Corrigido
                </button>
                <button
                  onClick={() => {
                    setEditedJSON(jsonData);
                    setShowJSON(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-semibold"
                >
                  ↺ Resetar
                </button>
              </div>
            </div>
          )}

          {/* Diagnostics */}
          <div className="space-y-3">
            {diagnostics.map((diag, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden ${getSeverityColor(diag.severity)}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedDiag(expandedDiag === index ? null : index)}
                  className="w-full px-4 py-3 flex items-start justify-between hover:opacity-80 transition"
                >
                  <div className="flex items-start gap-3 text-left">
                    <span className="text-lg">{getSeverityIcon(diag.severity)}</span>
                    <div>
                      <p className="font-bold text-gray-900">{diag.message}</p>
                      {diag.affectedField && (
                        <p className="text-xs text-gray-600 mt-1">
                          📍 Campo: <code className="bg-black bg-opacity-10 px-1 rounded">{diag.affectedField}</code>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedDiag === index ? '▼' : '▶'}
                  </span>
                </button>

                {/* Details */}
                {expandedDiag === index && (
                  <div className="px-4 py-3 border-t bg-white bg-opacity-50 space-y-2">
                    <div>
                      <p className="text-xs font-bold text-gray-700 uppercase">Causa:</p>
                      <p className="text-sm text-gray-800 mt-1">{diag.cause}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-700 uppercase">Solução:</p>
                      <p className="text-sm text-gray-800 mt-1">{diag.solution}</p>
                    </div>

                    {diag.code === 'SCHEMA_UNDEFINED' && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-xs">
                        <p className="font-bold text-yellow-900">💡 Dica:</p>
                        <p className="text-yellow-800 mt-1">
                          Remova campos extras do seu JSON. O schema Audesp é rigoroso e não permite propriedades adicionais.
                        </p>
                      </div>
                    )}

                    {diag.code === 'SCHEMA_MAX_PROPS' && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded text-xs">
                        <p className="font-bold text-yellow-900">💡 Dica:</p>
                        <p className="text-yellow-800 mt-1">
                          Este objeto tem limite de propriedades. Verifique quais campos são obrigatórios e remova os extras.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error Details */}
          {error.message && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Detalhes Técnicos:</p>
              <pre className="text-xs text-gray-800 overflow-auto max-h-40 bg-white p-3 rounded border border-gray-300">
                {typeof error.message === 'string'
                  ? error.message
                  : JSON.stringify(error.message, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Fechar
          </button>

          {onAutoFix && diagnostics.length > 0 && (
            <button
              onClick={handleAutoFix}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <span>✨</span> Corrigir Automaticamente
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span>🔄</span> Tentar Novamente
            </button>
          )}
        </div>

        {/* Help Footer */}
        <div className="px-6 py-3 bg-blue-50 border-t text-xs text-gray-600">
          <p>
            💡 <strong>Dica:</strong> Se o problema persistir após correção, verifique se todos os campos obrigatórios estão preenchidos corretamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorHelpPanel;
