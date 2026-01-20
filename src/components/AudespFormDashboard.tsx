import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle } from 'lucide-react';
import { audespValidator } from '../services/audespValidator';
import { audespJsonService } from '../services/audespJsonService';
import type { PrestacaoConta } from '../services/audespSchemaTypes';

export default function AudespFormDashboard() {
  const [formData, setFormData] = useState<Partial<PrestacaoConta>>({});
  const [validationResults, setValidationResults] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFormData(json);
        setMessage('✅ Arquivo importado com sucesso');
      } catch (error) {
        setMessage('❌ Erro ao importar arquivo JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr));
    element.setAttribute('download', 'prestacao-contas.json');
    element.click();
    setMessage('✅ Arquivo exportado com sucesso');
  };

  const handleValidate = () => {
    const results = audespValidator.validateAll(formData);
    setValidationResults(results);
    setMessage(results.isValid ? '✅ Dados validados com sucesso' : '⚠️ Existem erros de validação');
  };

  const handleSync = () => {
    const synced = audespJsonService.syncWithTemplate(formData as PrestacaoConta);
    setFormData(synced);
    setMessage('✅ Sincronizado com template AUDESP');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg text-white">
        <h3 className="text-2xl font-bold mb-2">✨ Sistema AUDESP v1.9</h3>
        <p className="text-blue-100">Validação, Sincronização e Transmissão de Dados</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        }`}>
          {message}
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h4 className="font-bold text-lg text-gray-800 mb-4">📋 Painel de Controle</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import Button */}
          <label className="flex items-center justify-center p-4 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-50 transition">
            <div className="flex items-center gap-2 text-blue-600">
              <Upload size={20} />
              <span className="font-medium">Importar JSON</span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium gap-2"
          >
            <Download size={20} />
            Exportar JSON
          </button>

          {/* Validate Button */}
          <button
            onClick={handleValidate}
            className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium gap-2"
          >
            <Check size={20} />
            Validar Dados
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            className="flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium gap-2"
          >
            <AlertCircle size={20} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-bold text-lg text-gray-800 mb-4">🔍 Resultados da Validação</h4>
          
          <div className={`p-4 rounded-lg mb-4 ${
            validationResults.isValid
              ? 'bg-green-100 border border-green-300'
              : 'bg-red-100 border border-red-300'
          }`}>
            <p className="font-medium text-gray-800">
              {validationResults.isValid ? '✅ Dados válidos' : '❌ Dados com erros'}
            </p>
          </div>

          {validationResults.errors && Object.keys(validationResults.errors).length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Erros encontrados:</h5>
              <ul className="space-y-1">
                {Object.entries(validationResults.errors).map(([field, errors]: any) => (
                  <li key={field} className="text-sm text-red-600">
                    <strong>{field}:</strong> {errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.warnings && validationResults.warnings.length > 0 && (
            <div className="space-y-2 mt-4">
              <h5 className="font-medium text-gray-700">Avisos:</h5>
              <ul className="space-y-1">
                {validationResults.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-sm text-yellow-600">
                    ⚠️ {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Form Data Preview */}
      {Object.keys(formData).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-bold text-lg text-gray-800 mb-4">📊 Dados Carregados</h4>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre className="text-xs text-gray-800">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-bold text-gray-800 mb-2">ℹ️ Sobre o Sistema AUDESP v1.9</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✅ <strong>26 Seções</strong> de dados estruturados</li>
          <li>✅ <strong>Validação Completa</strong> de formulários</li>
          <li>✅ <strong>Sincronização Bidirecional</strong> de dados</li>
          <li>✅ <strong>Transmissão Segura</strong> para AUDESP</li>
          <li>✅ <strong>Rastreamento de Protocolo</strong> de envio</li>
        </ul>
      </div>
    </div>
  );
}
