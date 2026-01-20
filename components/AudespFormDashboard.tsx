/**
 * Componente Integrador AUDESP - Dashboard de Sincronização
 * Gerencia importação, exportação, validação e edição do formulário
 */

import React, { useState } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { useAudespSync, useAudespValidation, useAudespJson } from '../hooks/useAudespSync';

interface AudespFormDashboardProps {
  onFormStateChange?: (isDirty: boolean, isValid: boolean) => void;
}

export const AudespFormDashboard: React.FC<AudespFormDashboardProps> = ({ onFormStateChange }) => {
  const sync = useAudespSync(true);
  const validation = useAudespValidation();
  const json = useAudespJson();

  const [showJson, setShowJson] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Notificar mudanças de estado
  React.useEffect(() => {
    onFormStateChange?.(sync.isDirty, validation.isValid);
  }, [sync.isDirty, validation.isValid, onFormStateChange]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const success = await json.uploadJson(file);
      setImportMessage(success ? 'JSON importado com sucesso!' : 'Erro ao importar JSON');
      setTimeout(() => setImportMessage(''), 3000);
    } catch (error: any) {
      setImportMessage(`Erro: ${error.message}`);
    }
  };

  const handleImportJson = () => {
    try {
      const result = sync.importJson(jsonInput);
      if (result.success) {
        setImportMessage('JSON importado com sucesso!');
        setJsonInput('');
        setShowJson(false);
      } else {
        setImportMessage(`Erro: ${result.errors.join(', ')}`);
      }
      setTimeout(() => setImportMessage(''), 3000);
    } catch (error: any) {
      setImportMessage(`Erro: ${error.message}`);
    }
  };

  const handleExportJson = () => {
    json.downloadJson();
    setImportMessage('JSON exportado com sucesso!');
    setTimeout(() => setImportMessage(''), 3000);
  };

  const handleValidate = () => {
    validation.validate();
    setShowValidation(true);
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja limpar o formulário?')) {
      sync.reset();
      setJsonInput('');
      setShowJson(false);
      setShowValidation(false);
    }
  };

  const handleUndo = () => {
    const success = sync.undo();
    if (success) {
      setImportMessage('Última alteração desfeita');
      setTimeout(() => setImportMessage(''), 2000);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Cabeçalho com Status */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestação de Contas AUDESP</h1>
          <p className="text-sm text-gray-600 mt-1">Sistema de Gestão de Dados</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status de Validação */}
          {validation.isValid ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Válido</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{validation.errors.length} Erro(s)</span>
            </div>
          )}

          {/* Status de Sincronização */}
          {sync.isDirty ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Não salvo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Sincronizado</span>
            </div>
          )}
        </div>
      </div>

      {/* Mensagens */}
      {importMessage && (
        <div className={`p-3 rounded-lg ${
          importMessage.startsWith('Erro') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {importMessage}
        </div>
      )}

      {sync.error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          Erro: {sync.error}
        </div>
      )}

      {/* Barra de Ferramentas */}
      <div className="flex flex-wrap gap-2">
        {/* Importação */}
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Importar Arquivo</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showJson ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showJson ? 'Ocultar' : 'Colar'} JSON</span>
          </button>
        </div>

        {/* Exportação */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar JSON
        </button>

        {/* Validação */}
        <button
          onClick={handleValidate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Validar
        </button>

        {/* Desfazer */}
        {sync.changeCount > 0 && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Desfazer ({sync.changeCount})
          </button>
        )}

        {/* Limpar */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </button>
      </div>

      {/* Seção de Importação JSON */}
      {showJson && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <h3 className="font-semibold text-gray-900">Importar JSON AUDESP</h3>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole o JSON aqui..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleImportJson}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Importar
          </button>
        </div>
      )}

      {/* Seção de Validação */}
      {showValidation && validation && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-900">Resultado da Validação</h3>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-600">Total de Erros</p>
              <p className="text-2xl font-bold text-red-600">{validation.errors.length}</p>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-600">Total de Avisos</p>
              <p className="text-2xl font-bold text-yellow-600">{validation.warnings.length}</p>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-600">Seções</p>
              <p className="text-2xl font-bold text-blue-600">{Object.keys(validation.sections).length}</p>
            </div>
          </div>

          {/* Erros */}
          {validation.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">Erros encontrados:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validation.errors.slice(0, 10).map((error, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border-l-4 border-red-500 text-sm">
                    <p className="font-mono text-xs text-gray-600">{error.path}</p>
                    <p className="text-red-700">{error.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avisos */}
          {validation.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2">Avisos:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validation.warnings.slice(0, 5).map((warning, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border-l-4 border-yellow-500 text-sm">
                    <p className="font-mono text-xs text-gray-600">{warning.path}</p>
                    <p className="text-yellow-700">{warning.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seções */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status por Seção:</h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {Object.entries(validation.sections).map(([section, status]: [string, any]) => (
                <div
                  key={section}
                  className={`p-2 rounded text-sm ${
                    status.valid
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className="font-mono text-xs text-gray-600">{section}</p>
                  <p className={status.valid ? 'text-green-700' : 'text-red-700'}>
                    {status.valid ? '✓ OK' : `✗ ${status.errorCount} erro(s)`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Informações de Sincronização */}
      <div className="grid grid-cols-4 gap-4 text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-600">Status</p>
          <p className="text-sm font-semibold text-gray-900">
            {sync.isDirty ? 'Não Salvo' : 'Sincronizado'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Mudanças</p>
          <p className="text-sm font-semibold text-gray-900">{sync.changeCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Validação</p>
          <p className="text-sm font-semibold text-gray-900">
            {validation.isValid ? 'Válido' : 'Inválido'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Última Sincronização</p>
          <p className="text-sm font-semibold text-gray-900">
            {sync.syncedAt
              ? new Date(sync.syncedAt).toLocaleTimeString('pt-BR')
              : 'Nunca'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudespFormDashboard;
