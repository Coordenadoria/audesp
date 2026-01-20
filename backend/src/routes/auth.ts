// src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import { CreateUserSchema } from '../models/User.js';

const router = Router();

// Schemas de validação
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

/**
 * POST /api/auth/register
 * Registra novo usuário
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar entrada
    const input = CreateUserSchema.parse(req.body);

    // Registrar usuário
    const user = await authService.register(input);

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('já existe')) {
        res.status(409).json({
          message: 'Email ou CPF já registrado',
          code: 'DUPLICATE_USER',
        });
        return;
      }

      res.status(400).json({
        message: error.message,
        code: 'REGISTRATION_ERROR',
      });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/auth/login
 * Faz login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, senha } = LoginSchema.parse(req.body);

    const authResponse = await authService.login(email, senha);

    // TODO: Salvar refresh token em cookie seguro
    // res.cookie('refreshToken', authResponse.refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'strict',
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    // });

    res.status(200).json(authResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('não encontrado') || error.message.includes('inválida')) {
        res.status(401).json({
          message: 'Email ou senha inválidos',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      res.status(500).json({
        message: 'Erro ao fazer login',
        code: 'LOGIN_ERROR',
      });
      return;
    }

    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Faz logout
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    await authService.logout(req.userId);

    res.status(200).json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Renova o JWT usando refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);

    const newToken = await authService.refreshToken(refreshToken);

    res.status(200).json({
      token: newToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('Token inválido')) {
        res.status(401).json({
          message: 'Refresh token inválido ou expirado',
          code: 'INVALID_REFRESH_TOKEN',
        });
        return;
      }

      res.status(500).json({
        message: error.message,
        code: 'REFRESH_ERROR',
      });
      return;
    }

    next(error);
  }
});

/**
 * GET /api/auth/me
 * Obtém dados do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const user = await authService.getCurrentUser(req.userId);

    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        res.status(404).json({
          message: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        message: error.message,
        code: 'GET_USER_ERROR',
      });
      return;
    }

    next(error);
  }
});

export default router;
