import React, { useState, useCallback } from 'react';
import { Menu, X, Download, Upload } from 'lucide-react';
import LoginComponent from './components/LoginComponent';
import FormField from './components/FormField';
import ObjectGroup from './components/ObjectGroup';
import JsonViewer from './components/JsonViewer';

// FASE 1: Descritor + Identificação do Ajuste
const AUDESP_SCHEMA: Record<string, any> = {
  descritor: {
    titulo: 'Descritor',
    descricao: 'Identificação do exercício e entidade',
    campos: {
      exercicio: { tipo: 'integer', obrigatorio: true },
      data_prestacao: { tipo: 'date', obrigatorio: true },
      entidade_nome: { tipo: 'string', obrigatorio: true },
      entidade_cnpj: { tipo: 'string', obrigatorio: true, mascara: 'cnpj' },
      gestor_nome: { tipo: 'string', obrigatorio: true },
      gestor_cpf: { tipo: 'string', obrigatorio: true, mascara: 'cpf' },
      gestor_email: { tipo: 'string', obrigatorio: true },
      gestor_telefone: { tipo: 'string', mascara: 'phone' },
    },
  },
  identificacao_ajuste: {
    titulo: 'Identificação do Ajuste',
    descricao: 'Dados do ajuste contábil',
    campos: {
      tipo_ajuste: { tipo: 'string', obrigatorio: true },
      data_ajuste: { tipo: 'date', obrigatorio: true },
      valor_ajuste: { tipo: 'number', obrigatorio: true, mascara: 'currency' },
      motivo: { tipo: 'string', obrigatorio: true },
      referencia: { tipo: 'string' },
      observacoes: { tipo: 'string' },
    },
  },
};

const INITIAL_DATA = {
  descritor: {
    exercicio: new Date().getFullYear(),
    data_prestacao: new Date().toISOString().split('T')[0],
    entidade_nome: '',
    entidade_cnpj: '',
    gestor_nome: '',
    gestor_cpf: '',
    gestor_email: '',
    gestor_telefone: '',
  },
  identificacao_ajuste: {
    tipo_ajuste: '',
    data_ajuste: '',
    valor_ajuste: 0,
    motivo: '',
    referencia: '',
    observacoes: '',
  },
};

