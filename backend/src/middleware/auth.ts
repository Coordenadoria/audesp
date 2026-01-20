// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService.js';
import { logger } from '../config/logger.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        message: 'Token não fornecido',
        code: 'NO_TOKEN',
      });
      return;
    }

    const payload = authService.verifyToken(token);
    req.userId = payload.userId;
    req.email = payload.email;

    logger.debug(`Auth middleware: usuário autenticado ${payload.email}`);
    next();
  } catch (error) {
    logger.error(`Erro na autenticação: ${error}`);
    res.status(401).json({
      message: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Extrai token do header Authorization
 * Formato esperado: Bearer <token>
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware para verificar roles/permissões (futuro)
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implementar quando tiver sistema de roles
    // if (!req.userId || !roles.includes(req.role)) {
    //   res.status(403).json({ message: 'Acesso negado' });
    //   return;
    // }
    next();
  };
};

/**
 * Middleware para permitir acesso público (sem auth obrigatória)
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = authService.verifyToken(token);
      req.userId = payload.userId;
      req.email = payload.email;
    }

    next();
  } catch (error) {
    // Ignorar erro de autenticação para rotas opcionais
    logger.debug(`Optional auth: usuário não autenticado`);
    next();
  }
};
