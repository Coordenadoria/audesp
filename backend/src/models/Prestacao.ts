// src/models/Prestacao.ts
import { z } from 'zod';

/**
 * Descritor - Informações básicas da prestação
 */
export const DescritorSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Competência deve ser YYYY-MM-DD'),
  nomeGestor: z.string().min(3, 'Nome do gestor obrigatório'),
  cpfGestor: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  nomeResponsavel: z.string().min(3, 'Nome do responsável obrigatório'),
  cpfResponsavel: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  dataAtualizacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD').optional(),
});

/**
 * Responsável - Pessoas envolvidas na prestação
 */
export const ResponsavelSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  cargo: z.string().min(3, 'Cargo obrigatório'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
});

/**
 * Contrato - Informações de contratos
 */
export const ContratoSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  fornecedor: z.string().min(3, 'Fornecedor obrigatório'),
  cnpjFornecedor: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional(),
});

/**
 * Documento Fiscal
 */
export const DocumentoFiscalSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  dataEmissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional(),
  tipo: z.enum(['NF', 'RPA', 'RECIBO']).optional(),
});

/**
 * Pagamento
 */
export const PagamentoSchema = z.object({
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
  dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD').optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).optional(),
});

/**
 * Prestação de Contas - Entidade principal
 */
export const PrestacaoSchema = z.object({
  id: z.string().uuid().optional(),
  usuarioId: z.string().uuid(),
  
  // Status
  status: z.enum(['rascunho', 'validado', 'enviado', 'rejeitado']).default('rascunho'),
  versao: z.number().int().min(1).default(1),
  
  // Competência
  competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Competência deve ser YYYY-MM-DD'),
  
  // Dados principais
  descritor: DescritorSchema.optional(),
  responsaveis: z.array(ResponsavelSchema).default([]),
  contratos: z.array(ContratoSchema).default([]),
  documentosFiscais: z.array(DocumentoFiscalSchema).default([]),
  pagamentos: z.array(PagamentoSchema).default([]),
  
  // Saldos
  saldoInicial: z.number().optional(),
  saldoFinal: z.number().optional(),
  
  // Validação
  errosValidacao: z.array(z.any()).default([]),
  avisosValidacao: z.array(z.any()).default([]),
  validadoEm: z.string().datetime().nullable().optional(),
  
  // Auditoria
  criadoEm: z.string().datetime().optional(),
  atualizadoEm: z.string().datetime().optional(),
  enviadoEm: z.string().datetime().nullable().optional(),
  deletadoEm: z.string().datetime().nullable().optional(),
});

/**
 * Schema para criar nova prestação
 */
export const CreatePrestacaoSchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Competência deve ser YYYY-MM-DD'),
});

/**
 * Schema para atualizar prestação
 */
export const UpdatePrestacaoSchema = z.object({
  descritor: DescritorSchema.optional(),
  responsaveis: z.array(ResponsavelSchema).optional(),
  contratos: z.array(ContratoSchema).optional(),
  documentosFiscais: z.array(DocumentoFiscalSchema).optional(),
  pagamentos: z.array(PagamentoSchema).optional(),
  saldoInicial: z.number().optional(),
  saldoFinal: z.number().optional(),
});

/**
 * Schema para listar prestações com filtros
 */
export const ListPrestacaoFiltersSchema = z.object({
  status: z.enum(['rascunho', 'validado', 'enviado', 'rejeitado']).optional(),
  competenciaInicio: z.string().datetime().optional(),
  competenciaFim: z.string().datetime().optional(),
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(10),
});

export type Descritor = z.infer<typeof DescritorSchema>;
export type Responsavel = z.infer<typeof ResponsavelSchema>;
export type Contrato = z.infer<typeof ContratoSchema>;
export type DocumentoFiscal = z.infer<typeof DocumentoFiscalSchema>;
export type Pagamento = z.infer<typeof PagamentoSchema>;
export type Prestacao = z.infer<typeof PrestacaoSchema>;
export type CreatePrestacaoInput = z.infer<typeof CreatePrestacaoSchema>;
export type UpdatePrestacaoInput = z.infer<typeof UpdatePrestacaoSchema>;
export type ListPrestacaoFilters = z.infer<typeof ListPrestacaoFiltersSchema>;
