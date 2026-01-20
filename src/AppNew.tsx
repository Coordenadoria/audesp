import React, { useState, useMemo, useCallback } from 'react';
import { Download, Upload, Send, AlertCircle, CheckCircle, Eye, EyeOff, Menu, X } from 'lucide-react';
import FormBuilder from './components/FormBuilder';
import { calculateSummary, getAllSectionsStatus } from './services/validationService';

const INITIAL_DATA = {
  descritor: {},
  contratos: [],
  documentos_fiscais: [],
  pagamentos: [],
  bens_moveis: [],
  bens_imoveis: [],
  empregados: [],
  resumo_executivo: {}
};

const App: React.FC = () => {
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState<'form' | 'summary' | 'json'>('form');

  const summary = useMemo(() => calculateSummary(formData), [formData]);
  const sectionStatus = useMemo(() => getAllSectionsStatus(formData), [formData]);

  const handleExportJson = useCallback(() => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `audesp_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [formData]);

  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          setFormData(data);
        } catch (err) {
          alert('Erro ao carregar JSON: ' + (err as Error).message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-y-auto">
          <div className="p-4 border-b border-blue-700">
            <h1 className="text-xl font-bold">AUDESP v1.9</h1>
            <p className="text-xs text-blue-200">Prestação de Contas</p>
          </div>

          {/* Progress */}
          <div className="p-4 bg-blue-800">
            <div className="text-sm font-semibold mb-2">Progresso: {sectionStatus.percentage}%</div>
            <div className="w-full bg-blue-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all"
                style={{ width: `${sectionStatus.percentage}%` }}
              />
            </div>
            <div className="text-xs text-blue-200 mt-1">{sectionStatus.completed}/{sectionStatus.total} seções</div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-blue-700">
            <button
              onClick={() => setActiveView('form')}
              className={`w-full text-left px-4 py-3 font-medium transition ${
                activeView === 'form' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              📋 Formulário
            </button>
            <button
              onClick={() => setActiveView('summary')}
              className={`w-full text-left px-4 py-3 font-medium transition ${
                activeView === 'summary' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              📊 Resumo
            </button>
            <button
              onClick={() => setActiveView('json')}
              className={`w-full text-left px-4 py-3 font-medium transition ${
                activeView === 'json' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              {} JSON
            </button>
          </div>

          {/* Section Status */}
          <div className="p-4 border-b border-blue-700">
            <h3 className="text-sm font-semibold mb-3">Status das Seções</h3>
            {sectionStatus.sections.map(section => (
              <div key={section.id} className="flex items-center gap-2 text-xs mb-2 p-2 bg-blue-700 rounded">
                {section.complete ? (
                  <CheckCircle size={16} className="text-green-300" />
                ) : (
                  <AlertCircle size={16} className="text-yellow-300" />
                )}
                <span className="flex-1">{section.name}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleExportJson}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition"
            >
              <Download size={18} /> Exportar JSON
            </button>
            <button
              onClick={handleImportJson}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition"
            >
              <Upload size={18} /> Importar JSON
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium transition"
            >
              <Send size={18} /> Transmitir
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {activeView === 'form' && 'Formulário de Prestação de Contas'}
            {activeView === 'summary' && 'Resumo Executivo'}
            {activeView === 'json' && 'Visualização JSON'}
          </h2>
          <div className="w-24" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeView === 'form' && (
            <FormBuilder data={formData} onChange={setFormData} />
          )}

          {activeView === 'summary' && (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow m-4">
              <h1 className="text-2xl font-bold mb-6">Resumo Executivo</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-xs text-gray-600 font-medium">Documentos Fiscais</div>
                  <div className="text-2xl font-bold text-blue-600">{summary.total_documentos_fiscais}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total: R$ {summary.valor_total_documentos.toFixed(2)}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 font-medium">Pagamentos</div>
                  <div className="text-2xl font-bold text-green-600">{summary.total_pagamentos}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total: R$ {summary.valor_total_pagamentos.toFixed(2)}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-xs text-gray-600 font-medium">Contratos</div>
                  <div className="text-2xl font-bold text-purple-600">{summary.total_contratos}</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-xs text-gray-600 font-medium">Bens Móveis</div>
                  <div className="text-2xl font-bold text-orange-600">{summary.total_bens_moveis || 0}</div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-xs text-gray-600 font-medium">Bens Imóveis</div>
                  <div className="text-2xl font-bold text-red-600">{summary.total_bens_imoveis || 0}</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-xs text-gray-600 font-medium">Empregados</div>
                  <div className="text-2xl font-bold text-yellow-600">{summary.total_empregados}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3">Informações do Descritor</h3>
                {formData.descritor && Object.keys(formData.descritor).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(formData.descritor).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600 ml-2">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma informação preenchida</p>
                )}
              </div>
            </div>
          )}

          {activeView === 'json' && (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold mb-4">JSON Completo</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs border border-gray-300">
                  {JSON.stringify(formData, null, 2)}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(formData, null, 2))}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Copiar para Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
