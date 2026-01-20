/**
 * AUDESP AUTH SERVICE V2
 * Gerenciamento robusto de autenticação e tokens JWT
 * 
 * - Autenticação via x-authorization header
 * - Cache seguro de tokens
 * - Reautenticação automática
 * - Suporte a múltiplos ambientes
 * - Compatibilidade com LGPD
 */

import {
  TokenJWT,
  SessaoAudesp,
  CredenciaisAudesp,
  AmbienteAudesp,
  RespostaAPI,
  ConfigAudespAPI
} from './types/audesp.types';

class AudespAuthServiceV2 {
  private static readonly CONFIG_DEFAULT: ConfigAudespAPI = {
    ambiente: 'piloto',
    urlBase: 'https://audesp-piloto.tce.sp.gov.br/api',
    timeout: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    retryBackoffFactor: 2,
    enableAuditLog: true,
    validarSchemaAntes: true
  };

  private static readonly URLS = {
    piloto: 'https://audesp-piloto.tce.sp.gov.br/api',
    producao: 'https://sistemas.tce.sp.gov.br/audesp/api'
  };

  private static config: ConfigAudespAPI = { ...AudespAuthServiceV2.CONFIG_DEFAULT };
  private static sessaoAtiva: SessaoAudesp | null = null;
  private static tokenEmRefresh: Promise<TokenJWT | null> | null = null;

  /**
   * Inicializar configuração do serviço
   */
  static configurar(opcoes: Partial<ConfigAudespAPI>): void {
    AudespAuthServiceV2.config = {
      ...AudespAuthServiceV2.CONFIG_DEFAULT,
      ...opcoes
    };

    // Atualizar URL base se ambiente mudou
    if (opcoes.ambiente) {
      AudespAuthServiceV2.config.urlBase =
        AudespAuthServiceV2.URLS[opcoes.ambiente];
    }

    console.log('[Auth] Configuração atualizada:', {
      ambiente: AudespAuthServiceV2.config.ambiente,
      urlBase: AudespAuthServiceV2.config.urlBase
    });
  }

  /**
   * AUTENTICAÇÃO - Login com email e senha
   * Cria nova sessão e armazena token JWT
   */
  static async login(credenciais: CredenciaisAudesp): Promise<RespostaAPI<TokenJWT>> {
    const url = `${AudespAuthServiceV2.config.urlBase}/login`;

    console.log('[Auth] Iniciando login para:', credenciais.email);

    try {
      // Preparar header x-authorization (email:senha em Base64)
      const authHeader = AudespAuthServiceV2.codificarCredenciais(
        credenciais.email,
        credenciais.senha
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorization': authHeader,
          'User-Agent': 'AUDESP-Client/2.0'
        },
        credentials: 'include',
        timeout: AudespAuthServiceV2.config.timeout
      });

      if (!response.ok) {
        const erroData = await AudespAuthServiceV2.lerResposta(response);
        console.error('[Auth] Falha no login:', {
          status: response.status,
          erro: erroData
        });

        return {
          success: false,
          status: response.status,
          error: erroData.message || 'Falha na autenticação',
          message: AudespAuthServiceV2.mapearMensagemErro(response.status)
        };
      }

      const tokenData = await AudespAuthServiceV2.lerResposta(response);
      const token = tokenData.token || tokenData.access_token || tokenData.jwt;

      if (!token) {
        console.error('[Auth] Token não retornado pela API');
        return {
          success: false,
          status: response.status,
          error: 'Token não encontrado na resposta',
          message: 'Falha ao processar autenticação'
        };
      }

      // Criar sessão
      const sessao: SessaoAudesp = {
        token,
        expiraEm: new Date(Date.now() + (tokenData.expire_in || 3600) * 1000),
        usuario: {
          email: credenciais.email,
          nome: tokenData.usuario?.nome || AudespAuthServiceV2.extrairNomeEmail(credenciais.email),
          cpf: tokenData.usuario?.cpf,
          perfil: tokenData.usuario?.perfil || 'responsavel'
        },
        criadaEm: new Date(),
        ultimaAtividadeEm: new Date()
      };

      // Armazenar sessão
      AudespAuthServiceV2.sessaoAtiva = sessao;
      AudespAuthServiceV2.armazenarToken(sessao);

      console.log('[Auth] ✅ Login bem-sucedido para:', credenciais.email);