const MENU_SECTIONS = [
  { id: 'descritor', label: 'Descritor', icone: '📋' },
  { id: 'identificacao_ajuste', label: 'Identificação do Ajuste', icone: '🆔' },
  { id: 'empregados', label: 'Empregados', icone: '👥', fase: 2 },
  { id: 'bens', label: 'Bens', icone: '🏗️', fase: 2 },
  { id: 'contratos', label: 'Contratos', icone: '📄', fase: 2 },
  { id: 'documentos_fiscais', label: 'Documentos Fiscais', icone: '📊', fase: 2 },
  { id: 'pagamentos', label: 'Pagamentos', icone: '💰', fase: 3 },
  { id: 'receitas', label: 'Receitas', icone: '💵', fase: 3 },
  { id: 'repasses', label: 'Repasses', icone: '➡️', fase: 3 },
  { id: 'ajustes_saldo', label: 'Ajustes de Saldo', icone: '⚖️', fase: 3 },
  { id: 'disponibilidades', label: 'Disponibilidades', icone: '💳', fase: 3 },
  { id: 'servidores_cedidos', label: 'Servidores Cedidos', icone: '👔', fase: 3 },
  { id: 'descontos', label: 'Descontos', icone: '📉', fase: 3 },
  { id: 'devolucoes', label: 'Devoluções', icone: '↩️', fase: 3 },
  { id: 'glosas', label: 'Glosas', icone: '❌', fase: 3 },
  { id: 'empenhos', label: 'Empenhos', icone: '✍️', fase: 3 },
  { id: 'relatorio_atividades', label: 'Relatório de Atividades', icone: '📝', fase: 4 },
  { id: 'declaracoes', label: 'Declarações', icone: '🗣️', fase: 4 },
  { id: 'relatorios', label: 'Relatórios', icone: '📈', fase: 4 },
  { id: 'demonstracoes_contabeis', label: 'Demonstrações Contábeis', icone: '📑', fase: 4 },
  { id: 'publicacoes', label: 'Publicações', icone: '📢', fase: 4 },
  { id: 'prestacao_contas', label: 'Prestação de Contas', icone: '✅', fase: 4 },
  { id: 'parecer_conclusivo', label: 'Parecer Conclusivo', icone: '⚖️', fase: 4 },
  { id: 'transparencia', label: 'Transparência', icone: '👁️', fase: 4 },
  { id: 'json_transmissao', label: 'JSON / Transmissão', icone: '🔄', fase: 1 },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSection, setActiveSection] = useState('descritor');

  const handleFieldChange = useCallback((section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  }, []);

  const handleExportJson = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `audesp_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [formData]);

  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            setFormData((prev) => ({ ...prev, ...data }));
            alert('✅ Importado com sucesso!');
          } catch (err) {
            alert('❌ Erro: ' + (err as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const renderSection = () => {
    if (activeSection === 'json_transmissao') {
      return (
        <div className="space-y-6">
          <JsonViewer data={formData} />
          <div className="flex gap-4">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={20} />
              Exportar
            </button>
            <button
              onClick={handleImportJson}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Upload size={20} />
              Importar
            </button>
          </div>
        </div>
      );
    }

    const schema = AUDESP_SCHEMA[activeSection as keyof typeof AUDESP_SCHEMA];
    if (!schema) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-600">Seção em desenvolvimento (próximas fases)</p>
        </div>
      );
    }

    const sectionData = formData[activeSection as keyof typeof formData] || {};

    return (
      <ObjectGroup
        title={schema.titulo}
        description={schema.descricao}
        isValid={true}
        expanded={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(schema.campos).map(([fieldName, fieldConfig]: any) => (
            <FormField
              key={fieldName}
              label={fieldName}
              type={fieldConfig.tipo}
              value={sectionData[fieldName] || ''}
              onChange={(value) => handleFieldChange(activeSection, fieldName, value)}
              mask={fieldConfig.mascara}
              required={fieldConfig.obrigatorio}
            />
          ))}
        </div>
      </ObjectGroup>
    );
  };

  if (!isLoggedIn) {
    return <LoginComponent onSuccess={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-72 bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-y-auto flex flex-col">
          <div className="p-6 border-b border-blue-700">
            <h1 className="text-2xl font-bold">AUDESP v1.9</h1>
            <p className="text-sm text-blue-200">Prestação de Contas</p>
            <p className="text-xs text-blue-300 mt-3">👤 {currentUser?.name}</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-xs font-semibold text-blue-300 mb-2 px-4">FASE 1 (ATIVO)</div>
            {MENU_SECTIONS.filter(s => s.fase === 1).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded text-sm transition ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                {section.icone} {section.label}
              </button>
            ))}

            <div className="text-xs font-semibold text-blue-300 mt-4 mb-2 px-4">FASE 2 (BREVE)</div>
            {MENU_SECTIONS.filter(s => s.fase === 2).map((section) => (
              <button
                key={section.id}
                disabled
                className="w-full text-left px-4 py-2 rounded text-sm text-blue-400 opacity-50 cursor-not-allowed"
              >
                {section.icone} {section.label}
              </button>
            ))}

            <div className="text-xs font-semibold text-blue-300 mt-4 mb-2 px-4">FASE 3</div>
            {MENU_SECTIONS.filter(s => s.fase === 3).map((section) => (
              <button
                key={section.id}
                disabled
                className="w-full text-left px-4 py-2 rounded text-sm text-blue-400 opacity-50 cursor-not-allowed"
              >
                {section.icone} {section.label}
              </button>
            ))}

            <div className="text-xs font-semibold text-blue-300 mt-4 mb-2 px-4">FASE 4</div>
            {MENU_SECTIONS.filter(s => s.fase === 4).map((section) => (
              <button
                key={section.id}
                disabled
                className="w-full text-left px-4 py-2 rounded text-sm text-blue-400 opacity-50 cursor-not-allowed"
              >
                {section.icone} {section.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-blue-700">
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {showSidebar ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-bold">
              {MENU_SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
          </div>
          <span className="text-sm font-medium text-green-600">✓ Fase 1</span>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
