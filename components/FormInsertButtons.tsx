import React from 'react';
import { Plus, FileText, Users, DollarSign, Package, AlertCircle } from 'lucide-react';

interface FormInsertButtonsProps {
  activeSection: string;
  onAddClick: (section: string) => void;
}

export const FormInsertButtons: React.FC<FormInsertButtonsProps> = ({ 
  activeSection, 
  onAddClick 
}) => {
  const sections = [
    { id: 'descritor', label: 'Descritor', icon: FileText, color: 'blue' },
    { id: 'prestacao_benef', label: 'Entidade Beneficiária', icon: Users, color: 'green' },
    { id: 'responsaveis', label: 'Responsáveis', icon: Users, color: 'blue' },
    { id: 'contratos', label: 'Contratos', icon: FileText, color: 'purple' },
    { id: 'documentos_fiscais', label: 'Documentos Fiscais', icon: FileText, color: 'yellow' },
    { id: 'pagamentos', label: 'Pagamentos', icon: DollarSign, color: 'green' },
    { id: 'repasses', label: 'Repasses', icon: DollarSign, color: 'blue' },
    { id: 'relacao_empregados', label: 'Empregados', icon: Users, color: 'indigo' },
    { id: 'relacao_bens', label: 'Bens e Equipamentos', icon: Package, color: 'orange' },
    { id: 'devolucoes', label: 'Devoluções', icon: AlertCircle, color: 'red' },
    { id: 'glosas', label: 'Glosas/Ajustes', icon: AlertCircle, color: 'amber' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
      green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
      yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700',
      indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700',
      red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700',
      amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Plus size={20} />
          Inserir Dados nas Seções
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Clique no botão de uma seção para adicionar novos dados
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const colorClasses = getColorClasses(section.color);

          return (
            <button
              key={section.id}
              onClick={() => onAddClick(section.id)}
              className={`
                p-3 rounded-lg border transition-all duration-200
                flex items-center gap-2 font-medium text-sm
                ${colorClasses}
                ${isActive ? 'ring-2 ring-offset-2 ring-slate-400' : ''}
                hover:shadow-md
              `}
            >
              <Icon size={16} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          Seção ativa: <span className="font-semibold text-slate-800">{activeSection}</span>
        </p>
      </div>
    </div>
  );
};

export default FormInsertButtons;
