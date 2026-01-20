import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { audespTransmissionService } from '../services/audespTransmissionService';
import type { PrestacaoConta } from '../services/audespSchemaTypes';

interface Props {
  formData: Partial<PrestacaoConta>;
  isValid: boolean;
  onTransmissionComplete?: (protocol: string) => void;
}

export default function AudespTransmissionComponent({
  formData,
  isValid,
  onTransmissionComplete,
}: Props) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionResult, setTransmissionResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTransmit = async () => {
    if (!isValid) {
      setError('❌ Formulário contém erros. Valide antes de transmitir.');
      return;
    }

    setIsTransmitting(true);
    setError('');

    try {
      const result = await audespTransmissionService.transmitData(
        formData as PrestacaoConta
      );

      setTransmissionResult(result);
      if (result.protocol && onTransmissionComplete) {
        onTransmissionComplete(result.protocol);
      }
    } catch (err: any) {
      setError(`❌ Erro na transmissão: ${err.message}`);
      setTransmissionResult({
        success: false,
        error: err.message,
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">📤 Transmissão de Dados</h3>
        <p className="text-gray-600">Enviar dados validados para a API AUDESP</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Transmission Status */}
      {transmissionResult && (
        <div className={`p-4 rounded-lg border-2 ${
          transmissionResult.success
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start gap-3">
            {transmissionResult.success ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            )}
            <div className="flex-1">
              <h4 className={`font-bold ${
                transmissionResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {transmissionResult.success ? '✅ Transmissão Bem-Sucedida' : '❌ Falha na Transmissão'}
              </h4>
              
              {transmissionResult.protocol && (
                <div className="mt-2 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 font-mono">
                    <strong>Protocolo:</strong> {transmissionResult.protocol}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ⏰ {new Date(transmissionResult.timestamp || Date.now()).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {transmissionResult.error && (
                <p className="text-sm text-red-700 mt-2">{transmissionResult.error}</p>
              )}

              {transmissionResult.details && (
                <div className="mt-3 text-xs bg-white bg-opacity-50 p-2 rounded max-h-48 overflow-auto">
                  <pre className="text-gray-700">
                    {JSON.stringify(transmissionResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Data Summary */}
      {Object.keys(formData).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-3">📋 Resumo dos Dados</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(formData).slice(0, 9).map(([key, value]) => (
              <div key={key} className="bg-white p-2 rounded border border-gray-200">
                <p className="text-gray-600 text-xs">{key}</p>
                <p className="text-gray-900 font-medium truncate">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                </p>
              </div>
            ))}
          </div>
          {Object.keys(formData).length > 9 && (
            <p className="text-xs text-gray-600 mt-2">
              ... e mais {Object.keys(formData).length - 9} campos
            </p>
          )}
        </div>
      )}

      {/* Transmission Button */}
      <div className="flex gap-4">
        <button
          onClick={handleTransmit}
          disabled={isTransmitting || !isValid || Object.keys(formData).length === 0}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold text-lg transition ${
            isTransmitting || !isValid || Object.keys(formData).length === 0
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTransmitting ? (
            <>
              <Loader size={20} className="animate-spin" />
              Transmitindo...
            </>
          ) : (
            <>
              <Send size={20} />
              Transmitir para AUDESP
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-gray-700">
        <p>
          <strong>💡 Dica:</strong> Certifique-se de que todos os dados foram validados
          antes de realizar a transmissão. O protocolo será fornecido após a confirmação.
        </p>
      </div>

      {/* Disabled State Reasons */}
      {(Object.keys(formData).length === 0 || !isValid) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p className="font-medium mb-1">⚠️ Transmissão desabilitada por:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.keys(formData).length === 0 && (
              <li>Nenhum dado carregado no formulário</li>
            )}
            {!isValid && (
              <li>Existem erros de validação no formulário</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
