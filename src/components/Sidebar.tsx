
import React, { useRef, useState } from 'react';
import { FolderInput, ChevronDown, ChevronRight, FileJson, Send } from 'lucide-react';
import { SectionStatus } from '../services/validationService';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onTransmit: () => void;
  onDownload: () => void;
  onLoadJson: (file: File) => void;
  onNew: () => void;
  onSaveDraft: () => void;
  onImportFullPdf: () => void;
  sectionStatus: Record<string, SectionStatus>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  setActiveSection, 
  onTransmit, 
  onDownload, 
  onLoadJson,
  onNew,
  onSaveDraft,
  onImportFullPdf,
  sectionStatus
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for collapsible sections
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
      'S1': true, 'S2': true, 'S3': false, 'S4': false, 'S5': false, 'S6': false
  });

  const toggleGroup = (id: string) => {
      setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
      {
          id: 'S1',
          title: 'SEÇÃO 1 — IDENTIFICAÇÃO',
          items: [
              { id: 'descritor', label: 'Descritor' },
              { id: 'codigo_ajuste', label: 'Código do Ajuste' },
              { id: 'dados_gerais', label: 'Dados da Entidade' },
              { id: 'prestacao_benef', label: 'Prestação Beneficiária' },
              { id: 'responsaveis', label: 'Responsáveis' }
          ]
      },
      {
          id: 'S2',
          title: 'SEÇÃO 2 — FINANCEIRO',
          items: [
              { id: 'empenhos', label: 'Empenhos' },
              { id: 'repasses', label: 'Repasses Recebidos' },
              { id: 'receitas', label: 'Outras Receitas' },
              { id: 'contratos', label: 'Contratos' },
              { id: 'documentos_fiscais', label: 'Documentos Fiscais' },
              { id: 'pagamentos', label: 'Pagamentos' },
              { id: 'glosas', label: 'Glosas' },
              { id: 'ajustes_saldo', label: 'Ajustes de Saldo' },
              { id: 'descontos', label: 'Descontos' },
              { id: 'devolucoes', label: 'Devoluções' },
              { id: 'disponibilidades', label: 'Disponibilidades' }
          ]
      },
      {
          id: 'S3',
          title: 'SEÇÃO 3 — RELATÓRIOS',
          items: [
              { id: 'relatorio_atividades', label: 'Relatório Atividades' },
              { id: 'relatorio_gov', label: 'Relatório Governamental' }
          ]
      },
      {
          id: 'S4',
          title: 'SEÇÃO 4 — EMPREGADOS E BENS',
          items: [
              { id: 'relacao_empregados', label: 'Relação de Empregados' },
              { id: 'servidores_cedidos', label: 'Servidores Cedidos' },
              { id: 'relacao_bens', label: 'Relação de Bens' }
          ]
      },
      {
          id: 'S5',
          title: 'SEÇÃO 5 — PUBLICAÇÕES',
          items: [
              { id: 'demonstracoes', label: 'Demonstrações Contábeis' },
              { id: 'publicacoes', label: 'Publicações Parecer/Ata' }
          ]
      },
      {
          id: 'S6',
          title: 'SEÇÃO 6 — DECLARAÇÕES',
          items: [
              { id: 'declaracoes', label: 'Declarações' },
              { id: 'transparencia', label: 'Transparência' },
              { id: 'parecer', label: 'Parecer Conclusivo' }
          ]
      }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadJson(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-72 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 font-sans border-r border-slate-800">
      <div className="p-5 border-b border-slate-800 bg-slate-950">
        <h1 className="text-xl font-extrabold flex flex-col">
            <span className="text-blue-500 tracking-wide">AUDESP</span>
            <span className="text-white tracking-widest text-xs">CONNECT FASE V</span>
        </h1>
      </div>

      <div className="p-3 bg-slate-800/50 border-b border-slate-700">
        <button 
            onClick={(e) => { e.preventDefault(); onImportFullPdf(); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-xs font-bold transition-colors shadow-md border border-indigo-500"
        >
            <FolderInput size={14} />
            Importar PDF Completo
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
         {/* Dashboard Link */}
         <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeSection === 'dashboard' ? 'bg-blue-900/40 text-blue-300 border-l-4 border-blue-500' : 'text-slate-400 hover:text-white'}`}
         >
            <div className="w-4">📊</div>
            Dashboard Geral
         </button>

         {/* Reports Dashboard Link */}
         <button
            onClick={() => setActiveSection('reports')}
            className={`w-full text-left px-4 py-3 text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeSection === 'reports' ? 'bg-purple-900/40 text-purple-300 border-l-4 border-purple-500' : 'text-slate-400 hover:text-white'}`}
         >
            <div className="w-4">📋</div>
            Validação & Relatórios
         </button>

         {/* Sections */}
         <div className="space-y-1 mt-2">
            {sections.map(group => (
                <div key={group.id} className="border-b border-slate-800/50">
                    <button 
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        {group.title}
                        {openGroups[group.id] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </button>
                    
                    {openGroups[group.id] && (
                        <ul className="bg-slate-900/50 pb-2">
                            {group.items.map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full text-left pl-8 pr-4 py-2 text-xs font-medium transition-all border-l-[3px] flex items-center justify-between ${
                                            activeSection === item.id
                                                ? 'bg-slate-800 border-blue-500 text-white'
                                                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
                                        }`}
                                    >
                                        {item.label}
                                        {/* Status Icon Placeholder */}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
         </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-950 space-y-3 border-t border-slate-800">
        <button 
            onClick={onTransmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-lg tracking-wide uppercase transition-transform active:scale-95"
        >
            <Send size={14} /> Transmitir Audesp
        </button>
        
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={onDownload}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 h-8 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
            >
                <FileJson size={12} /> Baixar
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 h-8 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-1"
            >
                <FolderInput size={12} /> Carregar
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
};
