/**
 * Serviço de Login com suporte real e desenvolvimento
 * Em desenvolvimento: usa credenciais mock
 * Em produção: conecta com API AUDESP real
 */

export interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
  usuario?: {
    email: string;
    nome: string;
    perfil: string;
  };
}

class LoginService {
  private isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  // Credenciais mock para desenvolvimento
  private mockUsers = {
    'operador@audesp.sp.gov.br': { senha: 'audesp123', perfil: 'Operador' },
    'gestor@audesp.sp.gov.br': { senha: 'audesp123', perfil: 'Gestor' },
    'contador@audesp.sp.gov.br': { senha: 'audesp123', perfil: 'Contador' },
    'auditor@audesp.sp.gov.br': { senha: 'audesp123', perfil: 'Auditor Interno' },
    'admin@audesp.sp.gov.br': { senha: 'audesp123', perfil: 'Administrador' },
    // Demo accounts
    'teste@test.com': { senha: 'teste123', perfil: 'Operador' },
    'demo@demo.com': { senha: 'demo123', perfil: 'Gestor' }
  };

  /**
   * Fazer login (real ou mock)
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

      // Modo desenvolvimento
      if (this.isDevelopment) {
        return this.loginMock(email, senha);
      }

      // Modo produção: conectar com API real
      return this.loginReal(email, senha);
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: `Erro ao fazer login: ${error}`
      };
    }
  }

  /**
   * Login em modo desenvolvimento (mock)
   */
  private loginMock(email: string, senha: string): LoginResponse {
    const user = this.mockUsers[email as keyof typeof this.mockUsers];

    if (!user) {
      return {
        success: false,
        message: `❌ Usuário não encontrado: ${email}\n\n📝 Usuários de teste disponíveis:\n${this.listarUsuariosDemo()}`
      };
    }

    if (user.senha !== senha) {
      return {
        success: false,
        message: `❌ Senha incorreta para ${email}`
      };
    }

    // Gerar token mock
    const token = this.gerarTokenMock(email);

    return {
      success: true,
      token,
      message: `✅ Login bem-sucedido (modo desenvolvimento)`,
      usuario: {
        email,
        nome: this.extrairNomeEmail(email),
        perfil: user.perfil
      }
    };
  }

  /**
   * Login em modo produção (API real)
   */
  private async loginReal(email: string, senha: string): Promise<LoginResponse> {
    try {
      const url = `${process.env.REACT_APP_AUDESP_URL || 'https://sistemas.tce.sp.gov.br/audesp/api'}/login`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorization': `${email}:${senha}`
        },
        body: JSON.stringify({ email, senha })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao conectar com AUDESP' }));
        return {
          success: false,
          message: `❌ Erro AUDESP: ${error.message || 'Credenciais inválidas'}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        token: data.token,
        message: '✅ Login bem-sucedido',
        usuario: {
          email,
          nome: this.extrairNomeEmail(email),
          perfil: 'Usuario'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Erro ao conectar com AUDESP: ${error}`
      };
    }
  }

  /**
   * Gerar token mock para desenvolvimento
   */
  private gerarTokenMock(email: string): string {
    const payload = {
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 horas
    };
    
    // Simulação de JWT (não é real, apenas para desenvolvimento)
    return `mock_${Buffer.from(JSON.stringify(payload)).toString('base64')}_${Date.now()}`;
  }

  /**
   * Validar formato de email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Extrair nome do email
   */
  private extrairNomeEmail(email: string): string {
    const parte = email.split('@')[0];
    return parte
      .split('.')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  /**
   * Listar usuários de teste disponíveis
   */
  private listarUsuariosDemo(): string {
    return Object.keys(this.mockUsers)
      .map(email => `  • ${email} / ${this.mockUsers[email as keyof typeof this.mockUsers].senha}`)
      .join('\n');
  }

  /**
   * Verificar se está em modo desenvolvimento
   */
  estaEmDesenvolvimento(): boolean {
    return this.isDevelopment;
  }
}

export default new LoginService();
