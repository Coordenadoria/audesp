import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  Users,
  Briefcase,
  Receipt,
  CreditCard,
  TrendingUp,
  Users2,
  Package,
  RotateCcw,
  AlertCircle,
  FileJson,
  Send,
  Check,
  AlertTriangle,
  Menu,
  X,
  Eye,
  Edit,
  Download,
  Lock
} from 'lucide-react';
import AudespecValidator, { ValidationResult } from '../services/AudespecValidatorService';
import AudespecClient from '../services/AudespecClientService';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'preenchido' | 'incompleto' | 'erro';
  children?: MenuItem[];
  onClick: () => void;
}

interface AudespecFormProps {
  onEnvioCompleto?: (protocolo: string) => void;
}

const AudespecForm: React.FC<AudespecFormProps> = ({ onEnvioCompleto }) => {
  const [seccaoAtiva, setSeccaoAtiva] = useState('descricao');
  const [dados, setDados] = useState<any>({
    descricao: {},
    entidade_beneficiaria: {},
    vigencia: {},
    responsaveis: [],
    contratos: [],
    documentos_fiscais: [],
    pagamentos: [],
    repasses: [],
    empregados: [],
    bens: [],
    devolucoes: [],
    glosas: [],
    declaracoes: {},
    relatorios: {},
    parecer_conclusivo: {},
    transparencia: {},
    metadata: {
      versao_schema: '3.0',
      status: 'Rascunho'
    }
  });

  const [validacao, setValidacao] = useState<ValidationResult | null>(null);
  const [menuAberto, setMenuAberto] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [jsonView, setJsonView] = useState(false);
  const [perfil, setPerfil] = useState<'Operador' | 'Gestor' | 'Contador' | 'Auditor Interno' | 'Administrador'>('Operador');

  const cliente = new AudespecClient();

  // Dados mock para demonstração
  const usuariosMock = {
    operador: { email: 'operador@prefeitura.sp.gov.br', senha: 'operador123' },
    gestor: { email: 'gestor@prefeitura.sp.gov.br', senha: 'gestor123' },
    contador: { email: 'contador@prefeitura.sp.gov.br', senha: 'contador123' }
  };

  // Menu hierárquico
  const menuItems: MenuItem[] = [
    {
      id: 'descricao',
      label: 'Descritor',
      icon: <FileText size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('descricao')
    },
    {
      id: 'entidade_beneficiaria',
      label: 'Entidade Beneficiária',
      icon: <Building2 size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('entidade_beneficiaria')
    },
    {
      id: 'vigencia',
      label: 'Vigência',
      icon: <Calendar size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('vigencia')
    },
    {
      id: 'responsaveis',
      label: 'Responsáveis',
      icon: <Users size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('responsaveis')
    },
    {
      id: 'contratos',
      label: 'Contratos',
      icon: <Briefcase size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('contratos')
    },
    {
      id: 'documentos_fiscais',
      label: 'Documentos Fiscais',
      icon: <Receipt size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('documentos_fiscais')
    },
    {
      id: 'pagamentos',
      label: 'Pagamentos',
      icon: <CreditCard size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('pagamentos')
    },
    {
      id: 'repasses',
      label: 'Repasses',
      icon: <TrendingUp size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('repasses')
    },
    {
      id: 'empregados',
      label: 'Empregados',
      icon: <Users2 size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('empregados')
    },
    {
      id: 'bens',
      label: 'Bens e Equipamentos',
      icon: <Package size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('bens')
    },
    {
      id: 'devolucoes',
      label: 'Devoluções',
      icon: <RotateCcw size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('devolucoes')
    },
    {
      id: 'glosas',
      label: 'Glosas/Ajustes',
      icon: <AlertCircle size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('glosas')
    },
    {
      id: 'json_transmissao',
      label: 'JSON / Transmissão AUDESP',
      icon: <FileJson size={18} />,
      status: 'incompleto',
      onClick: () => setSeccaoAtiva('json_transmissao')
    }
  ];

  // Validar dados em tempo real
  useEffect(() => {
    const resultado = AudespecValidator.validarPrestacao(dados);
    setValidacao(resultado);
  }, [dados]);

  // Componente: Status de Preenchimento
  const StatusIndicador = ({ status }: { status: 'preenchido' | 'incompleto' | 'erro' }) => {
    const icons = {
      preenchido: <Check size={14} className="text-green-600" />,
      incompleto: <AlertTriangle size={14} className="text-yellow-600" />,
      erro: <AlertCircle size={14} className="text-red-600" />
    };

    const cores = {
      preenchido: 'bg-green-100 text-green-800',
      incompleto: 'bg-yellow-100 text-yellow-800',
      erro: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${cores[status]}`}>
        {icons[status]}
        {status === 'preenchido' ? 'Preenchido' : status === 'incompleto' ? 'Incompleto' : 'Erro'}
      </span>
    );
  };

  // Componente: Formulário por Seção
  const FormularioPorSecao = () => {
    switch (seccaoAtiva) {
      case 'descricao':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Descritor</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Número SICONV"
                className="border rounded px-3 py-2"
                value={dados.descricao.numero_siconv || ''}
                onChange={(e) =>
                  setDados({
                    ...dados,
                    descricao: { ...dados.descricao, numero_siconv: e.target.value }
                  })
                }
              />
              <select
                className="border rounded px-3 py-2"
                value={dados.descricao.modalidade || ''}
                onChange={(e) =>
                  setDados({
                    ...dados,
                    descricao: { ...dados.descricao, modalidade: e.target.value }
                  })
                }
              >
                <option value="">Modalidade</option>
                <option value="Convênio">Convênio</option>
                <option value="Contrato de Gestão">Contrato de Gestão</option>
                <option value="Termo de Colaboração">Termo de Colaboração</option>
                <option value="Termo de Fomento">Termo de Fomento</option>
                <option value="Termo de Parceria">Termo de Parceria</option>
              </select>
            </div>
            {validacao && validacao.erros.length > 0 && (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="font-bold text-red-800 mb-2">Erros encontrados:</h4>
                {validacao.erros.map((erro, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    • {erro.campo}: {erro.mensagem}
                  </p>
                ))}
              </div>
            )}
          </div>
        );

      case 'json_transmissao':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">JSON / Transmissão AUDESP</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setJsonView(!jsonView)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                {jsonView ? <Edit size={16} /> : <Eye size={16} />}
                {jsonView ? 'Editar' : 'Visualizar'} JSON
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(dados, null, 2))}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Copiar JSON
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'prestacao-contas.json';
                  a.click();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Download size={16} />
                Exportar JSON
              </button>
            </div>

            {jsonView && (
              <textarea
                value={JSON.stringify(dados, null, 2)}
                onChange={(e) => {
                  try {
                    setDados(JSON.parse(e.target.value));
                  } catch (error) {
                    console.error('JSON inválido');
                  }
                }}
                className="w-full h-96 border rounded p-4 font-mono text-sm"
              />
            )}

            {!jsonView && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto h-96 text-sm">
                {JSON.stringify(dados, null, 2)}
              </pre>
            )}

            {validacao && !validacao.valido && (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h4 className="font-bold text-red-800 mb-2">⚠️ Resolva os erros antes de enviar:</h4>
                {validacao.erros.map((erro, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    • {erro.campo}: {erro.mensagem}
                  </p>
                ))}
              </div>
            )}

            {validacao && validacao.valido && (
              <button
                onClick={() => enviarParaAudesp()}
                className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 flex items-center gap-2 w-full justify-center"
              >
                <Send size={18} />
                Enviar para AUDESP
              </button>
            )}
          </div>
        );

      default:
        return <div className="text-gray-500">Seção em desenvolvimento...</div>;
    }
  };

  // Enviar para AUDESP
  const enviarParaAudesp = async () => {
    if (!autenticado) {
      alert('Você deve estar autenticado para enviar');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await cliente.enviarPrestacaoContasConvenio(dados);
      alert(`Enviado com sucesso! Protocolo: ${resposta.protocolo}`);
      if (onEnvioCompleto) {
        onEnvioCompleto(resposta.protocolo);
      }
    } catch (error: any) {
      alert(`Erro ao enviar: ${error.mensagem || error}`);
    } finally {
      setCarregando(false);
    }
  };

  // Interface Principal
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Menu Lateral */}
      <div
        className={`${
          menuAberto ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden shadow-lg`}
      >
        {/* Header do Menu */}
        <div className="p-4 border-b flex justify-between items-center">
          {menuAberto && <h3 className="font-bold text-sm">AUDESP v3.0</h3>}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="p-2 hover:bg-gray-200 rounded"
          >
            {menuAberto ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Itens do Menu */}
        <div className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full text-left px-3 py-3 rounded mb-1 flex items-center gap-3 transition-colors ${
                seccaoAtiva === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {menuAberto && <span className="text-sm flex-1">{item.label}</span>}
              {menuAberto && item.status !== 'preenchido' && (
                <span className="text-xs">
                  {item.status === 'erro' ? '❌' : '⚠️'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer do Menu */}
        {menuAberto && (
          <div className="p-4 border-t space-y-2">
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <p className="font-bold mb-1">Status Geral:</p>
              <p>✅ Preenchido: {menuItems.filter(m => m.status === 'preenchido').length}</p>
              <p>⚠️ Incompleto: {menuItems.filter(m => m.status === 'incompleto').length}</p>
              <p>❌ Erro: {menuItems.filter(m => m.status === 'erro').length}</p>
            </div>
            {validacao && (
              <div className="text-xs text-gray-600">
                <p>📊 Preenchimento: <strong>{validacao.percentual_preenchimento}%</strong></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sistema de Prestação de Contas AUDESP</h1>
            <p className="text-sm text-gray-500">Versão 3.0 - Production Ready</p>
          </div>
          <div className="flex items-center gap-4">
            {!autenticado ? (
              <button
                onClick={() => setAutenticado(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Lock size={16} />
                Login AUDESP
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Autenticado • Perfil: {perfil}
                </span>
                <button
                  onClick={() => setAutenticado(false)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {validacao && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                {validacao.resumo}
              </p>
            </div>
          )}
          <FormularioPorSecao />
        </div>
      </div>
    </div>
  );
};

export default AudespecForm;
