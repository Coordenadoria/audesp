// backend/src/routes/prestacoes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prestacaoService } from '../services/PrestacaoService';
import { logger } from '../config/logger';

const router = Router();

// Apply auth to all routes
router.use(authMiddleware);

/**
 * GET /api/prestacoes
 * List prestações with filters and pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const resultado = await prestacaoService.listPrestacoes({
      usuarioCriadorId: req.userId,
      page,
      limit,
    });

    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prestacoes
 * Create new prestação
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { numero, competencia, nomeGestor, cpfGestor } = req.body;

    if (!numero || !competencia) {
      res.status(400).json({
        message: 'Invalid data',
        required: ['numero', 'competencia'],
      });
      return;
    }

    const prestacao = await prestacaoService.createPrestacao({
      numero,
      competencia,
      nomeGestor,
      cpfGestor,
      usuarioCriadorId: req.userId,
    });

    res.status(201).json(prestacao);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prestacoes/:id
 * Get prestação by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const prestacao = await prestacaoService.getPrestacaoById(req.params.id);

    if (!prestacao) {
      res.status(404).json({ message: 'Prestação not found' });
      return;
    }

    // Check authorization
    if (prestacao.usuarioCriadorId !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.status(200).json(prestacao);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/prestacoes/:id
 * Update prestação
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const prestacao = await prestacaoService.getPrestacaoById(req.params.id);

    if (!prestacao) {
      res.status(404).json({ message: 'Prestação not found' });
      return;
    }

    // Check authorization
    if (prestacao.usuarioCriadorId !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const updated = await prestacaoService.updatePrestacao(req.params.id, req.body);

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/prestacoes/:id
 * Delete prestação
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const prestacao = await prestacaoService.getPrestacaoById(req.params.id);

    if (!prestacao) {
      res.status(404).json({ message: 'Prestação not found' });
      return;
    }

    // Check authorization
    if (prestacao.usuarioCriadorId !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await prestacaoService.deletePrestacao(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prestacoes/:id/summary
 * Get prestação summary
 */
router.get('/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const prestacao = await prestacaoService.getPrestacaoById(req.params.id);

    if (!prestacao) {
      res.status(404).json({ message: 'Prestação not found' });
      return;
    }

    const summary = await prestacaoService.getSummary(req.params.id);

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prestacoes/:id/financial
 * Get financial summary
 */
router.get('/:id/financial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const financial = await prestacaoService.getFinancialSummary(req.params.id);

    if (!financial) {
      res.status(404).json({ message: 'Prestação not found' });
      return;
    }

    res.status(200).json(financial);
  } catch (error) {
    next(error);
  }
});

export default router;
