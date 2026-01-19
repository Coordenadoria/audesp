/**
 * LAYOUT PRINCIPAL MODERNO
 * Interface profissional e limpa para Prestação de Contas Anual
 * Sem emojis - Design centrado no usuário
 */

import React, { useState, useMemo } from 'react';
import { PrestacaoContas } from '../types';
import { FormSections } from './FormSections';
import PDFViewerModern from './PDFViewerModern';
import JSONViewerModern from './JSONViewerModern';

export interface ModernMainLayoutProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  formData: PrestacaoContas;
  updateField: (field: string, value: any) => void;
  updateItem: (path: string, index: number, updates: any) => void;
  addItem: (path: string, newItem: any) => void;
  removeItem: (path: string, index: number) => void;
  handleExtraction: () => void;
  handleDownload: () => void;
  onTransmit: () => void;
  isLoading?: boolean;
  sectionStatus?: Record<string, any>;
}

const ModernMainLayout: React.FC<ModernMainLayoutProps> = ({
  activeSection,
  setActiveSection,
  formData,
  updateField,
  updateItem,
  addItem,
  removeItem,
  handleExtraction,
  handleDownload,
  onTransmit,
  isLoading = false,
  sectionStatus = {}
}) => {
  const [activePanel, setActivePanel] = useState<'form' | 'pdf' | 'json'>('form');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Seções disponíveis
  const sections = useMemo(() => [
    { id: 'identificacao', label: 'Identificação do Convênio' },
    { id: 'prefeito-secretario', label: 'Prefeito e Secretário' },
    { id: 'entidades-convenio', label: 'Entidades do Convênio' },
    { id: 'documentos-convenio', label: 'Documentos do Convênio' },
    { id: 'demonstracoes', label: 'Demonstrações Contábeis' },
    { id: 'resultado-exercicio', label: 'Resultado do Exercício' },
    { id: 'analise-resultado', label: 'Análise do Resultado' },
    { id: 'responsavel-prestacao', label: 'Responsável da Prestação' }
  ], []);

  // Calcula progressão geral
  const totalProgress = useMemo(() => {
    const completed = sections.filter(s => sectionStatus[s.id]?.isValid).length;
    return Math.round((completed / sections.length) * 100);
  }, [sections, sectionStatus]);

  // Conta campos preenchidos
  const completedFields = useMemo(() => {
    let count = 0;
    const countFields = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object' && !Array.isArray(val)) countFields(val);
        else if (val && val !== '') count++;
      });
    };
    countFields(formData);
    return count;
  }, [formData]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Prestação de Contas Anual
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Sistema de Transmissão para Audesp - Progresso: {totalProgress}% completo
              </p>
            </div>
            
            <button
              onClick={onTransmit}
              disabled={isLoading || totalProgress < 100}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                isLoading 
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : totalProgress < 100
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? 'Enviando...' : 'Enviar para Audesp'}
            </button>
          </div>

          {/* PROGRESS BAR */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Progresso do Formulário</span>
              <span className="text-xs font-bold text-slate-900">{totalProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col ${
            sidebarOpen ? 'w-72' : 'w-0'
          }`}
        >
          {/* SIDEBAR CONTENT */}
          <div className="flex-1 overflow-y-auto">
            {/* SECTIONS */}
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Seções do Formulário
              </h2>
              <div className="space-y-1">
                {sections.map((section) => {
                  const status = sectionStatus[section.id];
                  const isActive = activeSection === section.id;
                  const isValid = status?.isValid;
                  const hasErrors = status?.hasErrors;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-3 flex-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                            isValid
                              ? 'bg-green-500'
                              : hasErrors
                              ? 'bg-red-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span className="truncate">{section.label}</span>
                      </span>
                      {isActive && (
                        <span className="text-blue-600 text-lg ml-2">→</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VISUALIZATION MODES */}
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Visualizações
              </h2>
              <div className="space-y-2">
                {[
                  { id: 'form', label: 'Formulário', icon: '📋' },
                  { id: 'pdf', label: 'Importar PDF', icon: '📄' },
                  { id: 'json', label: 'Estrutura JSON', icon: '{}' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActivePanel(view.id as any)}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      activePanel === view.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{view.icon}</span>
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="p-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Ações Rápidas
              </h2>
              <div className="space-y-2">
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Baixar JSON
                </button>
                <button
                  onClick={handleExtraction}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Extrair Dados
                </button>
              </div>
            </div>

            {/* STATISTICS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Campos Preenchidos</p>
                  <p className="text-lg font-bold text-slate-900">{completedFields}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Seções Válidas</p>
                  <p className="text-lg font-bold text-green-600">
                    {sections.filter(s => sectionStatus[s.id]?.isValid).length}/{sections.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* TOOLBAR */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium text-sm"
              title={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
            >
              {sidebarOpen ? '← Fechar Painel' : 'Abrir Painel →'}
            </button>

            <div className="text-sm font-semibold text-slate-700">
              {activePanel === 'form' && (
                <span>
                  {sections.find(s => s.id === activeSection)?.label || 'Formulário'}
                </span>
              )}
              {activePanel === 'pdf' && <span>Importar Dados de PDF com OCR</span>}
              {activePanel === 'json' && <span>Visualizador de Estrutura JSON</span>}
            </div>

            <div className="text-xs text-slate-500">
              {new Date().toLocaleString('pt-BR')}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'form' && (
              <div className="h-full overflow-y-auto bg-slate-50 p-6">
                <div className="max-w-4xl">
                  <FormSections
                    activeSection={activeSection}
                    formData={formData}
                    updateField={updateField}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    handleExtraction={handleExtraction}
                    handleDownload={handleDownload}
                  />
                </div>
              </div>
            )}

            {activePanel === 'pdf' && (
              <div className="h-full bg-white">
                <PDFViewerModern
                  onOCRComplete={(text) => {
                    console.log('OCR completado:', text);
                  }}
                  onPDFLoaded={() => {
                    console.log('PDF carregado');
                  }}
                />
              </div>
            )}

            {activePanel === 'json' && (
              <div className="h-full bg-white">
                <JSONViewerModern data={formData} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div>
            Audesp - Sistema de Prestação de Contas Eletrônica
          </div>
          <div className="flex gap-4">
            <span>Versão 2.2</span>
            <span>Status: Pronto</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernMainLayout;
