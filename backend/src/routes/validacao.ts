// backend/src/routes/validacao.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import ValidationService from '../services/ValidationService';
import { prestacaoService } from '../services/PrestacaoService';
import { logger } from '../config/logger';

const router = Router();
const validationService = ValidationService;

/**
 * Schema para validação
 */
const ValidateRequestSchema = z.object({
  prestacaoId: z.string().uuid('ID da prestação inválido'),
});

/**
 * POST /api/validacao/validate
 * Validar uma prestação completa em 7 camadas
 */
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prestacaoId } = ValidateRequestSchema.parse(req.body);
    const usuarioId = (req as any).usuarioId;

    logger.info(`Iniciando validação da prestação: ${prestacaoId}`);

    // Obter prestação
    let prestacao;
    try {
      prestacao = await prestacaoService.getPrestacaoById(prestacaoId);
    } catch (error) {
      return res.status(404).json({
        error: 'Prestação não encontrada',
        details: String(error),
      });
    }

    // Validar em 7 camadas
    const resultado = await validationService.validate(prestacao);

    // Registrar resultado na auditoria (em produção seria no banco)
    logger.info(`Validação concluída para prestação ${prestacaoId}: ${resultado.valido ? 'VALIDA' : 'INVALIDA'}`);

    return res.status(200).json({
      data: {
        prestacaoId,
        valido: resultado.valido,
        erros: resultado.erros,
        avisos: resultado.avisos,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Erro de validação: ${error.message}`);
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: error.errors,
      });
    }

    logger.error(`Erro ao validar: ${error}`);
    return res.status(500).json({
      error: 'Erro interno ao validar prestação',
      details: String(error),
    });
  }
});

/**
 * POST /api/validacao/validate-batch
 * Validar múltiplas prestações
 */
router.post('/validate-batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prestacaoIds } = z.object({
      prestacaoIds: z.array(z.string().uuid()),
    }).parse(req.body);

    const usuarioId = (req as any).usuarioId;

    logger.info(`Validando batch de ${prestacaoIds.length} prestações`);

    const resultados = [];

    for (const prestacaoId of prestacaoIds) {
      try {
        const prestacao = await prestacaoService.getPrestacaoById(prestacaoId);
        const resultado = await validationService.validate(prestacao);
        resultados.push({
          prestacaoId,
          valido: resultado.valido,
          errosCount: resultado.erros.length,
          avisosCount: resultado.avisos.length,
        });
      } catch (error) {
        resultados.push({
          prestacaoId,
          erro: 'Prestação não encontrada ou sem permissão',
        });
      }
    }

    const totalValidas = resultados.filter((r: any) => r.valido).length;

    return res.status(200).json({
      data: {
        total: prestacaoIds.length,
        validas: totalValidas,
        invalidas: prestacaoIds.length - totalValidas,
        resultados,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Erro de validação: ${error.message}`);
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: error.errors,
      });
    }

    logger.error(`Erro ao validar batch: ${error}`);
    return res.status(500).json({
      error: 'Erro ao validar batch de prestações',
      details: String(error),
    });
  }
});

/**
 * GET /api/validacao/layers
 * Obter documentação das 7 camadas de validação
 */
router.get('/layers', authMiddleware, (req: Request, res: Response) => {
  const layers = [
    {
      camada: 1,
      nome: 'Type Validation',
      descricao: 'Valida tipos básicos: string, number, boolean, date, array',
      exemplo: 'Verifica se CPF é string, saldo é number, etc.',
    },
    {
      camada: 2,
      nome: 'Enum Validation',
      descricao: 'Valida valores pré-definidos em enums',
      exemplo: 'Status deve ser: rascunho, validado ou enviado',
    },
    {
      camada: 3,
      nome: 'Regex Patterns',
      descricao: 'Valida padrões: CPF, CNPJ, email, data',
      exemplo: 'CPF deve ter 11 dígitos, data em YYYY-MM-DD',
    },
    {
      camada: 4,
      nome: 'Accounting Rules',
      descricao: 'Valida regras contábeis: equação fundamental',
      exemplo: 'SI + Receitas - Despesas = SF',
    },
    {
      camada: 5,
      nome: 'Referential Integrity',
      descricao: 'Valida integridade referencial entre entidades',
      exemplo: 'Documentos devem referenciar contratos existentes',
    },
    {
      camada: 6,
      nome: 'TCE-SP Conformance',
      descricao: 'Valida conformidade com regras TCE-SP',
      exemplo: 'Campos obrigatórios, formatação esperada',
    },
    {
      camada: 7,
      nome: 'LGPD Compliance',
      descricao: 'Valida conformidade com LGPD',
      exemplo: 'Consentimento de PII, direito ao esquecimento',
    },
  ];

  return res.status(200).json({
    data: {
      totalCamadas: 7,
      layers,
    },
  });
});

/**
 * GET /api/validacao/status
 * Obter status do serviço de validação
 */
router.get('/status', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      servico: 'ValidationService',
      versao: '1.0.0',
      status: 'operacional',
      camadas: 7,
      engine: 'AJV',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
