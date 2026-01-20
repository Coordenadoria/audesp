// src/services/AuthService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { User, CreateUserInput, validateCPF } from '../models/User.js';

interface TokenPayload {
  userId: string;
  email: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export class AuthService {
  /**
   * Registra novo usuário
   * TODO: Integrar com banco de dados
   */
  async register(input: CreateUserInput): Promise<User> {
    try {
      // Validar CPF
      if (!validateCPF(input.cpf)) {
        throw new Error('CPF inválido (módulo 11)');
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(input.senha, config.bcrypt.rounds);

      // TODO: Verificar se email/CPF já existe no banco
      // TODO: Salvar usuário no banco

      const user: User = {
        id: '', // Será gerado pelo banco (UUID)
        email: input.email,
        cpf: input.cpf,
        nome: input.nome,
        senhaHash, // Não retornar isso ao cliente
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      logger.info(`Novo usuário registrado: ${input.email}`);

      // Remove senhaHash da resposta
      const { senhaHash, ...userResponse } = user;
      return userResponse as User;
    } catch (error) {
      logger.error(`Erro ao registrar usuário: ${error}`);
      throw error;
    }
  }

  /**
   * Faz login e retorna JWT
   * TODO: Buscar usuário do banco
   */
  async login(email: string, senha: string): Promise<AuthResponse> {
    try {
      // TODO: Buscar usuário por email no banco
      // TODO: Comparar senha com bcrypt
      
      // Exemplo (remover quando integrado com banco):
      const mockUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email,
        cpf: '12345678901',
        nome: 'Usuário Teste',
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      // Gerar JWT
      const token = this.generateToken(mockUser);
      const refreshToken = this.generateRefreshToken(mockUser);

      logger.info(`Login bem-sucedido: ${email}`);

      const { senhaHash, ...userResponse } = mockUser;
      return {
        token,
        refreshToken,
        user: userResponse as User,
      };
    } catch (error) {
      logger.error(`Erro ao fazer login: ${error}`);
      throw error;
    }
  }

  /**
   * Faz logout (invalida token)
   * TODO: Adicionar token à blacklist
   */
  async logout(userId: string): Promise<void> {
    try {
      // TODO: Adicionar token à lista negra (Redis)
      logger.info(`Logout: ${userId}`);
    } catch (error) {
      logger.error(`Erro ao fazer logout: ${error}`);
      throw error;
    }
  }

  /**
   * Renova o JWT usando refresh token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
      
      // TODO: Buscar usuário do banco para dados atualizados
      const user: User = {
        id: payload.userId,
        email: payload.email,
        cpf: '', // TODO: Buscar do banco
        nome: '', // TODO: Buscar do banco
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      const newToken = this.generateToken(user);
      logger.info(`Token renovado para: ${payload.email}`);
      
      return newToken;
    } catch (error) {
      logger.error(`Erro ao renovar token: ${error}`);
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Obtém usuário autenticado
   * TODO: Buscar do banco
   */
  async getCurrentUser(userId: string): Promise<User> {
    try {
      // TODO: Buscar usuário do banco por ID
      
      const user: User = {
        id: userId,
        email: 'user@example.com',
        cpf: '12345678901',
        nome: 'Usuário Teste',
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      const { senhaHash, ...userResponse } = user;
      return userResponse as User;
    } catch (error) {
      logger.error(`Erro ao obter usuário: ${error}`);
      throw error;
    }
  }

  /**
   * Verifica se o token é válido
   */
  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return payload;
    } catch (error) {
      logger.error(`Token inválido: ${error}`);
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Gera JWT
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id || '',
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256',
    });
  }

  /**
   * Gera refresh token (duração mais longa)
   */
  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id || '',
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      algorithm: 'HS256',
    });
  }

  /**
   * Compara senha com hash (para login)
   */
  async comparePasswords(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  /**
   * Gera hash de senha
   */
  async hashPassword(senha: string): Promise<string> {
    return bcrypt.hash(senha, config.bcrypt.rounds);
  }
}

export const authService = new AuthService();
