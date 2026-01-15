
// Types based on Audesp JSON Schema V1.9 (Manual Fase V)

// --- Enums for strict typing ---
export type TipoDocumentoDescritor = 
  | "Prestação de Contas de Convênio"
  | "Prestação de Contas de Contrato de Gestão"
  | "Prestação de Contas de Termo de Parceria"
  | "Prestação de Contas de Termo de Fomento"
  | "Prestação de Contas de Termo de Colaboração"
  | "Declaração Negativa";

export interface Descritor {
  tipo_documento: TipoDocumentoDescritor;
  municipio: number;
  entidade: number;
  ano: number;
  mes: number;
}

export interface PeriodoRemuneracao {
  mes: number; // 1-12
  carga_horaria: number;
  remuneracao_bruta: number;
}

export interface Empregado {
  cpf: string;
  data_admissao: string; // YYYY-MM-DD
  data_demissao?: string; // YYYY-MM-DD
  cbo: string;
  cns?: string;
  salario_contratual: number;
  periodos_remuneracao: PeriodoRemuneracao[];
}

export interface BemMovel {
  numero_patrimonio: string;
  descricao?: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  data_cessao?: string;
  valor_cessao?: number;
  data_baixa_devolucao?: string;
}

export interface BemImovel {
  descricao: string;
  data_aquisicao?: string;
  data_cessao?: string;
  data_baixa_devolucao?: string;
}

export interface RelacaoBens {
  relacao_bens_moveis_adquiridos?: BemMovel[];
  relacao_bens_moveis_cedidos?: BemMovel[];
  relacao_bens_moveis_baixados_devolvidos?: BemMovel[];
  relacao_bens_imoveis_adquiridos?: BemImovel[];
  relacao_bens_imoveis_cedidos?: BemImovel[];
  relacao_bens_imoveis_baixados_devolvidos?: BemImovel[];
}

export interface Credor {
  documento_tipo: number; // 1-CPF, 2-CNPJ, 3-Estrangeiro
  documento_numero: string;
  nome?: string;
}

export interface Contrato {
  numero: string;
  credor: Credor;
  data_assinatura: string;
  vigencia_tipo: number; // 1-Determinado, 2-Indeterminado
  vigencia_data_inicial: string;
  vigencia_data_final?: string;
  objeto: string;
  natureza_contratacao: number[]; // Code list
  natureza_contratacao_outro?: string;
  criterio_selecao: number; // Code list
  criterio_selecao_outro?: string;
  artigo_regulamento_compras?: string;
  valor_montante: number;
  valor_tipo: number; // 1-Estimado, 2-Global, 3-Mensal
}

export interface IdentificacaoContrato {
    numero: string; // Must match a Contrato.numero
    data_assinatura: string;
    identificacao_credor: Credor;
}

export interface DocumentoFiscal {
  numero: string;
  credor: Credor;
  identificacao_contrato?: IdentificacaoContrato;
  descricao: string;
  data_emissao: string;
  estado_emissor: number; // IBGE state code or Audesp code
  valor_bruto: number;
  valor_encargos: number;
  categoria_despesas_tipo: number; // Code list
  rateio_proveniente_tipo: number; // 1-Sim, 2-Não
  rateio_percentual?: number;
}

export interface IdentificacaoDocFiscal {
    numero: string; // Must match DocumentoFiscal.numero
    identificacao_credor: Credor;
}

export interface Pagamento {
  identificacao_documento_fiscal: IdentificacaoDocFiscal;
  pagamento_data: string;
  pagamento_valor: number;
  fonte_recurso_tipo: number; // 1-Municipal, 2-Estadual, 3-Federal, 4-Próprio
  meio_pagamento_tipo: number; // 1-Cheque, 2-Transf, 3-Espécie
  banco?: number;
  agencia?: number;
  conta_corrente?: string;
  numero_transacao?: string;
}

export interface Saldo {
  banco: number;
  agencia: number;
  conta: string;
  conta_tipo: number; // 1-Corrente, 2-Poupança, 3-Aplicação
  saldo_bancario: number;
  saldo_contabil: number;
}

export interface Disponibilidades {
  saldos: Saldo[];
  saldo_fundo_fixo: number;
}

export interface RepasseRecebido {
  data_prevista: string;
  data_repasse: string;
  valor: number;
  fonte_recurso_tipo: number;
}

export interface ItemFinanceiro {
  descricao: string;
  valor: number;
}

export interface Receitas {
  receitas_aplic_financ_repasses_publicos_municipais?: number;
  receitas_aplic_financ_repasses_publicos_estaduais?: number;
  receitas_aplic_financ_repasses_publicos_federais?: number;
  repasses_recebidos?: RepasseRecebido[];
  outras_receitas?: ItemFinanceiro[];
  recursos_proprios?: ItemFinanceiro[];
}

