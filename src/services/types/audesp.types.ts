/**
 * TIPOS E INTERFACES - AUDESP API
 * Definições completas para integração com AUDESP TCE-SP
 * 
 * Compatibilidade: OpenAPI 3.0 | LGPD | JSON Schema oficial AUDESP
 */

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export interface CredenciaisAudesp {
  email: string;
  senha: string;
}

export interface TokenJWT {
  /** Token JWT Bearer para requisições autenticadas */
  token: string;
  
  /** Timestamp Unix de expiração */
  expire_in: number;
  
  /** Tipo do token (sempre "bearer") */
  token_type: 'bearer';
  
  /** Metadados adicionais */
  usuario?: {
    email: string;
    nome: string;
    cpf?: string;
    perfil?: string;
  };
}

export interface SessaoAudesp {
  token: string;
  expiraEm: Date;
  usuario: {
    email: string;
    nome: string;
    cpf?: string;
    perfil: 'auditor' | 'gestor' | 'responsavel' | 'admin';
  };
  criadaEm: Date;
  ultimaAtividadeEm: Date;
}

// ============================================================================
// RESPOSTAS DA API
// ============================================================================

export interface RespostaAPI<T = any> {
  /** Indica sucesso da operação */
  success: boolean;
  
  /** Dados da resposta em caso de sucesso */
  data?: T;
  
  /** Mensagem de erro (se houver) */
  error?: string;
  
  /** Mensagem amigável */
  message?: string;
  
  /** Código HTTP da resposta */
  status: number;
  
  /** ID da requisição para rastreamento */
  requestId?: string;
  
  /** Timestamp da resposta */
  timestamp?: string;
}

export interface ErroAudesp {
  /** Código do erro (ex: "400", "401", "413") */
  codigo: string;
  
  /** Mensagem do erro */
  mensagem: string;
  
  /** Erros específicos de validação */
  erros?: Array<{
    campo: string;
    mensagem: string;
  }>;
  
  /** Dica para resolução */
  dica?: string;
  
  /** Protocolo de requisição para rastreamento */
  protocolo_requisicao?: string;
}

// ============================================================================
// PROTOCOLO
// ============================================================================

export interface Protocolo {
  /** Identificador único do protocolo AUDESP */
  numero: string;
  
  /** Data/hora da geração */
  dataHora: string;
  
  /** Status atual */
  status: 'Recebido' | 'Armazenado' | 'Processando' | 'Rejeitado' | 'Erro';
  
  /** Tipo de documento */
  tipoDocumento: 'Edital' | 'Licitação' | 'Ata' | 'Ajuste' | 'PrestacaoContas' | 'DeclaraNegativa';
  
  /** Fase (IV ou V) */
  fase: 'f4' | 'f5';
  
  /** Descrição do status */
  descricao: string;
  
  /** Erros (se houver) */
  erros?: string[];
  
  /** Avisos (se houver) */
  avisos?: string[];
}

export interface ConsultaProtocoloResposta {
  protocolo: Protocolo;
  historico: {
    data: string;
    status: string;
    descricao: string;
  }[];
}

// ============================================================================
// FASE IV - LICITAÇÕES E CONTRATOS
// ============================================================================

export interface DocumentoFase4Base {
  /** CPF ou CNPJ do órgão */
  cnpj_cpf_orgao: string;
  
  /** Nome do órgão */
  nome_orgao: string;
  
  /** CPF/CNPJ do responsável */
  cpf_cpf_responsavel: string;
  
  /** E-mail do responsável */
  email_responsavel: string;
  
  /** Data da transmissão */
  data_transmissao: string;
}

export interface Edital extends DocumentoFase4Base {
  numero_edital: string;
  ano_edital: number;
  data_abertura: string;
  valor_estimado: number;
  objeto: string;
}

export interface Licitacao extends DocumentoFase4Base {
  numero_licitacao: string;
  numero_processo: string;
  data_licitacao: string;
  valor_total: number;
  quantidade_propostas: number;
}

export interface Ata extends DocumentoFase4Base {
  numero_ata: string;
  numero_licitacao: string;
  data_ata: string;
  valor_ata: number;
  fornecedor: {
    cnpj: string;
    razao_social: string;
  };
}

export interface Ajuste extends DocumentoFase4Base {
  numero_ajuste: string;
  numero_processo: string;
  data_ajuste: string;
  valor_ajuste: number;
  motivo_ajuste: string;
}

export interface EnvioFase4Resposta {
  protocolo: string;
  status: 'Recebido' | 'Armazenado' | 'Rejeitado';
  dataHora: string;
  mensagem: string;
  erros?: ErroAudesp[];
}

// ============================================================================
// FASE V - PRESTAÇÃO DE CONTAS
// ============================================================================

export type TipoPrestacaoConta = 
  | 'convenio'
  | 'contrato-gestao'
  | 'termo-colaboracao'
  | 'termo-fomento'
  | 'termo-parceria';

