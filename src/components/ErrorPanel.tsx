import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { ValidationError, ValidationWarning } from '../services/AUDESPValidator';

interface ErrorPanelProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completionPercentage: number;
  onErrorClick?: (error: ValidationError) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  errors,
  warnings,
  completionPercentage,
  onErrorClick,
  onClose,
  isOpen,
}) => {
  const criticalErrors = errors.filter((e) => e.severity === 'critical');
  const regularErrors = errors.filter((e) => e.severity === 'error');

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => onClose && onClose()}>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-700">
            {errors.length > 0 && (
              <span className="text-red-600">{errors.length} erros</span>
            )}
            {warnings.length > 0 && (
              <span className="ml-2 text-yellow-600">{warnings.length} avisos</span>
            )}
            {errors.length === 0 && warnings.length === 0 && (
              <span className="text-green-600">✓ Sem erros</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Validação da Prestação</h3>
          <p className="text-sm text-slate-200">
            Completude: {completionPercentage}%
          </p>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-slate-600 p-1 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              completionPercentage >= 80
                ? 'bg-green-500'
                : completionPercentage >= 50
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Critical Errors */}
        {criticalErrors.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="bg-red-50 px-4 py-3 flex items-center gap-2 border-b border-red-200">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span className="font-semibold text-red-700 text-sm">
                {criticalErrors.length} Erro(s) Crítico(s)
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {criticalErrors.map((error, idx) => (
                <ErrorItem
                  key={idx}
                  error={error}
                  onClick={() => onErrorClick?.(error)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Errors */}
        {regularErrors.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="bg-orange-50 px-4 py-3 flex items-center gap-2 border-b border-orange-200">
              <AlertCircle size={16} className="text-orange-600 flex-shrink-0" />
              <span className="font-semibold text-orange-700 text-sm">
                {regularErrors.length} Erro(s)
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {regularErrors.map((error, idx) => (
                <ErrorItem
                  key={idx}
                  error={error}
                  onClick={() => onErrorClick?.(error)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="bg-yellow-50 px-4 py-3 flex items-center gap-2 border-b border-yellow-200">
              <Info size={16} className="text-yellow-600 flex-shrink-0" />
              <span className="font-semibold text-yellow-700 text-sm">
                {warnings.length} Aviso(s)
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {warnings.map((warning, idx) => (
                <WarningItem key={idx} warning={warning} />
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {errors.length === 0 && warnings.length === 0 && (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-green-700">
              Nenhum erro encontrado!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              A prestação está pronta para validação final.
            </p>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="border-t border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
        <div className="space-y-1">
          <div>
            <span className="font-semibold">Total de Erros:</span> {errors.length}
          </div>
          <div>
            <span className="font-semibold">Total de Avisos:</span>{' '}
            {warnings.length}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ErrorItemProps {
  error: ValidationError;
  onClick?: () => void;
}

const ErrorItem: React.FC<ErrorItemProps> = ({ error, onClick }) => {
  const getSeverityColor = (severity: 'error' | 'critical') => {
    return severity === 'critical' ? 'text-red-600' : 'text-orange-600';
  };

  const getSeverityBg = (severity: 'error' | 'critical') => {
    return severity === 'critical' ? 'bg-red-50 hover:bg-red-100' : 'bg-orange-50 hover:bg-orange-100';
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer transition-colors ${getSeverityBg(error.severity)}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={14} className={`${getSeverityColor(error.severity)} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-gray-500 truncate">
            {error.path}
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {error.field}
          </p>
          <p className="text-sm text-gray-700 mt-1">{error.message}</p>
          {error.suggestion && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-600 border-l-2 border-gray-300">
              💡 {error.suggestion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface WarningItemProps {
  warning: ValidationWarning;
}

const WarningItem: React.FC<WarningItemProps> = ({ warning }) => {
  const getWarningIcon = () => {
    switch (warning.type) {
      case 'inconsistency':
        return '⚠️';
      case 'divergence':
        return '↔️';
      case 'missing-related':
        return '🔗';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors">
      <div className="flex items-start gap-2">
        <Info size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-gray-500 truncate">
            {warning.path}
          </div>
          <p className="text-sm text-gray-700 mt-1">
            {getWarningIcon()} {warning.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPanel;