export interface AjusteRepasse {
  data_prevista: string;
  data_repasse: string;
  valor?: number;
  valor_retificado?: number;
  fonte_recurso_tipo?: number;
}

export interface AjustePagamento {
    identificacao_documento_fiscal: IdentificacaoDocFiscal;
    pagamento_data: string;
    pagamento_valor: number;
    fonte_recurso_tipo: number;
    valor_retificado?: number;
}

export interface InclusaoPagamento extends Pagamento {}

export interface AjustesSaldo {
  retificacao_repasses?: AjusteRepasse[];
  inclusao_repasses?: AjusteRepasse[];
  retificacao_pagamentos?: AjustePagamento[];
  inclusao_pagamentos?: InclusaoPagamento[];
}

export interface ServidorCedido {
  cpf: string;
  data_inicial_cessao: string;
  data_final_cessao?: string;
  cargo_publico_ocupado: string;
  funcao_desempenhada_entidade_beneficiaria: string;
  onus_pagamento: number; // 1-Origem, 2-Destino, 3-Parcial
  periodos_cessao: PeriodoRemuneracao[];
}

export interface ItemDesconto {
  data: string;
  descricao: string;
  valor: number;
}

export interface ItemDevolucao {
  data: string;
  natureza_devolucao_tipo: number; // Code list
  valor: number;
}

export interface Glosa {
  identificacao_documento_fiscal: IdentificacaoDocFiscal;
  resultado_analise: number; // 1-Glosa Total, 2-Glosa Parcial
  valor_glosa: number;
}

export interface Empenho {
  numero: string;
  data_emissao: string;
  classificacao_economica_tipo: string;
  fonte_recurso_tipo: number;
  valor: number;
  historico: string;
  cpf_ordenador_despesa: string;
}

export interface IdentificacaoEmpenho {
    numero: string;
    data_emissao: string;
}

export interface Repasse {
  identificacao_empenho: IdentificacaoEmpenho;
  data_prevista: string;
  data_repasse: string;
  valor_previsto: number;
  valor_repasse: number;
  justificativa_diferenca_valor?: string;
  tipo_documento_bancario: number;
  descricao_outros?: string;
  numero_documento: string;
  banco: number;
  agencia: number;
  conta: string;
}

export interface Periodicidade {
  periodo: number; // 1-Mensal, 2-Bimestral, etc.
  quantidade_realizada?: number;
  resultado_meta?: number;
  justificativa?: string;
}

export interface Meta {
  codigo_meta: string;
  descricao?: string;
  periodicidades: Periodicidade[];
  meta_atendida: boolean;
  justificativa?: string;
}

export interface Programa {
  nome_programa: string;
  metas: Meta[];
}

export interface RelatorioAtividades {
  programas: Programa[];
}

export interface DadosGerais {
  identificacao_certidao_dados_gerais: string;
  identificacao_certidao_corpo_diretivo: string;
  identificacao_certidao_membros_conselho: string;
}

export interface Responsaveis {
  identificacao_certidao_responsaveis: string;
  identificacao_certidao_membros_comissao_avaliacao: string;
  identificacao_certidao_membros_controle_interno: string;
  identificacao_certidao_responsaveis_fiscalizacao_execucao?: string;
}

export interface EmpresaPertencente {
    cnpj: string;
    cpf: string;
}

export interface ParticipacaoDiretivo {
    cpf_dirigente: string;
    cpf_contratados: string[];
}

export interface Declaracoes {
  houve_contratacao_empresas_pertencentes: boolean;
  empresas_pertencentes?: EmpresaPertencente[];
  houve_participacao_quadro_diretivo_administrativo: boolean;
  participacoes_quadro_diretivo_administrativo?: ParticipacaoDiretivo[];
}

export interface RelatorioGov {
  houve_emissao_relatorio_final: boolean;
  conclusao_relatorio?: number;
  justificativa?: string;
}

export interface Publicacao {
  tipo_veiculo_publicacao: number;
  nome_veiculo?: string;
  data_publicacao: string;
  endereco_internet?: string;
}

export interface DemonstracoesContabeis {
  publicacoes: Publicacao[];
  responsavel: {
    numero_crc: string;
    cpf: string;
    situacao_regular_crc: boolean;
  };
}

export interface PublicacaoParecerAta {
  tipo_parecer_ata: number;
  houve_publicacao: boolean;
  publicacoes?: Publicacao[];
  conclusao_parecer: number;
}

export interface PrestacaoContasBenef {
  data_prestacao: string;
  periodo_referencia_data_inicial: string;
  periodo_referencia_data_final: string;
}

export interface DeclaracaoParecer {
  tipo_declaracao: number;
  declaracao: number; // 1-Sim, 2-Não
  justificativa?: string;
}

export interface ParecerConclusivo {
  identificacao_parecer: string;
  conclusao_parecer: number;
  consideracoes_parecer?: string;
  declaracoes: DeclaracaoParecer[];
}

