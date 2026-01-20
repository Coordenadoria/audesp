/**
 * AUDESP API SERVICE V2 - MÓDULO DE INTEGRAÇÃO COMPLETA
 * Integração robusta com APIs do AUDESP TCE-SP
 * 
 * ✅ Autenticação com JWT
 * ✅ Envio Fase IV (Licitações/Contratos)
 * ✅ Envio Fase V (Prestação de Contas)
 * ✅ Consulta de protocolos
 * ✅ Tratamento de erros robusto
 * ✅ Auditoria completa
 * ✅ Retry automático
 * ✅ Circuit breaker
 */

import AudespAuthServiceV2 from './AudespAuthServiceV2';
import AudespErrorHandler, { ErroMapeado } from './AudespErrorHandler';
import { obterLogger } from './AudespAuditLogger';
import RetryCircuitBreaker from './AudespRetryCircuitBreaker';
import { AudespecValidator } from './AudespecValidatorService';

import {
  RespostaAPI,
  ConfigAudespAPI,
  TokenJWT,
  CredenciaisAudesp,
  Protocolo,
  ConsultaProtocoloResposta,
  EnvioFase4Resposta,
  EnvioFase5Resposta,
  Edital,
  Licitacao,
  Ata,
  Ajuste,
  PrestacaoContasConvenio,
  PrestacaoContasContratoGestao,
  DeclaraNegativa,
  TipoPrestacaoConta,
  ArquivoUpload
} from './types/audesp.types';

export class AudespApiServiceV2 {
  /**
   * ============================================================================
   * SEÇÃO 1: INICIALIZAÇÃO E CONFIGURAÇÃO
   * ============================================================================
   */

  /**
   * Inicializar o serviço com configuração customizada
   */
  static configurar(opcoes: Partial<ConfigAudespAPI>): void {
    console.log('[AudespAPI] Configurando serviço...', opcoes);
    AudespAuthServiceV2.configurar(opcoes);
  }

  /**
   * Obter configuração atual
   */
  static obterConfig(): ConfigAudespAPI {
    return AudespAuthServiceV2.obterConfig();
  }

  /**
   * ============================================================================
   * SEÇÃO 2: AUTENTICAÇÃO
   * ============================================================================
   */

  /**
   * Login - Autenticar usuário com credenciais reais
   * @param email Email do usuário no portal AUDESP
   * @param senha Senha do portal AUDESP
   */
  static async login(
    credenciais: CredenciaisAudesp
  ): Promise<RespostaAPI<TokenJWT>> {
    console.log('[AudespAPI] Login iniciado para:', credenciais.email);

    try {
      const resposta = await AudespAuthServiceV2.login(credenciais);

      // Registrar na auditoria
      const logger = obterLogger();
      if (resposta.success && resposta.data?.usuario) {
        logger.registrarLogin(
          resposta.data.usuario.email,
          resposta.data.usuario.nome,
          resposta.data.usuario.cpf || '',
          true
        );
      } else {
        logger.registrarLogin(credenciais.email, '', '', false, resposta.error);
      }

      return resposta;
    } catch (erro: any) {
      console.error('[AudespAPI] Erro ao fazer login:', erro);
      throw AudespErrorHandler.processar(erro);
    }
  }

  /**
   * Logout - Encerrar sessão
   */
  static logout(): void {
    console.log('[AudespAPI] Logout iniciado');

    const usuario = AudespAuthServiceV2.obterConfig();
    const logger = obterLogger();

    if (usuario) {
      logger.registrarLogout({
        email: 'desconhecido',
        nome: 'Desconhecido',
        cpf: ''
      });
    }

    AudespAuthServiceV2.logout();
  }

  /**
   * Verificar se está autenticado
   */
  static estaAutenticado(): boolean {
    return AudespAuthServiceV2.estaAutenticado();
  }

  /**
   * Obter usuário atual
   */
  static obterUsuario() {
    return AudespAuthServiceV2.obterUsuario();
  }

  /**
   * ============================================================================
   * SEÇÃO 3: CONSULTA DE PROTOCOLOS
   * ============================================================================
   */

