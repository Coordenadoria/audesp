
// src/schemas/type-definitions.ts

export type TipoDocumentoDescritor = 
  | "Prestação de Contas de Convênio"
  | "Prestação de Contas de Contrato de Gestão"
  | "Prestação de Contas de Termo de Parceria"
  | "Prestação de Contas de Termo de Fomento"
  | "Prestação de Contas de Termo de Colaboração"
  | "Declaração Negativa";

// --- TRANSMISSION TYPES ---

export interface AudespErroDetalhe {
    mensagem: string;
    classificacao: "Impedittivo" | "Indicativo";
    codigoErro: string;
    campo: string;
    origem: string;
}

export interface AudespResponse {
    protocolo: string;
    tipoDocumento: string;
    status: "Recebido" | "Rejeitado" | "Armazenado";
    dataHora: string;
    erros?: AudespErroDetalhe[];
}

// --- SEÇÃO 1: IDENTIFICAÇÃO ---

export interface Descritor {
  tipo_documento: TipoDocumentoDescritor;
  municipio: number;
  entidade: number;
  ano: number;
  mes: number;
}

export interface DadosGerais {
  identificacao_certidao_dados_gerais: string;
  identificacao_certidao_corpo_diretivo: string;
  identificacao_certidao_membros_conselho: string;
}

export interface PrestacaoContasBenef {
  data_prestacao: string;
  periodo_referencia_data_inicial: string;
  periodo_referencia_data_final: string;
}

export interface Responsaveis {
  identificacao_certidao_responsaveis: string;
  identificacao_certidao_membros_comissao_avaliacao: string;
  identificacao_certidao_membros_controle_interno: string;
  identificacao_certidao_responsaveis_fiscalizacao_execucao?: string;
}

// --- SEÇÃO 2: FINANCEIRO ---

export interface Empenho {
  numero: string;
  data_emissao: string;
  classificacao_economica_tipo: string;
  fonte_recurso_tipo: number;
  valor: number;
  historico: string;
  cpf_ordenador_despesa: string;
}

export interface Repasse {
  identificacao_empenho: { numero: string; data_emissao: string };
  data_prevista: string;
  data_repasse: string;
  valor_previsto: number;
  valor_repasse: number;
  tipo_documento_bancario: number;
  numero_documento: string;
  banco: number;
  agencia: number;
  conta: string;
}

export interface Receitas {
  receitas_aplic_financ_repasses_publicos_municipais?: number;
  receitas_aplic_financ_repasses_publicos_estaduais?: number;
  receitas_aplic_financ_repasses_publicos_federais?: number;
  repasses_recebidos?: { data_prevista: string; data_repasse: string; valor: number; fonte_recurso_tipo: number }[];
  outras_receitas?: { descricao: string; valor: number }[];
}

export interface Contrato {
  numero: string;
  credor: { documento_tipo: number; documento_numero: string; nome?: string };
  data_assinatura: string;
  vigencia_tipo: number;
  vigencia_data_inicial: string;
  vigencia_data_final?: string;
  objeto: string;
  natureza_contratacao: number[];
  criterio_selecao: number;
  valor_montante: number;
  valor_tipo: number;
}

export interface DocumentoFiscal {
  numero: string;
  credor: { documento_tipo: number; documento_numero: string; nome?: string };
  identificacao_contrato?: { numero: string; data_assinatura: string; identificacao_credor: any };
  descricao: string;
  data_emissao: string;
  estado_emissor: number;
  valor_bruto: number;
  categoria_despesas_tipo: number;
  rateio_proveniente_tipo: number;
}

export interface Pagamento {
  identificacao_documento_fiscal: { numero: string; identificacao_credor: any };
  pagamento_data: string;
  pagamento_valor: number;
  fonte_recurso_tipo: number;
  meio_pagamento_tipo: number;
  numero_transacao?: string;
}

export interface AjusteRepasse {
  data_prevista: string;
  data_repasse: string;
  valor?: number;
  valor_retificado?: number;
  fonte_recurso_tipo: number;
}

export interface AjustePagamento {
  identificacao_documento_fiscal: { 
      numero: string; 
      identificacao_credor: { 
          documento_numero: string; 
          documento_tipo: number; 
          nome?: string 
      } 
  };
  pagamento_data: string;
  pagamento_valor: number;
  fonte_recurso_tipo: number;
  valor_retificado?: number;
}

export interface AjustesSaldo {
  retificacao_repasses?: AjusteRepasse[];
  inclusao_repasses?: AjusteRepasse[];
  retificacao_pagamentos?: AjustePagamento[];
  inclusao_pagamentos?: Pagamento[];
}

export interface ItemFinanceiro {
  data: string;
  descricao?: string;
  valor: number;
  natureza_devolucao_tipo?: number; // Para devoluções
  resultado_analise?: number; // Para glosas
  identificacao_documento_fiscal?: { numero: string; identificacao_credor: any }; // Para glosas
  valor_glosa?: number; // Para glosas
}

export interface Glosa extends ItemFinanceiro {
    identificacao_documento_fiscal: { numero: string; identificacao_credor: any };
    resultado_analise: number;
    valor_glosa: number;
}

export interface Disponibilidades {
  saldos: { banco: number; agencia: number; conta: string; conta_tipo: number; saldo_bancario: number; saldo_contabil: number }[];
  saldo_fundo_fixo: number;
}