export interface TransparenciaRequisito {
  requisito: number;
  atende: boolean;
}

export interface Transparencia {
  entidade_beneficiaria_mantem_sitio_internet: boolean;
  sitios_internet: string[];
  requisitos_artigos_7o_8o_paragrafo_1o: TransparenciaRequisito[];
  requisitos_sitio_artigo_8o_paragrafo_3o: TransparenciaRequisito[];
  requisitos_divulgacao_informacoes: TransparenciaRequisito[];
}

// Root Object V1.9
export interface PrestacaoContas {
  descritor: Descritor;
  codigo_ajuste: string;
  retificacao: boolean;
  relacao_empregados?: Empregado[];
  relacao_bens?: RelacaoBens;
  contratos?: Contrato[];
  documentos_fiscais?: DocumentoFiscal[];
  pagamentos?: Pagamento[];
  disponibilidades?: Disponibilidades;
  receitas?: Receitas;
  ajustes_saldo?: AjustesSaldo;
  servidores_cedidos?: ServidorCedido[];
  descontos?: ItemDesconto[];
  devolucoes?: ItemDevolucao[];
  glosas?: Glosa[];
  empenhos?: Empenho[];
  repasses?: Repasse[];
  relatorio_atividades?: RelatorioAtividades;
  dados_gerais_entidade_beneficiaria?: DadosGerais;
  responsaveis_membros_orgao_concessor?: Responsaveis;
  declaracoes?: Declaracoes;
  relatorio_governamental_analise_execucao?: RelatorioGov;
  demonstracoes_contabeis?: DemonstracoesContabeis;
  publicacoes_parecer_ata?: PublicacaoParecerAta[];
  prestacao_contas_entidade_beneficiaria?: PrestacaoContasBenef;
  parecer_conclusivo?: ParecerConclusivo;
  transparencia?: Transparencia;
}

// --- Authentication Types (Strictly per Manual V1.9) ---

export interface TokenResponse {
  token: string;
  expire_in: number;
  token_type: string;
}

// --- Transmission Types (Official Responses) ---

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

export const INITIAL_DATA: PrestacaoContas = {
  descritor: {
    tipo_documento: "Prestação de Contas de Convênio",
    municipio: 0,
    entidade: 0,
    ano: 2025,
    mes: 1
  },
  codigo_ajuste: "",
  retificacao: false,
  relacao_empregados: [],
  relacao_bens: {
    relacao_bens_moveis_adquiridos: [],
    relacao_bens_moveis_cedidos: [],
    relacao_bens_moveis_baixados_devolvidos: [],
    relacao_bens_imoveis_adquiridos: [],
    relacao_bens_imoveis_cedidos: [],
    relacao_bens_imoveis_baixados_devolvidos: []
  },
  contratos: [],
  documentos_fiscais: [],
  pagamentos: [],
  disponibilidades: {
    saldos: [],
    saldo_fundo_fixo: 0
  },
  receitas: {
    repasses_recebidos: [],
    outras_receitas: [],
    recursos_proprios: []
  },
  ajustes_saldo: {
    retificacao_repasses: [],
    inclusao_repasses: [],
    retificacao_pagamentos: [],
    inclusao_pagamentos: []
  },
  servidores_cedidos: [],
  descontos: [],
  devolucoes: [],
  glosas: [],
  empenhos: [],
  repasses: [],
  relatorio_atividades: {
    programas: []
  },
  dados_gerais_entidade_beneficiaria: {
    identificacao_certidao_dados_gerais: "",
    identificacao_certidao_corpo_diretivo: "",
    identificacao_certidao_membros_conselho: ""
  },
  responsaveis_membros_orgao_concessor: {
    identificacao_certidao_responsaveis: "",
    identificacao_certidao_membros_comissao_avaliacao: "",
    identificacao_certidao_membros_controle_interno: ""
  },
  declaracoes: {
    houve_contratacao_empresas_pertencentes: false,
    houve_participacao_quadro_diretivo_administrativo: false
  },
  relatorio_governamental_analise_execucao: {
    houve_emissao_relatorio_final: false
  },
  demonstracoes_contabeis: {
    publicacoes: [],
    responsavel: {
      numero_crc: "",
      cpf: "",
      situacao_regular_crc: false
    }
  },
  publicacoes_parecer_ata: [],
  prestacao_contas_entidade_beneficiaria: {
    data_prestacao: "",
    periodo_referencia_data_inicial: "",
    periodo_referencia_data_final: ""
  },
  parecer_conclusivo: {
    identificacao_parecer: "",
    conclusao_parecer: 1,
    declaracoes: []
  },
  transparencia: {
    entidade_beneficiaria_mantem_sitio_internet: false,
    sitios_internet: [],
    requisitos_artigos_7o_8o_paragrafo_1o: [],
    requisitos_sitio_artigo_8o_paragrafo_3o: [],
    requisitos_divulgacao_informacoes: []
  }
};