  /**
   * Consultar status de um protocolo (Fase IV ou V)
   * @param protocolo Número do protocolo AUDESP
   * @param fase Fase (f4 ou f5)
   */
  static async consultarProtocolo(
    protocolo: string,
    fase: 'f4' | 'f5' = 'f5'
  ): Promise<RespostaAPI<ConsultaProtocoloResposta>> {
    const logger = obterLogger();
    const usuario = AudespAuthServiceV2.obterUsuario();
    const inicio = Date.now();

    try {
      console.log(`[AudespAPI] Consultando protocolo: ${protocolo} (${fase})`);

      const config = AudespAuthServiceV2.obterConfig();
      const url = `${config.urlBase}/${fase}/consulta/${protocolo}`;

      const resposta = await RetryCircuitBreaker.executarComRetry(
        () =>
          RetryCircuitBreaker.executarComTimeout(
            () =>
              fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  ...(AudespAuthServiceV2.obterHeaderAutorizacao() || {})
                },
                timeout: config.timeout
              }),
            config.timeout
          ),
        undefined,
        `consulta-${fase}`
      );

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      const dados = await resposta.json();
      const tempoMs = Date.now() - inicio;

      logger.registrarConsulta(
        usuario || {
          email: 'anonimo',
          nome: 'Anônimo',
          cpf: ''
        },
        url,
        protocolo,
        true,
        tempoMs
      );

      return {
        success: true,
        data: dados,
        status: resposta.status,
        message: 'Protocolo consultado com sucesso'
      };
    } catch (erro: any) {
      const tempoMs = Date.now() - inicio;

      logger.registrarErro(
        usuario,
        `${AudespAuthServiceV2.obterConfig().urlBase}/${fase}/consulta/${protocolo}`,
        'GET',
        erro.statusCode || 0,
        erro.message,
        protocolo
      );

      const erroMapeado = AudespErrorHandler.processar(erro);
      AudespErrorHandler.exibirConsole(erroMapeado);

      return {
        success: false,
        status: erroMapeado.statusCode,
        error: erroMapeado.mensagem,
        message: erroMapeado.dica
      };
    }
  }

  /**
   * ============================================================================
   * SEÇÃO 4: ENVIO FASE IV (LICITAÇÕES E CONTRATOS)
   * ============================================================================
   */

  /**
   * Enviar Edital
   */
  static async enviarEdital(
    edital: Edital,
    arquivo?: ArquivoUpload
  ): Promise<RespostaAPI<EnvioFase4Resposta>> {
    return this.enviarFase4('enviar-edital', edital, arquivo);
  }

  /**
   * Enviar Licitação
   */
  static async enviarLicitacao(
    licitacao: Licitacao,
    arquivo?: ArquivoUpload
  ): Promise<RespostaAPI<EnvioFase4Resposta>> {
    return this.enviarFase4('enviar-licitacao', licitacao, arquivo);
  }

  /**
   * Enviar Ata
   */
  static async enviarAta(
    ata: Ata,
    arquivo?: ArquivoUpload
  ): Promise<RespostaAPI<EnvioFase4Resposta>> {
    return this.enviarFase4('enviar-ata', ata, arquivo);
  }

  /**
   * Enviar Ajuste
   */
  static async enviarAjuste(
    ajuste: Ajuste,
    arquivo?: ArquivoUpload
  ): Promise<RespostaAPI<EnvioFase4Resposta>> {
    return this.enviarFase4('enviar-ajuste', ajuste, arquivo);
  }

  /**
   * Implementação genérica de envio Fase IV
   */
  private static async enviarFase4(
    rota: string,
    dados: any,
    arquivo?: ArquivoUpload
  ): Promise<RespostaAPI<EnvioFase4Resposta>> {
    const logger = obterLogger();
    const usuario = AudespAuthServiceV2.obterUsuario();
    const inicio = Date.now();

    try {
      // Validar dados localmente
      const config = AudespAuthServiceV2.obterConfig();
      if (config.validarSchemaAntes) {
        console.log(`[AudespAPI] Validando dados localmente...`);
        const validacao = new AudespecValidator().validar(dados);
        if (!validacao.valido) {
          throw new Error(
            `Validação falhou: ${validacao.erros.map(e => e.mensagem).join(', ')}`
          );
        }
      }

      const url = `${config.urlBase}/recepcao-fase-4/f4/${rota}`;
      console.log(`[AudespAPI] POST ${url}`);

      // Preparar FormData
      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify(dados)], {
        type: 'application/json'
      });
      formData.append('documentoJSON', jsonBlob, 'data.json');

      if (arquivo) {
        formData.append('arquivoPDF', arquivo.conteudo, arquivo.nome);
      }

      // Enviar com retry
      const resposta = await RetryCircuitBreaker.executarComRetry(
        () =>
          RetryCircuitBreaker.executarComTimeout(
            () =>
              fetch(url, {
                method: 'POST',
                headers: AudespAuthServiceV2.obterHeaderAutorizacao() || {},
                body: formData,
                timeout: config.timeout
              }),
            config.timeout
          ),
        undefined,
        `envio-f4-${rota}`
      );

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      const dadosResposta = await resposta.json();
      const tempoMs = Date.now() - inicio;
      const protocolo = dadosResposta.protocolo;

      logger.registrarEnvio(usuario || {
        email: 'anonimo',
        nome: 'Anônimo',
        cpf: ''
      }, url, protocolo, true, tempoMs);

      console.log(`[AudespAPI] ✅ Envio bem-sucedido. Protocolo: ${protocolo}`);

      return {
        success: true,
        data: dadosResposta,
        status: resposta.status,
        message: `Documento enviado com sucesso. Protocolo: ${protocolo}`
      };
    } catch (erro: any) {
      const tempoMs = Date.now() - inicio;

      logger.registrarErro(
        usuario,
        `${AudespAuthServiceV2.obterConfig().urlBase}/recepcao-fase-4/f4/${rota}`,
        'POST',
        erro.statusCode || 0,
        erro.message
      );

      const erroMapeado = AudespErrorHandler.processar(erro);
      AudespErrorHandler.exibirConsole(erroMapeado);

      return {
        success: false,
        status: erroMapeado.statusCode,
        error: erroMapeado.mensagem,
        message: AudespErrorHandler.obterMensagemUsuario(erroMapeado)
      };
    }
  }

  /**
   * ============================================================================
   * SEÇÃO 5: ENVIO FASE V (PRESTAÇÃO DE CONTAS)
   * ============================================================================
   */

  /**
   * Enviar Prestação de Contas (Convênio)
   */
  static async enviarPrestacaoContasConvenio(
    dados: PrestacaoContasConvenio
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('enviar-prestacao-contas-convenio', dados);
  }

  /**
   * Enviar Prestação de Contas (Contrato de Gestão)
   */
  static async enviarPrestacaoContasContratoGestao(
    dados: PrestacaoContasContratoGestao
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('enviar-prestacao-contas-contrato-gestao', dados);
  }

  /**
   * Enviar Prestação de Contas (Termo de Colaboração)
   */
  static async enviarPrestacaoContasTermoColaboracao(
    dados: any
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('enviar-prestacao-contas-termo-colaboracao', dados);
  }

  /**
   * Enviar Prestação de Contas (Termo de Fomento)
   */
  static async enviarPrestacaoContasTermoFomento(
    dados: any
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('enviar-prestacao-contas-termo-fomento', dados);
  }

  /**
   * Enviar Prestação de Contas (Termo de Parceria)
   */
  static async enviarPrestacaoContasTermoParceria(
    dados: any
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('enviar-prestacao-contas-termo-parceria', dados);
  }

  /**
   * Enviar Declaração Negativa
   */
  static async enviarDeclaraNegativa(
    dados: DeclaraNegativa
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    return this.enviarFase5('declaracao-negativa', dados);
  }

  /**
   * Implementação genérica de envio Fase V
   */
  private static async enviarFase5(
    rota: string,
    dados: any
  ): Promise<RespostaAPI<EnvioFase5Resposta>> {
    const logger = obterLogger();
    const usuario = AudespAuthServiceV2.obterUsuario();
    const inicio = Date.now();

    try {
      // Validar dados localmente
      const config = AudespAuthServiceV2.obterConfig();
      if (config.validarSchemaAntes) {
        console.log(`[AudespAPI] Validando dados localmente...`);
        const validacao = new AudespecValidator().validar(dados);
        if (!validacao.valido) {
          throw new Error(
            `Validação falhou: ${validacao.erros.map(e => e.mensagem).join(', ')}`
          );
        }
      }

      const url = `${config.urlBase}/f5/${rota}`;
      console.log(`[AudespAPI] POST ${url}`);

      // Preparar FormData
      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify(dados)], {
        type: 'application/json'
      });
      formData.append('documentoJSON', jsonBlob, 'data.json');

      // Enviar com retry
      const resposta = await RetryCircuitBreaker.executarComRetry(
        () =>
          RetryCircuitBreaker.executarComTimeout(
            () =>
              fetch(url, {
                method: 'POST',
                headers: AudespAuthServiceV2.obterHeaderAutorizacao() || {},
                body: formData,
                timeout: config.timeout
              }),
            config.timeout
          ),
        undefined,
        `envio-f5-${rota}`
      );

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`);
      }

      const dadosResposta = await resposta.json();
      const tempoMs = Date.now() - inicio;
      const protocolo = dadosResposta.protocolo;

      logger.registrarEnvio(usuario || {
        email: 'anonimo',
        nome: 'Anônimo',
        cpf: ''
      }, url, protocolo, true, tempoMs);

      console.log(`[AudespAPI] ✅ Envio bem-sucedido. Protocolo: ${protocolo}`);

      return {
        success: true,
        data: dadosResposta,
        status: resposta.status,
        message: `Prestação de contas enviada com sucesso. Protocolo: ${protocolo}`
      };
    } catch (erro: any) {
      const tempoMs = Date.now() - inicio;

      logger.registrarErro(
        usuario,
        `${AudespAuthServiceV2.obterConfig().urlBase}/f5/${rota}`,
        'POST',
        erro.statusCode || 0,
        erro.message
      );

      const erroMapeado = AudespErrorHandler.processar(erro);
      AudespErrorHandler.exibirConsole(erroMapeado);

      return {
        success: false,
        status: erroMapeado.statusCode,
        error: erroMapeado.mensagem,
        message: AudespErrorHandler.obterMensagemUsuario(erroMapeado)
      };
    }
  }

  /**
   * ============================================================================
   * SEÇÃO 6: AUDITORIA E RELATÓRIOS
   * ============================================================================
   */

  /**
   * Obter relatório de auditoria
   */
  static obterRelatorioAuditoria() {
    const logger = obterLogger();
    return logger.gerarRelatorio();
  }

  /**
   * Exportar logs em CSV
   */
  static exportarLogsCSV(): string {
    const logger = obterLogger();
    return logger.exportarCSV();
  }

  /**
   * Exportar logs em JSON
   */
  static exportarLogsJSON(): string {
    const logger = obterLogger();
    return logger.exportarJSON();
  }
}

export default AudespApiServiceV2;
