/**
 * JWTAuthService - Gerenciador de autenticação JWT para transmissão AUDESP
 */

export interface JWTConfig {
  secret: string;
  expiresIn?: string;
  algorithm?: string;
}

export interface JWTToken {
  token: string;
  expiresAt: Date;
  issuedAt: Date;
}

export interface JWTPayload {
  cnpj: string;
  sub: string; // subject
  iat: number; // issued at
  exp: number; // expires
  aud: string; // audience
  iss: string; // issuer
  [key: string]: any;
}

export class JWTAuthService {
  private static instance: JWTAuthService;
  private config: JWTConfig;
  private tokens: Map<string, JWTToken> = new Map();

  private constructor(config: JWTConfig) {
    this.config = {
      expiresIn: '24h',
      algorithm: 'HS256',
      ...config,
    };
  }

  static initialize(config: JWTConfig): JWTAuthService {
    if (!this.instance) {
      this.instance = new JWTAuthService(config);
    }
    return this.instance;
  }

  static getInstance(): JWTAuthService {
    if (!this.instance) {
      throw new Error('JWTAuthService não inicializado. Chame initialize primeiro.');
    }
    return this.instance;
  }

  /**
   * Gerar JWT token
   */
  generateToken(cnpj: string, additionalClaims: Record<string, any> = {}): JWTToken {
    const now = new Date();
    const expiresInMs = this.parseExpiration(this.config.expiresIn || '24h');
    const expiresAt = new Date(now.getTime() + expiresInMs);

    const payload: JWTPayload = {
      cnpj,
      sub: cnpj,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
      aud: 'audesp-ws',
      iss: 'audesp-client',
      ...additionalClaims,
    };

    // Simular token (em produção, usar biblioteca JWT real)
    const token = this.createToken(payload);

    const jwtToken: JWTToken = {
      token,
      expiresAt,
      issuedAt: now,
    };

    this.tokens.set(cnpj, jwtToken);
    return jwtToken;
  }

  /**
   * Verificar token
   */
  verifyToken(token: string): { valid: boolean; payload?: JWTPayload; error?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Token inválido' };
      }

      // Decodificar payload (em produção, usar verificação real)
      const payload = JSON.parse(this.decodeBase64(parts[1]));

      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'Token expirado' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Erro ao verificar token' };
    }
  }

  /**
   * Renovar token
   */
  renewToken(cnpj: string): JWTToken | null {
    const existingToken = this.tokens.get(cnpj);
    if (!existingToken) {
      return null;
    }

    // Gerar novo token
    return this.generateToken(cnpj);
  }

  /**
   * Obter token válido
   */
  getValidToken(cnpj: string): string | null {
    const token = this.tokens.get(cnpj);
    if (!token) {
      return null;
    }

    // Se expira em menos de 5 minutos, renovar
    const now = new Date();
    const timeToExpiry = token.expiresAt.getTime() - now.getTime();

    if (timeToExpiry < 5 * 60 * 1000) {
      const newToken = this.generateToken(cnpj);
      return newToken.token;
    }

    return token.token;
  }

  /**
   * Revogar token
   */
  revokeToken(cnpj: string): boolean {
    return this.tokens.delete(cnpj);
  }

  /**
   * Listar tokens ativos
   */
  getActiveTokens(): Array<{ cnpj: string; expiresAt: Date }> {
    const now = new Date();
    return Array.from(this.tokens.entries())
      .filter(([_, token]) => token.expiresAt > now)
      .map(([cnpj, token]) => ({
        cnpj,
        expiresAt: token.expiresAt,
      }));
  }

  /**
   * Criar header de autorização
   */
  getAuthorizationHeader(cnpj: string): string | null {
    const token = this.getValidToken(cnpj);
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Validar expiração do token
   */
  isTokenExpired(cnpj: string): boolean {
    const token = this.tokens.get(cnpj);
    if (!token) return true;

    return new Date() > token.expiresAt;
  }

  /**
   * Parsear tempo de expiração
   */
  private parseExpiration(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 24 * 60 * 60 * 1000; // default 24h

    const [_, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Criar token (simulado - em produção usar biblioteca JWT)
   */
  private createToken(payload: JWTPayload): string {
    const header = { alg: this.config.algorithm, typ: 'JWT' };

    const headerEncoded = this.encodeBase64(JSON.stringify(header));
    const payloadEncoded = this.encodeBase64(JSON.stringify(payload));

    // Simular assinatura (em produção usar HMAC real)
    const signature = this.encodeBase64(this.config.secret);

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  /**
   * Encodar para Base64
   */
  private encodeBase64(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Decodificar de Base64
   */
  private decodeBase64(str: string): string {
    const padded = str + '=='.substring(0, (4 - (str.length % 4)) % 4);
    return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  }

  /**
   * Gerar credenciais para API
   */
  generateAPICredentials(cnpj: string): {
    apiKey: string;
    apiSecret: string;
    token: string;
  } {
    const jwtToken = this.generateToken(cnpj);
    const apiKey = `AUDESP_${cnpj}_${Math.random().toString(36).substr(2, 9)}`;
    const apiSecret = this.encodeBase64(`${cnpj}:${this.config.secret}`);

    return {
      apiKey,
      apiSecret,
      token: jwtToken.token,
    };
  }

  /**
   * Validar credenciais
   */
  validateCredentials(
    cnpj: string,
    token: string
  ): { valid: boolean; reason?: string } {
    const verification = this.verifyToken(token);

    if (!verification.valid) {
      return { valid: false, reason: verification.error };
    }

    if (verification.payload?.cnpj !== cnpj) {
      return { valid: false, reason: 'CNPJ não corresponde ao token' };
    }

    return { valid: true };
  }
}

export default JWTAuthService;
