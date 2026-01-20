// Tipos do Schema AUDESP v1.9

// Seção 1: Identificação da Entidade
export interface Entidade {
  nome: string;
  cnpj: string;
  natureza: 'publica' | 'privada' | 'ost' | 'oscip';
  esfera: 'federal' | 'estadual' | 'distrital' | 'municipal';
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  atividade?: string;
}

// Seção 2: Responsável pela Prestação
export interface Responsavel {
  nome: string;
  cpf: string;
  rg?: string;
  email: string;
  telefone: string;
  cargo: string;
  funcao: string;
  dataApresentacao: string;
}

// Seção 3: Endereço
export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  pais?: string;
}

// Seção 4: Dados Financeiros
export interface Financeiro {
  receitaTotal: number;
  despesaTotal: number;
  resultadoExercicio: number;
  saldo: number;
  receitas?: {
    donacoes: number;
    servicos: number;
    vendas: number;
    juros: number;
    outras: number;
  };
  despesas?: {
    pessoal: number;
    encargos: number;
    servicos: number;
    materiais: number;
    investimentos: number;
    outras: number;
  };
}

// Seção 5: Bens e Ativos
export interface Ativo {
  descricao: string;
  valor: number;
  dataAquisicao: string;
  estado: 'novo' | 'bom' | 'regular' | 'ruim';
  localizacao: string;
}

// Seção 6: Patrimônio
export interface Patrimonio {
  bensImoveis: number;
  bensMoveis: number;
  totalBens: number;
  ativos: Ativo[];
}

// Seção 7: Passivos e Obrigações
export interface Passivo {
  descricao: string;
  valor: number;
  vencimento: string;
  credor: string;
}

// Seção 8: Projetos e Programas
export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  orcamento: number;
  gasto: number;
  beneficiarios: number;
  localidade: string;
  status: 'planejado' | 'em_execucao' | 'concluido' | 'suspenso';
}

// Seção 9: Relatório de Atividades
export interface Atividade {
  data: string;
  descricao: string;
  resultado: string;
  participantes: number;
  documento?: string;
}

// Seção 10: Conformidade e Documentação
export interface Conformidade {
  auditoriaInterna: boolean;
  auditoriiaExterna: boolean;
  relatorioDiretoria: boolean;
  ataReuniao: boolean;
  estatutoAtualizado: boolean;
  políticasDocumentadas: boolean;
  processosDocumentados: boolean;
  dataÚltimaAtualizacao?: string;
}

// Seção 11: Recursos Humanos
export interface RecursoHumano {
  cpf?: string;
  nome: string;
  cargo: string;
  salario: number;
  dataAdmissao: string;
  dataDesligamento?: string;
  tipo: 'funcionario' | 'voluntario' | 'estagiario' | 'terceirizado';
}

// Seção 12: Informações Bancárias
export interface ContaBancaria {
  banco: string;
  codigoBanco: string;
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca' | 'investimento';
  saldo: number;
  dataSaldo: string;
  titular: string;
}

// Seção 13: Parcerias e Convênios
export interface Parceria {
  id: string;
  instituicao: string;
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  valor?: number;
  escopo: string;
  status: 'vigente' | 'findo' | 'suspenso';
}

// Seção 14: Doações e Patrocínios
export interface Doacao {
  data: string;
  doador: string;
  descricao: string;
  valor: number;
  tipo: 'monetaria' | 'bens' | 'servicos';
  comprovante?: string;
}

// Seção 15: Prestação de Contas
export interface PrestacaoConta {
  // Identificação
  exercicio: number;
  dataPrestacao: string;
  periodo: {
    dataInicio: string;
    dataFim: string;
  };

  // Entidades
  entidade: Entidade;
  responsavel: Responsavel;
  endereco: Endereco;

  // Financeiro
  financeiro: Financeiro;
  patrimonio: Patrimonio;
  passivos: Passivo[];
  contasBancarias: ContaBancaria[];

  // Operacional
  projetos: Projeto[];
  atividades: Atividade[];
  recursosHumanos: RecursoHumano[];

  // Governança
  conformidade: Conformidade;
  parcerias: Parceria[];
  doacoes: Doacao[];

  // Metadados
  dataUltimaAtualizacao?: string;
  usuarioResponsavel?: string;
  statusTransmissao?: 'pendente' | 'enviado' | 'confirmado' | 'rejeitado';
  protocoloTransmissao?: string;
  observacoes?: string;
}

// Tipos de Validação
export interface ValidationError {
  [field: string]: string[];
}

export type ValidationWarning = string;

// Template padrão
export const AUDESP_DEFAULT_TEMPLATE: PrestacaoConta = {
  exercicio: new Date().getFullYear(),
  dataPrestacao: new Date().toISOString().split('T')[0],
  periodo: {
    dataInicio: `${new Date().getFullYear()}-01-01`,
    dataFim: `${new Date().getFullYear()}-12-31`,
  },
  entidade: {
    nome: '',
    cnpj: '',
    natureza: 'privada',
    esfera: 'municipal',
  },
  responsavel: {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: '',
    funcao: '',
    dataApresentacao: new Date().toISOString().split('T')[0],
  },
  endereco: {
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    municipio: '',
    uf: '',
  },
  financeiro: {
    receitaTotal: 0,
    despesaTotal: 0,
    resultadoExercicio: 0,
    saldo: 0,
  },
  patrimonio: {
    bensImoveis: 0,
    bensMoveis: 0,
    totalBens: 0,
    ativos: [],
  },
  passivos: [],
  contasBancarias: [],
  projetos: [],
  atividades: [],
  recursosHumanos: [],
  conformidade: {
    auditoriaInterna: false,
    auditoriiaExterna: false,
    relatorioDiretoria: false,
    ataReuniao: false,
    estatutoAtualizado: false,
    políticasDocumentadas: false,
    processosDocumentados: false,
  },
  parcerias: [],
  doacoes: [],
};