// --- SEÇÃO 3: RELATÓRIOS E METAS ---

export interface RelatorioAtividades {
  programas: {
    nome_programa: string;
    metas: {
      codigo_meta: string;
      descricao?: string;
      periodicidades: { periodo: number; quantidade_realizada?: number }[];
      meta_atendida: boolean;
      justificativa?: string;
    }[];
  }[];
}

export interface RelatorioGov {
  houve_emissao_relatorio_final: boolean;
  conclusao_relatorio?: number;
  justificativa?: string;
}

// --- SEÇÃO 4: EMPREGADOS E BENS ---

export interface Empregado {
  cpf: string;
  data_admissao: string;
  data_demissao?: string;
  cbo: string;
  cns?: string;
  salario_contratual: number;
  periodos_remuneracao: { mes: number; carga_horaria: number; remuneracao_bruta: number }[];
}

export interface ServidorCedido {
  cpf: string;
  data_inicial_cessao: string;
  cargo_publico_ocupado: string;
  funcao_desempenhada_entidade_beneficiaria: string;
  onus_pagamento: number;
  periodos_cessao: any[];
}

export interface RelacaoBens {
  relacao_bens_moveis_adquiridos?: any[];
  relacao_bens_moveis_cedidos?: any[];
  relacao_bens_moveis_baixados_devolvidos?: any[];
  // ... outros tipos
}

// --- SEÇÃO 5: PUBLICAÇÕES E DEMONSTRAÇÕES ---

export interface Publicacao {
  tipo_veiculo_publicacao: number;
  nome_veiculo?: string;
  data_publicacao: string;
}

export interface DemonstracoesContabeis {
  publicacoes: Publicacao[];
  responsavel: { numero_crc: string; cpf: string; situacao_regular_crc: boolean };
}

export interface PublicacaoParecerAta {
  tipo_parecer_ata: number;
  houve_publicacao: boolean;
  publicacoes?: Publicacao[];
  conclusao_parecer: number;
}

// --- SEÇÃO 6: DECLARAÇÕES E PARECER ---

export interface Declaracoes {
  houve_contratacao_empresas_pertencentes: boolean;
  empresas_pertencentes?: any[];
  houve_participacao_quadro_diretivo_administrativo: boolean;
  participacoes_quadro_diretivo_administrativo?: any[];
}

export interface Transparencia {
  entidade_beneficiaria_mantem_sitio_internet: boolean;
  sitios_internet: string[];
  requisitos_artigos_7o_8o_paragrafo_1o: any[];
  requisitos_sitio_artigo_8o_paragrafo_3o: any[];
  requisitos_divulgacao_informacoes: any[];
}

export interface ParecerConclusivo {
  identificacao_parecer: string;
  conclusao_parecer: number;
  consideracoes_parecer?: string;
  declaracoes: any[];
}

// --- MASTER SCHEMA: PRESTAÇÃO DE CONTAS AUDESP V5 ---
export interface PrestacaoContas {
  // S1
  descritor: Descritor;
  codigo_ajuste: string;
  dados_gerais_entidade_beneficiaria?: DadosGerais;
  prestacao_contas_entidade_beneficiaria?: PrestacaoContasBenef;
  responsaveis_membros_orgao_concessor?: Responsaveis;
  
  // S2
  empenhos?: Empenho[];
  repasses?: Repasse[];
  receitas?: Receitas;
  contratos?: Contrato[];
  documentos_fiscais?: DocumentoFiscal[];
  glosas?: Glosa[]; 
  pagamentos?: Pagamento[];
  ajustes_saldo?: AjustesSaldo;
  descontos?: ItemFinanceiro[];
  devolucoes?: ItemFinanceiro[];
  disponibilidades?: Disponibilidades;

  // S3
  relatorio_atividades?: RelatorioAtividades;
  relatorio_governamental_analise_execucao?: RelatorioGov;
  
  // S4
  relacao_empregados?: Empregado[];
  servidores_cedidos?: ServidorCedido[];
  relacao_bens?: RelacaoBens;

  // S5
  demonstracoes_contabeis?: DemonstracoesContabeis;
  publicacoes_parecer_ata?: PublicacaoParecerAta[];

  // S6
  declaracoes?: Declaracoes;
  transparencia?: Transparencia;
  parecer_conclusivo?: ParecerConclusivo;
  
  // Controle
  retificacao: boolean;
}

export const INITIAL_DATA: PrestacaoContas = {
    descritor: { tipo_documento: "Prestação de Contas de Convênio", municipio: 0, entidade: 0, ano: 2025, mes: 1 },
    codigo_ajuste: "",
    retificacao: false,
    relacao_empregados: [],
    contratos: [],
    documentos_fiscais: [],
    pagamentos: [],
    empenhos: [],
    repasses: [],
    disponibilidades: { saldos: [], saldo_fundo_fixo: 0 },
    receitas: { repasses_recebidos: [], outras_receitas: [] },
    relatorio_atividades: { programas: [] },
    transparencia: { 
        entidade_beneficiaria_mantem_sitio_internet: false, sitios_internet: [], 
        requisitos_artigos_7o_8o_paragrafo_1o: [], requisitos_sitio_artigo_8o_paragrafo_3o: [], requisitos_divulgacao_informacoes: [] 
    }
};
