import React from 'react';
import { PrestacaoContas } from '../types';
import { getMissingFieldsForTransmission, MissingFieldsReport } from '../services/validationService';

interface MissingFieldsPanelProps {
  data: PrestacaoContas;
  onClose?: () => void;
}

/**
 * Painel que mostra ao usuário exatamente quais campos faltam para transmissão
 * com referência ao manual e descrição clara
 */
export const MissingFieldsPanel: React.FC<MissingFieldsPanelProps> = ({ data, onClose }) => {
  const report = getMissingFieldsForTransmission(data);

  if (report.readyToTransmit && report.totalMissing === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-green-800">Pronto para Transmissão!</h3>
            <p className="mt-2 text-sm text-green-700">
              Todos os campos obrigatórios foram preenchidos. Você pode enviar a prestação de contas para o Audesp Piloto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-yellow-800">
              {report.totalMissing} Campo(s) Faltando
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Complete os campos abaixo para poder transmitir a prestação de contas. Siga as referências do Manual v1.9.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-yellow-600 hover:text-yellow-700"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Categorias de Campos Faltando */}
      <div className="mt-6 space-y-6">
        {Object.entries(report.categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="bg-white rounded-lg p-4 border border-yellow-100">
            <h4 className="font-semibold text-yellow-900 mb-2">{categoryKey}</h4>
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            
            <ul className="space-y-2">
              {category.fields.map((field, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-700 mr-3 flex-shrink-0">
                    ✕
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{field.fieldName}</p>
                    <p className="text-gray-600">{field.requirement}</p>
                    {field.manualRef && (
                      <p className="text-xs text-blue-600 mt-1">📖 {field.manualRef}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Dicas */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Dicas para Completar</h5>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Preencha um campo por vez e verifique a validação em tempo real</li>
          <li>Consulte o Manual Técnico v1.9 para entender o formato esperado</li>
          <li>Campos com asterisco (*) são obrigatórios</li>
          <li>Valores monetários devem usar ponto (.) como separador decimal</li>
          <li>Datas devem estar no formato YYYY-MM-DD (ISO 8601)</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-yellow-200">
        <p className="text-sm text-gray-700">
          Quando todos os campos forem preenchidos corretamente, o botão "Transmitir" ficará ativado.
        </p>
      </div>
    </div>
  );
};
