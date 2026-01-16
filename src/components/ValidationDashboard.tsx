/**
 * DASHBOARD DE VALIDAÇÃO - CORRIGIDO E FUNCIONAL
 * Componente simplificado para validação de prestação de contas
 */

import React, { useState, useMemo } from 'react';
import { PrestacaoContas } from '../types';
import { validatePrestacaoContas } from '../services/advancedValidationService';
import { AuditLogger } from '../services/auditService';

interface ValidationDashboardProps {
  formData: PrestacaoContas;
  userId?: string;
}

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  formData,
  userId = 'anonymous'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Validação memoizada
  const validationResult = useMemo(() => {
    return validatePrestacaoContas(formData);
  }, [formData]);

  // Estatísticas
  const stats = {
    totalErrors: validationResult.errors.length,
    totalWarnings: validationResult.warnings.length,
    isValid: validationResult.isValid,
    completeness: Object.keys(validationResult.summary.sections).length
  };

  const handleLogValidation = () => {
    AuditLogger.logValidation(!stats.isValid, stats.totalErrors, userId);
  };

  const errorsBySection = validationResult.errors.reduce(
    (acc: Record<string, any[]>, err) => {
      const section = err.section || 'Geral';
      if (!acc[section]) acc[section] = [];
      acc[section].push(err);
      return acc;
    },
    {}
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      {/* CABEÇALHO */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          ✓ Validação da Prestação de Contas
        </h2>
        <p className="text-sm text-slate-500">
          Sistema automático de validação com sugestões de correção
        </p>
      </div>

      {/* RESUMO VISUAL */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Card: Status */}
        <div
          className={`p-4 rounded-lg border-l-4 ${
            stats.isValid
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <div className="text-xs font-bold uppercase text-slate-600 mb-1">
            Status
          </div>
          <div
            className={`text-2xl font-bold ${
              stats.isValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {stats.isValid ? '✅ OK' : '❌ Erros'}
          </div>
        </div>

        {/* Card: Erros */}
        <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
          <div className="text-xs font-bold uppercase text-slate-600 mb-1">
            Erros
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.totalErrors}
          </div>
        </div>

        {/* Card: Avisos */}
        <div className="p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
          <div className="text-xs font-bold uppercase text-slate-600 mb-1">
            Avisos
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.totalWarnings}
          </div>
        </div>

        {/* Card: Completude */}
        <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
          <div className="text-xs font-bold uppercase text-slate-600 mb-1">
            Seções
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.completeness}
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO */}
      {!stats.isValid && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">
              Correção necessária
            </span>
            <span className="text-sm font-bold text-slate-600">
              {Math.round(
                ((stats.completeness - stats.totalErrors) / stats.completeness) *
                  100
              )}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all"
              style={{
                width: `${Math.max(
                  5,
                  ((stats.completeness - stats.totalErrors) / stats.completeness) *
                    100
                )}%`
              }}
            />
          </div>
        </div>
      )}

      {/* SEÇÃO DE ERROS */}
      {stats.totalErrors > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🔴</span>
              <span className="font-bold text-red-700">
                {stats.totalErrors} Erro(s) Encontrado(s)
              </span>
            </div>
            <span className="text-slate-500">
              {showDetails ? '▼' : '▶'}
            </span>
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4">
              {Object.entries(errorsBySection).map(([section, errors]: [string, any[]]) => (
                <div key={section} className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-bold text-slate-700 mb-2">
                    📋 {section}
                  </h4>
                  <ul className="space-y-1">
                    {errors.map((error, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-slate-600 bg-red-50 p-2 rounded"
                      >
                        <strong>{error.field}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO DE AVISOS */}
      {stats.totalWarnings > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="font-bold text-yellow-700">
              {stats.totalWarnings} Aviso(s)
            </span>
          </div>
          <ul className="space-y-1">
            {validationResult.warnings.slice(0, 5).map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SUCESSO */}
      {stats.isValid && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-bold text-green-700">
                Validação Concluída!
              </h4>
              <p className="text-sm text-green-600">
                Nenhum erro encontrado. Sistema pronto para transmissão.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOTÕES DE AÇÃO */}
      <div className="flex gap-3">
        <button
          onClick={handleLogValidation}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <span>📊</span> Registrar Validação
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
        >
          {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
        </button>
      </div>

      {/* RODAPÉ */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          ℹ️ Validação automática baseada em 20+ regras de negócio. Para alterações,
          revise os campos indicados acima.
        </p>
      </div>
    </div>
  );
};

export default ValidationDashboard;
