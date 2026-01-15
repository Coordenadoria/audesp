
import React, { useRef } from 'react';
import { SectionStatus } from '../services/validationService';
import { FolderInput } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onTransmit: () => void;
  onDownload: () => void;
  onLoadJson: (file: File) => void;
  onNew: () => void;
  onSaveDraft: () => void;
  onImportFullPdf: () => void; // New prop
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

  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD / RESUMO' },
    { id: '1', label: '1. Descritor' },
    { id: '2', label: '2. Código do Ajuste' },
    { id: '3', label: '3. Retificação' },
    { id: '4', label: '4. Relação de Empregados' },
    { id: '5', label: '5. Relação de Bens' },
    { id: '6', label: '6. Contratos' },
    { id: '7', label: '7. Documentos Fiscais' },
    { id: '8', label: '8. Pagamentos' },
    { id: '9', label: '9. Disponibilidades' },
    { id: '10', label: '10. Receitas' },
    { id: '11', label: '11. Ajustes de Saldo' },
    { id: '12', label: '12. Servidores Cedidos' },
    { id: '13', label: '13. Descontos' },
    { id: '14', label: '14. Devoluções' },
    { id: '15', label: '15. Glosas' },
    { id: '16', label: '16. Empenhos' },
    { id: '17', label: '17. Repasses' },
    { id: '18', label: '18. Relatório de Atividades' },
    { id: '19', label: '19. Dados Gerais Entidade' },
    { id: '20', label: '20. Responsáveis Órgão' },
    { id: '21', label: '21. Declarações' },
    { id: '22', label: '22. Relatório Governamental' },
    { id: '23', label: '23. Demonstrações Contábeis' },
    { id: '24', label: '24. Publicações Parecer/Ata' },
    { id: '25', label: '25. Prestação de Contas Ent.' },
    { id: '26', label: '26. Parecer Conclusivo' },
    { id: '27', label: '27. Transparência' },
    { id: 'preview', label: 'Visualizar JSON' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadJson(e.target.files[0]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (id: string) => {
      if (id === 'dashboard' || id === 'preview') return null;
      const st = sectionStatus[id];
      if (!st) return null;
      if (st.status === 'valid') return <span className="text-green-500 ml-auto">●</span>;
      if (st.status === 'invalid') return <span className="text-red-500 ml-auto" title={st.errors.length + ' erros'}>●</span>;
      return null; // Empty
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 font-sans">
      <div className="p-6 border-b border-slate-800 bg-slate-950">
        <h1 className="text-lg font-extrabold leading-tight flex flex-col">
            <span className="text-red-500 tracking-wide">CGOF</span>
            <span className="tracking-widest">AUDESP</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
            Gestão Orçamentária
        </p>
      </div>

      <div className="p-4 bg-slate-800/50">
        <button 
            onClick={(e) => { e.preventDefault(); onImportFullPdf(); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-xs font-bold transition-colors shadow-md border border-indigo-500"
        >
            <FolderInput size={14} />
            Importar PDF Completo
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
         <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-6 py-2.5 text-xs font-medium transition-all duration-200 border-l-[3px] flex items-center ${
                  activeSection === item.id
                    ? 'bg-slate-800 border-red-500 text-white shadow-inner'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
                {getStatusIcon(item.id)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 bg-slate-950 space-y-3 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2">
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onNew(); 
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white h-9 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                title="Novo Formulário (Limpar)">
                NOVO
            </button>
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onSaveDraft(); 
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white h-9 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                title="Salvar Rascunho">
                SALVAR
            </button>
        </div>

        <button 
            type="button"
            onClick={(e) => { 
                e.preventDefault(); 
                onTransmit(); 
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg tracking-wide uppercase cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Transmitir Audesp
        </button>
        
        <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onDownload(); 
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 h-8 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                title="Baixar JSON">
                Baixar
            </button>
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    fileInputRef.current?.click(); 
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 h-8 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                title="Carregar JSON">
                Carregar
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
            />
        </div>
      </div>
    </div>
  );
};
