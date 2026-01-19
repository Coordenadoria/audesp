import React, { useState, useEffect } from 'react';
import { JSONValidator, ValidationResult, AutoSuggestEngine } from '../services/jsonValidationService';

interface JSONPreviewProps {
  data: Record<string, any>;
  schema?: Record<string, any>;
  onChange?: (updatedData: Record<string, any>) => void;
  showValidation?: boolean;
  showSuggestions?: boolean;
  compact?: boolean;
}

export const JSONPreview: React.FC<JSONPreviewProps> = ({
  data,
  schema,
  onChange,
  showValidation = true,
  showSuggestions = true,
  compact = false
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Validar quando dados mudam
  useEffect(() => {
    if (showValidation && schema) {
      const result = JSONValidator.validate(data, schema);
      setValidation(result);
    }
  }, [data, schema, showValidation]);

  // Buscar campos
  const filteredFields = Object.entries(data).filter(([key, value]) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      key.toLowerCase().includes(searchLower) ||
      String(value).toLowerCase().includes(searchLower)
    );
  });

  // Toggle campo
  const toggleField = (field: string) => {
    const newSet = new Set(expandedFields);
    if (newSet.has(field)) {
      newSet.delete(field);
    } else {
      newSet.add(field);
    }
    setExpandedFields(newSet);
  };

  // Editar campo
  const handleEditField = (field: string, value: any) => {
    setEditingField(field);
    setEditingValue(String(value || ''));
  };

  // Salvar edição
  const handleSaveEdit = (field: string) => {
    const updatedData = { ...data };
    updatedData[field] = editingValue;

    // Aprender valor para auto-sugestão
    AutoSuggestEngine.learnValue(field, editingValue);

    onChange?.(updatedData);
    setEditingField(null);
    setEditingValue('');
  };

  // Renderizar valor
  const renderValue = (value: any) => {
    if (value === null || value === undefined) return 'vazio';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `[${value.length} itens]`;
    if (typeof value === 'object') return `{${Object.keys(value).length} props}`;
    return String(value);
  };

  // Obter status de validação
  const getFieldStatus = (field: string): 'error' | 'warning' | 'success' | 'empty' | null => {
    if (!validation) return null;

    const error = validation.errors.find(e => e.field === field);
    if (error) return 'error';

    const warning = validation.warnings.find(w => w.field === field);
    if (warning) return 'warning';

    if (data[field]) return 'success';
    return 'empty';
  };

  // Obter mensagem de status
  const getFieldMessage = (field: string): string | undefined => {
    if (!validation) return undefined;

    const error = validation.errors.find(e => e.field === field);
    if (error) return error.message;

    const warning = validation.warnings.find(w => w.field === field);
    if (warning) return warning.message;

    return undefined;
  };

  // Cor de status
  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'error':
        return 'border-red-300 bg-red-50';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-slate-200 bg-slate-50';
    }
  };

  const getStatusBadge = (status: string | null): string => {
    switch (status) {
      case 'error':
        return 'E';
      case 'warning':
        return 'A';
      case 'success':
        return 'V';
      default:
        return '-';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900">Preview do Preenchimento</h3>
        {validation && (
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-slate-600">{Object.keys(data).length - validation.errors.length} campos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-slate-600">{validation.errors.length} erros</span>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-slate-200">
        <input
          type="text"
          placeholder="Buscar campo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Validation Summary */}
      {validation && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">PROGRESSO</span>
            <span className="text-sm font-bold text-blue-600">{validation.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${validation.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="flex-1 overflow-y-auto">
        {filteredFields.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Nenhum campo encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredFields.map(([field, value]) => {
              const status = getFieldStatus(field);
              const message = getFieldMessage(field);
              const isComplex = typeof value === 'object' && value !== null;
              const isExpanded = expandedFields.has(field);

              return (
                <div key={field} className={`border-l-4 ${getStatusColor(status)}`}>
                  {/* Field Header */}
                  <div
                    className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => isComplex && toggleField(field)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`px-2 py-1 rounded text-xs font-bold text-white w-6 h-6 flex items-center justify-center ${
                        status === 'error' ? 'bg-red-500' :
                        status === 'warning' ? 'bg-yellow-500' :
                        status === 'success' ? 'bg-green-500' :
                        'bg-slate-400'
                      }`}>
                        {getStatusBadge(status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{field}</p>
                        {message && (
                          <p className="text-xs text-slate-600 mt-0.5">{message}</p>
                        )}
                      </div>
                    </div>

                    {isComplex && (
                      <span className="text-slate-400 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                  </div>

                  {/* Field Value */}
                  {editingField === field ? (
                    <div className="px-4 py-2 flex gap-2 bg-blue-50 border-t border-slate-200">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(field)}
                        className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className="px-3 py-1 text-sm font-medium bg-slate-300 text-slate-900 rounded hover:bg-slate-400 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div
                      className="px-4 py-2 flex items-center justify-between text-slate-600 border-t border-slate-100 cursor-pointer hover:bg-slate-50 group"
                      onClick={() => handleEditField(field, value)}
                    >
                      <span className="text-sm font-mono truncate">{renderValue(value)}</span>
                      <button
                        className="text-slate-400 group-hover:text-blue-600 transition text-xs opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditField(field, value);
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isComplex && isExpanded && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs font-mono text-slate-700 overflow-auto max-h-48">
                      {JSON.stringify(value, null, 2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && validation && validation.suggestions.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">SUGESTÕES</p>
          <ul className="space-y-1">
            {validation.suggestions.slice(0, 3).map((suggestion, idx) => (
              <li key={idx} className="text-xs text-blue-800 flex gap-2">
                <span>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw JSON */}
      <details className="border-t border-slate-200">
        <summary className="px-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 text-sm font-medium text-slate-900">
          JSON Bruto
        </summary>
        <pre className="px-4 py-2 bg-slate-900 text-green-400 text-xs font-mono overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default JSONPreview;
