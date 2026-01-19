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
  cpf: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expire_in: number;
  token_type: string;
  environment: Environment;
  timestamp: number;
}

// TCESP Real Servers
const ENVIRONMENTS: Record<Environment, string> = {
  piloto: 'https://audesp-piloto.tce.sp.gov.br',
  producao: 'https://audesp.tce.sp.gov.br'
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
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    // Em localhost, usar proxy para evitar CORS
    if (isLocalhost) {
      return env === 'piloto' ? '/proxy-piloto-login' : '/proxy-producao-login';
    }
    
    return ENVIRONMENTS[env];
  }

  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const env = this.getEnvironment();
    const baseUrl = isLocalhost 
      ? (env === 'piloto' ? '/proxy-piloto-login' : '/proxy-producao-login')
      : this.getBaseUrl();
    const loginUrl = isLocalhost ? baseUrl : `${baseUrl}/login`;

    try {
      console.log(`[Auth] Tentando login em ${this.getEnvironment()} (${loginUrl})`);
      console.log(`[Auth] CPF: ${credentials.cpf}`);

      // Formatar credenciais no formato esperado: cpf:senha
      const authHeader = `${credentials.cpf}:${credentials.password}`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-authorization': authHeader
        }
        // Removido: credentials: 'include' (causa CORS error com wildcard *)
        // Não necessário pois autenticação é via header, não cookie
      });

      console.log(`[Auth] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[Auth] Response body: ${responseText.substring(0, 100)}`);

      if (!response.ok) {
        // Erro real
        if (response.status === 401) {
          throw new Error('❌ Usuário ou senha inválidos. Verifique suas credenciais TCESP.');
        } else if (response.status === 403) {
          throw new Error('❌ Acesso proibido. Seu usuário pode não ter permissão neste ambiente.');
        }
        throw new Error(`❌ Erro de autenticação: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      
      // TCESP response uses "access_token" not "token"
      // expire_in is a timestamp (milliseconds), not seconds
      const tokenValue = data.access_token || data.token;
      const expiresInMs = data.expire_in || data.expires_in || 0;
      const expiresInSeconds = expiresInMs > 0 ? Math.floor((expiresInMs - Date.now()) / 1000) : 3600;
      
      const authToken: AuthToken = {
        token: tokenValue,
        expire_in: expiresInSeconds,
        token_type: data.token_type || 'bearer',
        environment: this.getEnvironment(),
        timestamp: Date.now()
      };

      // Salvar token
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authToken));
      this.currentToken = authToken;

      console.log(`[Auth] ✅ Login bem-sucedido em ${this.getEnvironment()}`);
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
