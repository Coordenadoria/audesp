/**
 * Serviço de Login - Autenticação Real com API AUDESP
 * Integração com sistema oficial de autenticação
 */

export interface LoginResponse {
  success: boolean;
  token?: string;
  expire_in?: number;
  token_type?: string;
  message: string;
  usuario?: {
    email: string;
    nome: string;
    perfil: string;
    cpf?: string;
  };
  campos_invalidos?: Array<{
    campo: string;
    mensagem: string;
  }>;
}

class LoginService {
  private apiUrl = process.env.REACT_APP_AUDESP_URL || 'https://sistemas.tce.sp.gov.br/audesp/api';
  private apiKey = process.env.REACT_APP_AUDESP_API_KEY || '';

  /**
   * Fazer login com credenciais reais na API AUDESP
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    try {
      // Validar entrada
      if (!email || !senha) {
        return {
          success: false,
          message: 'Email e senha são obrigatórios'
        };
      }

      if (!this.validarEmail(email)) {
        return {
          success: false,
          message: 'Email inválido'
        };
      }

      // Conectar com API AUDESP real
      return this.loginReal(email, senha);
    } catch (error) {
      console.error('Erro crítico no login:', error);
      return {
        success: false,
        message: `Erro ao fazer login: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Autenticação via API AUDESP Real
   */
  private async loginReal(email: string, senha: string): Promise<LoginResponse> {
    try {
      const url = `${this.apiUrl}/login`;

      // Header com autenticação em base64 (email:senha)
      const credentials = Buffer.from(`${email}:${senha}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'x-authorization': `${email}:${senha}`,
          ...(this.apiKey && { 'x-api-key': this.apiKey })
        },
        body: JSON.stringify({
          email,
          senha
        })
      });

      // Tentar parsear resposta
      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: `HTTP ${response.status}` };
      }

      // Erro na resposta
      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.mensagem || `Erro: ${response.statusText}`,
          campos_invalidos: data.campos_invalidos || data.campos_inválidos
        };
      }

      // Sucesso
      return {
        success: true,
        token: data.token || data.access_token,
        expire_in: data.expire_in || data.expires_in,
        token_type: data.token_type || 'bearer',
        message: '✅ Autenticado com sucesso',
        usuario: {
          email,
          nome: data.nome || data.usuario || this.extrairNomeEmail(email),
          perfil: data.perfil || data.role || 'Usuário',
          cpf: data.cpf
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão com AUDESP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Validar formato de email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Extrair nome do email como fallback
   */
  private extrairNomeEmail(email: string): string {
    const parte = email.split('@')[0];
    return parte
      .split('.')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  /**
   * Verificar se token é válido
   */
  verificarTokenValido(token?: string): boolean {
    if (!token) {
      token = localStorage.getItem('audesp_token') || '';
    }
    return token.length > 0;
  }

  /**
   * Fazer logout (limpar sessão)
   */
  logout(): void {
    localStorage.removeItem('audesp_token');
    localStorage.removeItem('audesp_email');
    localStorage.removeItem('audesp_perfil');
    localStorage.removeItem('audesp_nome');
    localStorage.removeItem('audesp_cpf');
    localStorage.removeItem('audesp_expire_in');
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new LoginService();
