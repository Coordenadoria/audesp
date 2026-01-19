/**
 * JSONErrorViewer.tsx
 * 
 * Componente para visualizar JSON com highlighting de erros
 * Aponta exatamente onde estão os problemas e sugere soluções
 */

import React, { useState } from 'react';
import { ErrorDiagnostic } from '../services/errorDiagnosticsService';

interface JSONErrorViewerProps {
  jsonData: any;
  diagnostics: ErrorDiagnostic[];
  onEdit?: (newData: any) => void;
}

interface JSONNode {
  path: string;
  key: string;
  value: any;
  level: number;
  isError: boolean;
  errorInfo?: ErrorDiagnostic;
}

export const JSONErrorViewer: React.FC<JSONErrorViewerProps> = ({
  jsonData,
  diagnostics,
  onEdit
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Mapear paths de erro para diagnósticos
  const errorMap = new Map<string, ErrorDiagnostic>();
  diagnostics.forEach(diag => {
    if (diag.affectedField) {
      const path = `$.${diag.affectedField}`;
      errorMap.set(path, diag);
    }
  });

  const togglePath = (path: string) => {
    const newSet = new Set(expandedPaths);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedPaths(newSet);
  };

  const getErrorForPath = (path: string): ErrorDiagnostic | undefined => {
    // Verificar exato
    if (errorMap.has(path)) return errorMap.get(path);

    // Verificar se é pai de um caminho com erro
    for (const [errorPath] of errorMap) {
      if (errorPath.startsWith(path + '.') || errorPath.startsWith(path + '[')) {
        return errorMap.get(errorPath);
      }
    }

    return undefined;
  };

  const renderValue = (value: any, path: string, level: number) => {
    const error = getErrorForPath(path);
    const isExpanded = expandedPaths.has(path);

    // Valores primitivos
    if (value === null) {
      return (
        <span className={`font-mono text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          null
        </span>
      );
    }

    if (typeof value !== 'object') {
      return (
        <span className={`font-mono text-xs ${error ? 'text-red-600' : 'text-blue-600'}`}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      );
    }

    // Array
    if (Array.isArray(value)) {
      return (
        <div>
          <button
            onClick={() => togglePath(path)}
            className="font-mono text-xs text-blue-600 hover:text-blue-800 transition"
          >
            {isExpanded ? '▼' : '▶'} [{value.length}]
          </button>

          {isExpanded && (
            <div className="ml-4 border-l border-gray-300 pl-2">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">[{index}]: </span>
                  {renderValue(item, `${path}[${index}]`, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Object
    return (
      <div>
        <button
          onClick={() => togglePath(path)}
          className={`font-mono text-xs transition ${
            error
              ? 'text-red-600 hover:text-red-800 font-bold'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {isExpanded ? '▼' : '▶'} {'{'}...{'}'}
        </button>

        {isExpanded && (
          <div
            className={`ml-4 border-l ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } pl-2 py-1`}
          >
            {Object.entries(value).map(([key, val]) => {
              const childPath = `${path}.${key}`;
              const childError = getErrorForPath(childPath);

              return (
                <div
                  key={key}
                  className={`py-1 px-2 rounded ${
                    childError
                      ? 'bg-red-100 border-l-2 border-red-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Key */}
                  <span
                    className={`font-mono text-xs font-semibold ${
                      childError ? 'text-red-700' : 'text-purple-600'
                    }`}
                  >
                    "{key}"
                  </span>
                  <span className="text-gray-600">: </span>

                  {/* Value */}
                  {editingPath === childPath ? (
                    <div className="mt-1 p-2 bg-white border border-yellow-300 rounded">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => {
                            try {
                              // Tentar parsear como JSON
                              let newVal = editValue;
                              try {
                                newVal = JSON.parse(editValue);
                              } catch {
                                // Se não for JSON válido, manter como string
                              }

                              const newData = JSON.parse(JSON.stringify(jsonData));
                              const parts = childPath.slice(2).split('.');
                              let current = newData;
                              for (let i = 0; i < parts.length - 1; i++) {
                                current = current[parts[i]];
                              }
                              current[parts[parts.length - 1]] = newVal;

                              onEdit?.(newData);
                              setEditingPath(null);
                            } catch (e) {
                              alert('Erro ao salvar: ' + (e as Error).message);
                            }
                          }}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          ✓ Salvar
                        </button>
                        <button
                          onClick={() => setEditingPath(null)}
                          className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-block">
                      {renderValue(val, childPath, level + 1)}
                      {childError && (
                        <button
                          onClick={() => {
                            setEditingPath(childPath);
                            setEditValue(
                              typeof val === 'string' ? val : JSON.stringify(val)
                            );
                          }}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          [editar]
                        </button>
                      )}
                    </div>
                  )}

                  {/* Error Info */}
                  {childError && (
                    <div className="mt-1 p-2 bg-red-100 border-l-2 border-red-500 rounded">
                      <p className="text-xs font-bold text-red-700">⚠️ Erro:</p>
                      <p className="text-xs text-red-600 mt-1">{childError.message}</p>
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Solução:</strong> {childError.solution}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96 border border-gray-700">
      <div className="mb-2 pb-2 border-b border-gray-700">
        <p className="text-yellow-400 text-xs font-bold">
          📄 JSON com Highlighting de Erros
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Campos em vermelho têm erros. Clique [editar] para corrigir.
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-blue-400">{'{'}</span>
        <div className="ml-4">
          {renderValue(jsonData, '$', 0)}
        </div>
        <span className="text-blue-400">{'}'}</span>
      </div>
    </div>
  );
};

export default JSONErrorViewer;
