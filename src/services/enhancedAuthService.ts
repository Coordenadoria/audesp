/**
 * SERVIÇO DE AUTENTICAÇÃO APRIMORADO
 * Suporta múltiplos ambientes (Piloto/Produção)
 * Gerencia tokens e sessões
 */

export type Environment = 'piloto' | 'producao';

export interface AuthConfig {
  environment: Environment;
  baseUrl: string;
  apiVersion: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expires_in: number;
  token_type: string;
  environment: Environment;
  timestamp: number;
}

// Backend URLs
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ENVIRONMENTS: Record<Environment, string> = {
  piloto: BACKEND_URL,
  producao: BACKEND_URL
};

const STORAGE_KEY = 'audesp_auth_token';
const ENV_KEY = 'audesp_environment';

export class EnhancedAuthService {
  private static currentEnvironment: Environment = 'piloto';
  private static currentToken: AuthToken | null = null;

  static setEnvironment(env: Environment) {
    this.currentEnvironment = env;
    localStorage.setItem(ENV_KEY, env);
  }

  static getEnvironment(): Environment {
    const saved = localStorage.getItem(ENV_KEY) as Environment;
    return saved || 'piloto';
  }

  static getBaseUrl(): string {
    const env = this.getEnvironment();
    return ENVIRONMENTS[env];
  }

  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    const baseUrl = this.getBaseUrl();
    const loginUrl = `${baseUrl}/login`;

    try {
      console.log(`[Auth] Fazendo login em ${this.getEnvironment()} (${loginUrl})`);

      // Formatar credenciais no formato esperado: email:senha
      const authHeader = `${credentials.email}:${credentials.password}`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-authorization': authHeader
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Auth] Erro ${response.status}: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error('Usuário ou senha inválidos');
        }
        throw new Error(`Erro de autenticação: ${response.status}`);
      }

      const data = await response.json();
      
      const authToken: AuthToken = {
        token: data.token,
        expires_in: data.expire_in || 3600,
        token_type: data.token_type || 'bearer',
        environment: this.getEnvironment(),
        timestamp: Date.now()
      };

      // Salvar token
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authToken));
      this.currentToken = authToken;

      console.log(`[Auth] Login bem-sucedido em ${this.getEnvironment()}`);
      return authToken;

    } catch (error: any) {
      console.error('[Auth] Erro no login:', error);
      throw new Error(`Erro ao autenticar: ${error.message}`);
    }
  }

  static logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentToken = null;
    console.log('[Auth] Logout realizado');
  }

  static getToken(): AuthToken | null {
    if (this.currentToken) {
      // Verificar se token expirou
      const expirationTime = this.currentToken.timestamp + (this.currentToken.expires_in * 1000);
      if (Date.now() > expirationTime) {
        this.logout();
        return null;
      }
      return this.currentToken;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.currentToken = JSON.parse(stored);
        
        // Verificar expiração
        const expirationTime = this.currentToken!.timestamp + (this.currentToken!.expires_in * 1000);
        if (Date.now() > expirationTime) {
          this.logout();
          return null;
        }
        
        return this.currentToken;
      } catch {
        return null;
      }
    }

    return null;
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      return {};
    }
    return {
      'Authorization': `${token.token_type} ${token.token}`
    };
  }
}

export default EnhancedAuthService;
