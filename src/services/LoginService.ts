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
  private proxyUrl = '/api/login'; // Vercel API Route (proxy)
  private apiKey = process.env.REACT_APP_AUDESP_API_KEY || '';

  /**
   * Fazer login com credenciais reais na API AUDESP via Proxy
   */
  async login(email: string, senha: string, ambiente: 'piloto' | 'producao' = 'piloto'): Promise<LoginResponse> {
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

      // Conectar via proxy (Vercel API Route)
      return this.loginReal(email, senha, ambiente);
    } catch (error) {
      console.error('Erro crítico no login:', error);
      return {
        success: false,
        message: `Erro ao fazer login: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Autenticação via Vercel API Proxy (resolve CORS issues)
   */
  private async loginReal(email: string, senha: string, ambiente: 'piloto' | 'producao' = 'piloto'): Promise<LoginResponse> {
    const url = this.proxyUrl;
    
    try {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║ 🔐 INICIANDO LOGIN COM AUDESP                             ║
╠════════════════════════════════════════════════════════════╣
║ Email:     ${email.padEnd(52 - 'Email:     '.length)}║
║ Hora:      ${new Date().toLocaleTimeString('pt-BR').padEnd(52 - 'Hora:      '.length)}║
║ URL:       ${url.substring(0, 50).padEnd(52 - 'URL:       '.length)}║
║ Método:    POST                                            ║
╚════════════════════════════════════════════════════════════╝`);

      const body = JSON.stringify({ email, senha });
      const authHeader = `${email}:${senha}`;
      
      console.log(`[Login] Headers:
  - Content-Type: application/json
  - x-authorization: [email:senha]
  - credentials: include`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha, ambiente })
      });

      console.log(`\n[Login] 📡 Resposta Recebida:
  - Status: ${response.status} ${response.statusText}
  - Content-Type: ${response.headers.get('content-type')}
  - CORS-Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'N/A'}`);

      // Tentar parsear resposta
      let data: any = {};
      let rawResponse = '';
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
          rawResponse = JSON.stringify(data, null, 2);
          console.log(`[Login] 📋 Response Body:\n${rawResponse}`);
        } catch (parseError) {
          const text = await response.text();
          rawResponse = text;
          console.error(`[Login] ❌ Erro ao parsear JSON. Raw text:\n${text}`);
        }
      } else {
        const text = await response.text();
        rawResponse = text;
        console.log(`[Login] 📋 Response (não-JSON):\n${text}`);
      }

      // Erro na resposta
      if (!response.ok) {
        const errorMsg = data.message || data.mensagem || data.msg || data.error || `HTTP ${response.status} ${response.statusText}`;
        console.error(`\n[Login] ❌ FALHA DE AUTENTICAÇÃO
  - Código: ${response.status}
  - Mensagem: ${errorMsg}
  - Dica: ${response.status === 401 ? 'Credenciais incorretas' : response.status === 403 ? 'Acesso negado' : 'Erro no servidor'}`);
        return {
          success: false,
          message: errorMsg,
          campos_invalidos: data.campos_invalidos || data.campos_inválidos || data.erros
        };
      }

      // Sucesso - procurar token
      const token = data.token || data.access_token || data.jwt;
      if (!token) {
        console.warn(`[Login] ⚠️ AVISO: Resposta 200 mas nenhum token encontrado!
  - Campos da resposta: ${Object.keys(data).join(', ')}`);
      }

      console.log(`\n[Login] ✅ SUCESSO DE AUTENTICAÇÃO
  - Token: ${token ? token.substring(0, 20) + '...' : 'NÃO ENCONTRADO'}
  - Nome: ${data.nome || data.usuario || data.name || this.extrairNomeEmail(email)}
  - Perfil: ${data.perfil || data.role || data.permission || 'N/A'}
  - Expira em: ${data.expire_in || data.expires_in || 'não especificado'} segundos`);

      return {
        success: true,
        token: token,
        expire_in: data.expire_in || data.expires_in || 86400,
        token_type: data.token_type || 'bearer',
        message: '✅ Autenticado com sucesso',
        usuario: {
          email,
          nome: data.nome || data.usuario || data.name || this.extrairNomeEmail(email),
          perfil: data.perfil || data.role || data.permission || 'Usuário',
          cpf: data.cpf || data.document
        }
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`\n[Login] 💥 ERRO CRÍTICO DE CONEXÃO
  - Tipo: ${error instanceof Error ? error.constructor.name : typeof error}
  - Mensagem: ${msg}
  - Stack: ${error instanceof Error ? error.stack : 'N/A'}
  - Dica: Verifique internet, URL da API, e firewall`);
      return {
        success: false,
        message: `Erro ao conectar com AUDESP: ${msg}. Verifique sua internet e credenciais.`
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