      return {
        success: true,
        data: {
          token,
          expire_in: tokenData.expire_in || 3600,
          token_type: 'bearer',
          usuario: sessao.usuario
        },
        status: response.status,
        message: 'Autenticação bem-sucedida'
      };
    } catch (erro: any) {
      console.error('[Auth] Erro ao fazer login:', erro.message);

      return {
        success: false,
        status: 0,
        error: erro.message,
        message: 'Erro de conexão ao autenticar'
      };
    }
  }

  /**
   * LOGOUT - Limpar sessão e token
   */
  static logout(): void {
    console.log('[Auth] Logout de:', AudespAuthServiceV2.sessaoAtiva?.usuario.email);

    // Limpar memória
    AudespAuthServiceV2.sessaoAtiva = null;
    AudespAuthServiceV2.tokenEmRefresh = null;

    // Limpar localStorage
    localStorage.removeItem('audesp_token');
    localStorage.removeItem('audesp_sessao');
    localStorage.removeItem('audesp_expire_em');

    // Limpar sessionStorage
    sessionStorage.removeItem('audesp_token');
  }

  /**
   * OBTER TOKEN VÁLIDO - Com reautenticação automática
   */
  static async obterTokenValido(): Promise<string | null> {
    // Validar se token está ainda válido
    if (AudespAuthServiceV2.sessaoAtiva &&
        AudespAuthServiceV2.estaValido(AudespAuthServiceV2.sessaoAtiva)) {
      return AudespAuthServiceV2.sessaoAtiva.token;
    }

    // Se está expirando, renovar
    if (AudespAuthServiceV2.sessaoAtiva &&
        AudespAuthServiceV2.estaProximoVencimento(AudespAuthServiceV2.sessaoAtiva)) {
      console.log('[Auth] Token próximo do vencimento, renovando...');
      await AudespAuthServiceV2.renovarToken();
      return AudespAuthServiceV2.sessaoAtiva?.token || null;
    }

    // Se expirou completamente, tentar restaurar
    const tokenArmazenado = AudespAuthServiceV2.restaurarToken();
    if (tokenArmazenado) {
      AudespAuthServiceV2.sessaoAtiva = tokenArmazenado;
      return tokenArmazenado.token;
    }

    console.warn('[Auth] Nenhum token válido disponível');
    return null;
  }

  /**
   * RENOVAR TOKEN - Reautenticação automática
   */
  private static async renovarToken(): Promise<TokenJWT | null> {
    // Evitar múltiplas renovações simultâneas
    if (AudespAuthServiceV2.tokenEmRefresh) {
      return AudespAuthServiceV2.tokenEmRefresh;
    }

    if (!AudespAuthServiceV2.sessaoAtiva) {
      return null;
    }

    const { usuario } = AudespAuthServiceV2.sessaoAtiva;
    console.log('[Auth] Renovando token para:', usuario.email);

    // Promessa para sincronizar múltiplas requisições
    AudespAuthServiceV2.tokenEmRefresh = (async () => {
      try {
        const url = `${AudespAuthServiceV2.config.urlBase}/token/refresh`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AudespAuthServiceV2.sessaoAtiva?.token}`,
            'Content-Type': 'application/json'
          },
          timeout: AudespAuthServiceV2.config.timeout
        });

        if (!response.ok) {
          console.error('[Auth] Falha ao renovar token:', response.status);
          AudespAuthServiceV2.logout();
          return null;
        }

        const novoToken = await AudespAuthServiceV2.lerResposta(response);
        
        if (AudespAuthServiceV2.sessaoAtiva) {
          AudespAuthServiceV2.sessaoAtiva.token = novoToken.token;
          AudespAuthServiceV2.sessaoAtiva.expiraEm = 
            new Date(Date.now() + (novoToken.expire_in || 3600) * 1000);
          AudespAuthServiceV2.armazenarToken(AudespAuthServiceV2.sessaoAtiva);
          
          console.log('[Auth] ✅ Token renovado com sucesso');
          return novoToken;
        }

        return null;
      } finally {
        AudespAuthServiceV2.tokenEmRefresh = null;
      }
    })();

    return AudespAuthServiceV2.tokenEmRefresh;
  }

  /**
   * OBTER HEADER DE AUTORIZAÇÃO
   */
  static obterHeaderAutorizacao(): { Authorization: string } | null {
    const token = AudespAuthServiceV2.sessaoAtiva?.token;

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  /**
   * VERIFICAR SE ESTÁ AUTENTICADO
   */
  static estaAutenticado(): boolean {
    if (!AudespAuthServiceV2.sessaoAtiva) {
      return false;
    }

    return AudespAuthServiceV2.estaValido(AudespAuthServiceV2.sessaoAtiva);
  }

  /**
   * OBTER INFORMAÇÕES DO USUÁRIO
   */
  static obterUsuario() {
    return AudespAuthServiceV2.sessaoAtiva?.usuario || null;
  }

  /**
   * OBTER CONFIGURAÇÃO ATUAL
   */
  static obterConfig(): ConfigAudespAPI {
    return { ...AudespAuthServiceV2.config };
  }

  /**
   * ALTERAR AMBIENTE
   */
  static alterarAmbiente(ambiente: AmbienteAudesp): void {
    console.log('[Auth] Alterando ambiente para:', ambiente);
    AudespAuthServiceV2.configurar({ ambiente });
  }

  // =========================================================================
  // UTILITÁRIOS PRIVADOS
  // =========================================================================

  /**
   * Codificar credenciais para header x-authorization
   */
  private static codificarCredenciais(email: string, senha: string): string {
    // Formato: email:senha em Base64
    const credencial = `${email}:${senha}`;
    return `Basic ${Buffer.from(credencial).toString('base64')}`;
  }

  /**
   * Ler resposta JSON com tratamento de erro
   */
  private static async lerResposta(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return { message: await response.text() };
  }

  /**
   * Validar se token está ainda válido
   */
  private static estaValido(sessao: SessaoAudesp): boolean {
    const agora = new Date();
    return agora < sessao.expiraEm;
  }

  /**
   * Verificar se token está próximo do vencimento (< 5 min)
   */
  private static estaProximoVencimento(sessao: SessaoAudesp): boolean {
    const agora = new Date();
    const diferencaMs = sessao.expiraEm.getTime() - agora.getTime();
    return diferencaMs < 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Armazenar token de forma segura
   */
  private static armazenarToken(sessao: SessaoAudesp): void {
    try {
      // Armazenar em sessionStorage (mais seguro que localStorage)
      sessionStorage.setItem('audesp_token', sessao.token);
      sessionStorage.setItem('audesp_usuario', JSON.stringify(sessao.usuario));

      // Também em localStorage com expiração
      localStorage.setItem('audesp_sessao', JSON.stringify({
        token: sessao.token,
        expiraEm: sessao.expiraEm.toISOString(),
        usuario: sessao.usuario
      }));
    } catch (erro) {
      console.error('[Auth] Erro ao armazenar token:', erro);
    }
  }

  /**
   * Restaurar token armazenado
   */
  private static restaurarToken(): SessaoAudesp | null {
    try {
      const sessaoJson = localStorage.getItem('audesp_sessao') ||
                        sessionStorage.getItem('audesp_sessao');

      if (!sessaoJson) {
        return null;
      }

      const sessao = JSON.parse(sessaoJson);
      const expiraEm = new Date(sessao.expiraEm);

      // Validar se ainda está dentro do prazo
      if (expiraEm < new Date()) {
        console.log('[Auth] Sessão expirada, removendo');
        AudespAuthServiceV2.logout();
        return null;
      }

      return {
        token: sessao.token,
        expiraEm,
        usuario: sessao.usuario,
        criadaEm: new Date(),
        ultimaAtividadeEm: new Date()
      };
    } catch (erro) {
      console.error('[Auth] Erro ao restaurar token:', erro);
      return null;
    }
  }

  /**
   * Extrair nome do email como fallback
   */
  private static extrairNomeEmail(email: string): string {
    const parte = email.split('@')[0];
    return parte
      .split('.')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  /**
   * Mapear código HTTP para mensagem amigável
   */
  private static mapearMensagemErro(status: number): string {
    const mapeamento: { [key: number]: string } = {
      400: 'Dados inválidos. Verifique email e senha.',
      401: 'Email ou senha incorretos.',
      403: 'Acesso negado. Usuário não autorizado.',
      500: 'Erro no servidor de autenticação. Tente novamente mais tarde.',
      503: 'Serviço indisponível. Tente novamente em alguns minutos.'
    };

    return mapeamento[status] || 'Erro ao autenticar. Tente novamente.';
  }
}

export default AudespAuthServiceV2;
