/**
 * SCHEMA AUDESP v1.9 - Tipos TypeScript
 * Especificação oficial do formulário JSON
 * Gerado automaticamente a partir da especificação
 */

export interface AudespDescriptor {
  tipo_documento: string; // Fixo, somente leitura
  municipio: number;
  entidade: number;
  ano: number;
  mes: number; // 1-12
}

export interface AudespAjuste {
  codigo_ajuste: string;
  retificacao: boolean;
}

export interface PeriodoRemuneracao {
  mes: number;
  carga_horaria: number;
  remuneracao_bruta: number;
}

export interface Empregado {
  cpf: string;
  data_admissao: string; // ISO date
  data_demissao?: string; // ISO date
  cbo: string;
  cns: string;
  salario_contratual: number;
  periodos_remuneracao: PeriodoRemuneracao[];
}

export interface BemMovelAdquirido {
  numero_patrimonio: string;
  descricao: string;
  data_aquisicao: string;
  valor_aquisicao: number;
}

export interface BemMovelCedido {
  numero_patrimonio: string;
  descricao: string;
  data_cessao: string;
  valor_cessao: number;
}

export interface BemMovelBaixado {
  numero_patrimonio: string;
  data_baixa_devolucao: string;
}

export interface BemImovel {
  descricao: string;
  data_aquisicao?: string;
  data_cessao?: string;
  data_baixa_devolucao?: string;
  valor?: number;
}

export interface RelacaoBens {
  relacao_bens_moveis_adquiridos: BemMovelAdquirido[];
  relacao_bens_moveis_cedidos: BemMovelCedido[];
  relacao_bens_moveis_baixados_devolvidos: BemMovelBaixado[];
  relacao_bens_imoveis_adquiridos: BemImovel[];
  relacao_bens_imoveis_cedidos: BemImovel[];
  relacao_bens_imoveis_baixados_devolvidos: BemImovel[];
}

export interface Credor {
  documento_tipo: number;
  documento_numero: string;
  nome: string;
}

export interface Contrato {
  numero: string;
  credor: Credor;
  data_assinatura: string;
  vigencia_tipo: number;
  vigencia_data_inicial: string;
  vigencia_data_final?: string;
  objeto: string;
  natureza_contratacao: number[];
  natureza_contratacao_outro?: string;
  criterio_selecao: number;
  criterio_selecao_outro?: string;
  artigo_regulamento_compras: string;
  valor_montante: number;
  valor_tipo: number;
}

export interface IdentificacaoContrato {
  numero: string;
  data_assinatura: string;
}

export interface DocumentoFiscal {
  numero: string;
  credor: Credor;
  identificacao_contrato: IdentificacaoContrato;
  descricao: string;
  data_emissao: string;
  estado_emissor: number;
  valor_bruto: number;
  valor_encargos: number;
  categoria_despesas_tipo: number;
  rateio_proveniente_tipo: number;
  rateio_percentual: number;
}

export interface IdentificacaoDocumentoFiscal {
  numero: string;
  identificacao_credor: Credor;
}

export interface Pagamento {
  identificacao_documento_fiscal: IdentificacaoDocumentoFiscal;
  pagamento_data: string;
  pagamento_valor: number;
  fonte_recurso_tipo: number;
  meio_pagamento_tipo: number;
  banco: number;
  agencia: number;
  conta_corrente: string;
  numero_transacao: string;
}

export interface SaldoBancario {
  banco: number;
  agencia: number;
  conta: string;
  conta_tipo: number;
  saldo_bancario: number;
  saldo_contabil: number;
}

export interface Disponibilidades {
  saldos: SaldoBancario[];
  saldo_fundo_fixo: number;
}

export interface RepasseRecebido {
  data_prevista: string;
  data_repasse: string;
  valor: number;
  fonte_recurso_tipo: number;
}

export interface OutraReceita {
  descricao: string;
  valor: number;
}

export interface Receitas {
  receitas_aplic_financ_repasses_publicos_municipais: number;
  receitas_aplic_financ_repasses_publicos_estaduais: number;
  receitas_aplic_financ_repasses_publicos_federais: number;
  repasses_recebidos: RepasseRecebido[];
  outras_receitas: OutraReceita[];
}

export interface AjusteRetificacaoRepasse extends RepasseRecebido {
  valor_retificado: number;
}

export interface AjusteRetificacaoPagamento extends Pagamento {
  valor_retificado: number;
}

export interface AjustesSaldo {
  retificacao_repasses: AjusteRetificacaoRepasse[];
  inclusao_repasses: RepasseRecebido[];
  retificacao_pagamentos: AjusteRetificacaoPagamento[];
  inclusao_pagamentos: Pagamento[];
}

export interface PeriodoCessao {
  mes: number;
  carga_horaria: number;
  remuneracao_bruta: number;
}

