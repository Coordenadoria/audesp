// src/routes/prestacoes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { prestacaoService } from '../services/PrestacaoService.js';
import { logger } from '../config/logger.js';
import {
  CreatePrestacaoSchema,
  UpdatePrestacaoSchema,
  ListPrestacaoFiltersSchema,
} from '../models/Prestacao.js';

const router = Router();

// Aplicar auth em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/prestacoes
 * Listar prestações do usuário com filtros
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const filters = ListPrestacaoFiltersSchema.parse(req.query);

    const resultado = await prestacaoService.list(req.userId, filters);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Filtros inválidos',
        errors: error.errors,
      });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/prestacoes
 * Criar nova prestação
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const input = CreatePrestacaoSchema.parse(req.body);

    const prestacao = await prestacaoService.create(req.userId, input);

    res.status(201).json(prestacao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    next(error);
  }
});

/**
 * GET /api/prestacoes/:id
 * Obter prestação por ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const prestacao = await prestacaoService.getById(req.userId, req.params.id);

    res.status(200).json(prestacao);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      if (error.message.includes('Sem permissão')) {
        res.status(403).json({ message: error.message });
        return;
      }

      if (error.message.includes('foi deletada')) {
        res.status(410).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * PATCH /api/prestacoes/:id
 * Atualizar prestação
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const input = UpdatePrestacaoSchema.parse(req.body);

    const prestacao = await prestacaoService.update(req.userId, req.params.id, input);

    res.status(200).json(prestacao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      if (error.message.includes('Sem permissão')) {
        res.status(403).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * DELETE /api/prestacoes/:id
 * Deletar prestação (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    await prestacaoService.delete(req.userId, req.params.id);

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      if (error.message.includes('Sem permissão')) {
        res.status(403).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * GET /api/prestacoes/:id/history
 * Obter histórico de versões
 */
router.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const historico = await prestacaoService.getHistory(req.userId, req.params.id);

    res.status(200).json({
      total: historico.length,
      data: historico.map((v) => ({
        versao: v.versao,
        status: v.status,
        atualizadoEm: v.atualizadoEm,
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/prestacoes/:id/restore
 * Restaurar versão anterior
 */
router.post('/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const { versao } = z
      .object({
        versao: z.number().int().min(1),
      })
      .parse(req.body);

    const prestacao = await prestacaoService.restoreVersion(req.userId, req.params.id, versao);

    res.status(200).json(prestacao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/prestacoes/:id/validate
 * Validar prestação
 */
router.post('/:id/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const prestacao = await prestacaoService.validate(req.userId, req.params.id);

    res.status(200).json(prestacao);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/prestacoes/:id/send
 * Enviar prestação
 */
router.post('/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const prestacao = await prestacaoService.send(req.userId, req.params.id);

    res.status(200).json(prestacao);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        res.status(404).json({ message: error.message });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

export default router;