export interface DocumentoFase5Base {
  /** CPF ou CNPJ do órgão */
  cnpj_cpf_orgao: string;
  
  /** Nome do órgão */
  nome_orgao: string;
  
  /** Período de referência (AAAA-MM-DD) */
  periodo_referencia_inicio: string;
  periodo_referencia_fim: string;
  
  /** CPF/CNPJ do responsável */
  cpf_responsavel: string;
  
  /** E-mail do responsável */
  email_responsavel: string;
  
  /** Data da transmissão */
  data_transmissao: string;
}

export interface PrestacaoContasConvenio extends DocumentoFase5Base {
  numero_convenio: string;
  concedente: string;
  valor_conveniado: number;
  valor_prestado: number;
  resumo_execucao: string;
}

export interface PrestacaoContasContratoGestao extends DocumentoFase5Base {
  numero_contrato: string;
  valor_contratado: number;
  valor_executado: number;
  metas_atingidas: number;
}

export interface DeclaraNegativa extends DocumentoFase5Base {
  periodo_ano: number;
  motivo_negativa: string;
  justificativa: string;
}

export interface EnvioFase5Resposta {
  protocolo: string;
  status: 'Recebido' | 'Armazenado' | 'Rejeitado';
  dataHora: string;
  mensagem: string;
  erros?: ErroAudesp[];
  avisos?: string[];
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

export type AmbienteAudesp = 'piloto' | 'producao';

export interface ConfigAudespAPI {
  /** Ambiente (piloto/produção) */
  ambiente: AmbienteAudesp;
  
  /** URL base da API AUDESP */
  urlBase: string;
  
  /** Timeout para requisições (ms) */
  timeout: number;
  
  /** Número máximo de tentativas de retry */
  maxRetries: number;
  
  /** Delay inicial para retry (ms) */
  retryDelayMs: number;
  
  /** Fator multiplicador para backoff exponencial */
  retryBackoffFactor: number;
  
  /** Habilitar logs de auditoria */
  enableAuditLog: boolean;
  
  /** Validar schema antes de enviar */
  validarSchemaAntes: boolean;
}

// ============================================================================
// AUDITORIA E LOGS
// ============================================================================

export interface LogAuditoria {
  /** ID único do log */
  id: string;
  
  /** Timestamp ISO 8601 */
  timestamp: string;
  
  /** Usuário que executou a ação */
  usuario: {
    email: string;
    nome: string;
    cpf: string;
  };
  
  /** Tipo de ação */
  tipo: 'LOGIN' | 'ENVIO' | 'CONSULTA' | 'ERRO' | 'REAUTENTICACAO' | 'LOGOUT';
  
  /** Endpoint chamado */
  endpoint: string;
  
  /** Método HTTP */
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
  
  /** Status da requisição */
  statusCode: number;
  
  /** Payload (hash para dados sensíveis) */
  payloadHash?: string;
  
  /** Protocolo AUDESP (se aplicável) */
  protocolo?: string;
  
  /** Erro (se houver) */
  erro?: {
    codigo: string;
    mensagem: string;
  };
  
  /** Tempo de execução (ms) */
  tempoMs: number;
  
  /** Imutável - para auditoria */
  readonly: boolean;
}

// ============================================================================
// RETRY E CIRCUIT BREAKER
// ============================================================================

export interface ConfigRetry {
  maxTentativas: number;
  delayInicial: number;
  delayMaximo: number;
  fatorExponencial: number;
  codigosRetentaveis: number[];
}

export interface EstadoCircuitBreaker {
  estado: 'FECHADO' | 'ABERTO' | 'MEIO_ABERTO';
  tentativas: number;
  ultimaFalha?: Date;
  limiteFalhas: number;
  tempoResetMs: number;
}

// ============================================================================
// UPLOAD DE ARQUIVO
// ============================================================================

export interface ConfigUploadArquivo {
  maxSizeBytes: number;
  tiposPermitidos: string[];
  validarAssinatura: boolean;
}

export interface ArquivoUpload {
  nome: string;
  tipo: 'application/pdf' | 'application/json' | string;
  tamanhoBytes: number;
  hash: string;
  conteudo: Blob | Buffer;
}

// ============================================================================
// VALIDAÇÃO
// ============================================================================

export interface ResultadoValidacao {
  valido: boolean;
  erros: Array<{
    campo: string;
    mensagem: string;
  }>;
  avisos: Array<{
    campo: string;
    mensagem: string;
  }>;
  percentualPreenchimento: number;
}

// ============================================================================
// INTERCEPTOR HTTP
// ============================================================================

export interface InterceptorRequisicao {
  (config: any): Promise<any>;
}

export interface InterceptorResposta {
  (response: any): Promise<any>;
  (error: any): Promise<any>;
}

// ============================================================================
// CACHE
// ============================================================================

export interface ConfigCache {
  habilitado: boolean;
  ttlMs: number;
  maxItens: number;
  chaveArmazenamento: string;
}

export interface ItemCache<T> {
  valor: T;
  criadoEm: Date;
  expiraEm: Date;
}