export interface ServidorCedido {
  cpf: string;
  data_inicial_cessao: string;
  data_final_cessao: string;
  cargo_publico_ocupado: string;
  funcao_desempenhada_entidade_beneficiaria: string;
  onus_pagamento: number;
  periodos_cessao: PeriodoCessao[];
}

export interface Desconto {
  data: string;
  descricao: string;
  valor: number;
}

export interface Devolucao {
  data: string;
  natureza_devolucao_tipo: number;
  valor: number;
}

export interface Glosa {
  identificacao_documento_fiscal: IdentificacaoDocumentoFiscal;
  pagamento_data?: string;
  resultado_analise: number;
  valor_glosa: number;
}

export interface IdentificacaoEmpenho {
  numero: string;
  data_emissao: string;
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

export interface MetaPrograma {
  nome_programa: string;
  codigo_meta: string;
  periodo: string;
  quantidade_realizada: number;
  resultado_meta: string;
  justificativa?: string;
  meta_atendida: boolean;
}

export interface RelatorioAtividades {
  metas: MetaPrograma[];
}

export interface DadosGeraisEntidade {
  identificacao_certidao_dados_gerais: string;
  identificacao_certidao_corpo_diretivo: string;
  identificacao_certidao_membros_conselho: string;
}

export interface ResponsavelOrgaoConcessor {
  identificacao_certidao_responsaveis: string;
  identificacao_certidao_membros_comissao_avaliacao: string;
  identificacao_certidao_membros_controle_interno: string;
  identificacao_certidao_responsaveis_fiscalizacao_execucao: string;
}

export interface EmpresaPertencente {
  cnpj?: string;
  cpf?: string;
}

export interface ParticipacaoQuadroDiretivo {
  nome: string;
  cpf: string;
  cargo: string;
}

export interface Declaracoes {
  houve_contratacao_empresas_pertencentes: boolean;
  empresas_pertencentes?: EmpresaPertencente[];
  houve_participacao_quadro_diretivo_administrativo: boolean;
  participacoes_quadro_diretivo_administrativo?: ParticipacaoQuadroDiretivo[];
}

export interface RelatorioGovernamental {
  houve_emissao_relatorio_final: boolean;
  conclusao_relatorio: number;
  justificativa?: string;
}

export interface ResponsavelContabil {
  numero_crc: string;
  cpf: string;
  situacao_regular_crc: boolean;
}

export interface DemonstracoesContabeis {
  publicacoes: string[];
  responsavel: ResponsavelContabil;
}

export interface PublicacaoParecer {
  tipo_parecer_ata: number;
  houve_publicacao: boolean;
  publicacoes?: string[];
  conclusao_parecer: number;
}

export interface PrestacaoContasEntidade {
  data_prestacao: string;
  periodo_referencia_data_inicial: string;
  periodo_referencia_data_final: string;
}

export interface ParecerConclusivo {
  identificacao_parecer: string;
  conclusao_parecer: number;
  consideracoes_parecer: string;
  declaracoes?: string[];
}

export interface SitioInternet {
  endereco: string;
  periodicidade_atualizacao: string;
}

export interface Transparencia {
  entidade_beneficiaria_mantem_sitio_internet: boolean;
  sitios_internet?: SitioInternet[];
  requisitos_artigos_7o_8o_paragrafo_1o?: boolean[];
  requisitos_sitio_artigo_8o_paragrafo_3o?: boolean[];
  requisitos_divulgacao_informacoes?: boolean[];
}

/**
 * SCHEMA PRINCIPAL - Prestação de Contas Completa
 */
export interface PrestacaoContasAudesp {
  descritor: AudespDescriptor;
  codigo_ajuste: AudespAjuste;
  relacao_empregados: Empregado[];
  relacao_bens: RelacaoBens;
  contratos: Contrato[];
  documentos_fiscais: DocumentoFiscal[];
  pagamentos: Pagamento[];
  disponibilidades: Disponibilidades;
  receitas: Receitas;
  ajustes_saldo: AjustesSaldo;
  servidores_cedidos: ServidorCedido[];
  descontos: Desconto[];
  devolucoes: Devolucao[];
  glosas: Glosa[];
  empenhos: Empenho[];
  repasses: Repasse[];
  relatorio_atividades: RelatorioAtividades;
  dados_gerais_entidade: DadosGeraisEntidade;
  responsaveis_membros_orgao_concessor: ResponsavelOrgaoConcessor;
  declaracoes: Declaracoes;
  relatorio_governamental: RelatorioGovernamental;
  demonstracoes_contabeis: DemonstracoesContabeis;
  publicacoes_parecer_ata: PublicacaoParecer[];
  prestacao_contas_entidade: PrestacaoContasEntidade;
  parecer_conclusivo: ParecerConclusivo;
  transparencia: Transparencia;
}
