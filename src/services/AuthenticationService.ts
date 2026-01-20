import AudespecClient from './AudespecClientService';

export interface UsuarioAudespec {
  email: string;
  nome: string;
  cpf: string;
  funcao: string;
  perfil: 'Operador' | 'Gestor' | 'Contador' | 'Auditor Interno' | 'Administrador';
  ativo: boolean;
  data_criacao: string;
}

export interface SessaoAudespec {
  usuario: UsuarioAudespec;
  token: string;
  expireIn: number;
  dataLogin: string;
}

class AuthenticationService {
  private sessao: SessaoAudespec | null = null;
  private cliente: AudespecClient;

  constructor() {
    this.cliente = new AudespecClient(
      process.env.REACT_APP_AUDESP_URL || 'https://sistemas.tce.sp.gov.br/audesp/api',
      process.env.REACT_APP_AUDESP_API_KEY || ''
    );

    // Carregar sessão armazenada
    const sessaoStorage = localStorage.getItem('audespec_sessao');
    if (sessaoStorage) {
      try {
        this.sessao = JSON.parse(sessaoStorage);
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
      }
    }
  }

  /**
   * Autenticar com AUDESP
   */
  async autenticar(email: string, senha: string): Promise<SessaoAudespec> {
    try {
      const resposta = await this.cliente.login(email, senha);

      // Criar usuário (mock para demonstração)
      const usuario: UsuarioAudespec = {
        email,
        nome: this.extrairNomeEmail(email),
        cpf: '', // Seria obtido do AUDESP real
        funcao: 'Operador',
        perfil: 'Operador',
        ativo: true,
        data_criacao: new Date().toISOString()
      };

      this.sessao = {
        usuario,
        token: resposta.token,
        expireIn: resposta.expire_in,
        dataLogin: new Date().toISOString()
      };

      // Armazenar localmente
      localStorage.setItem('audespec_sessao', JSON.stringify(this.sessao));

      return this.sessao;
    } catch (error) {
      throw new Error(`Falha na autenticação: ${error}`);
    }
  }

  /**
   * Verificar se está autenticado
   */
  estaAutenticado(): boolean {
    if (!this.sessao) return false;

    const dataLogin = new Date(this.sessao.dataLogin).getTime();
    const agora = new Date().getTime();
    const tempoDecorrido = (agora - dataLogin) / 1000;

    return tempoDecorrido < this.sessao.expireIn;
  }

  /**
   * Obter sessão atual
   */
  obterSessao(): SessaoAudespec | null {
    if (this.estaAutenticado()) {
      return this.sessao;
    }
    return null;
  }

  /**
   * Obter token atual
   */
  obterToken(): string | null {
    return this.estaAutenticado() ? this.sessao?.token || null : null;
  }

  /**
   * Fazer logout
   */
  logout(): void {
    this.sessao = null;
    localStorage.removeItem('audespec_sessao');
  }

  /**
   * Renovar token (se expirado)
   */
  async renovarToken(): Promise<string | null> {
    if (!this.sessao) return null;

    try {
      // Em um sistema real, haveria um endpoint de refresh
      // Por enquanto, retorna o token existente
      return this.sessao.token;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return null;
    }
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
}

export default new AuthenticationService();
