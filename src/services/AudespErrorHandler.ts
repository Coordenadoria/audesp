/**
 * AUDESP ERROR HANDLER
 * Tratamento padronizado de erros e mapeamento para UI
 * 
 * - Parser de erros AUDESP
 * - Mapeamento para campos do formulário
 * - Mensagens amigáveis
 * - Sugestões de correção
 */

import { ErroAudesp, RespostaAPI } from './types/audesp.types';

export interface ErroMapeado {
  /** Código do erro para programação */
  codigo: string;

  /** Mensagem principal para o usuário */
  mensagem: string;

  /** Tipo do erro */
  tipo: 'validacao' | 'autenticacao' | 'autorizacao' | 'servidor' | 'conexao' | 'desconhecido';

  /** Erros por campo (para formulários) */
  errosJasmim?: {
    campo: string;
    mensagem: string;
  }[];

  /** Sugestão de como corrigir */
  dica?: string;

  /** Status HTTP */
  statusCode: number;

  /** É recuperável? */
  recuperavel: boolean;

  /** Protocolo de rastreamento */
  protocoloRequisicao?: string;
}

class AudespErrorHandler {
  /**
   * Processar resposta de erro da API
   */
  static processar(resposta: RespostaAPI | Response | Error): ErroMapeado {
    // Se for Response do fetch
    if (resposta instanceof Response) {
      return this.processarResponseHttp(resposta);
    }

    // Se for Error
    if (resposta instanceof Error) {
      return this.processarError(resposta);
    }

    // Se for RespostaAPI
    return this.processarRespostaAPI(resposta);
  }

  /**
   * Processar erro de resposta HTTP
   */
  private static processarResponseHttp(response: Response): ErroMapeado {
    const status = response.status;

    const mapeamento: { [key: number]: ErroMapeado } = {
      400: {
        codigo: '400',
        mensagem: 'Dados enviados estão inválidos.',
        tipo: 'validacao',
        dica: 'Verifique se todos os campos obrigatórios foram preenchidos corretamente.',
        statusCode: 400,
        recuperavel: true
      },
      401: {
        codigo: '401',
        mensagem: 'Sessão expirada ou credenciais inválidas.',
        tipo: 'autenticacao',
        dica: 'Faça login novamente com suas credenciais do portal AUDESP.',
        statusCode: 401,
        recuperavel: true
      },
      403: {
        codigo: '403',
        mensagem: 'Você não tem permissão para executar esta ação.',
        tipo: 'autorizacao',
        dica: 'Entre em contato com o administrador para verificar suas permissões.',
        statusCode: 403,
        recuperavel: false
      },
      413: {
        codigo: '413',
        mensagem: 'Arquivo muito grande.',
        tipo: 'validacao',
        dica: 'O arquivo PDF não pode exceder 30MB. Tente comprimir o documento.',
        statusCode: 413,
        recuperavel: true
      },
      422: {
        codigo: '422',
        mensagem: 'Validação falhou. Verifique os dados enviados.',
        tipo: 'validacao',
        dica: 'Revise os campos indicados nos detalhes do erro.',
        statusCode: 422,
        recuperavel: true
      },
      429: {
        codigo: '429',
        mensagem: 'Muitas requisições. Tente novamente em alguns minutos.',
        tipo: 'conexao',
        dica: 'Você está enviando solicitações com muita frequência. Aguarde um tempo.',
        statusCode: 429,
        recuperavel: true
      },
      500: {
        codigo: '500',
        mensagem: 'Erro interno no servidor AUDESP.',
        tipo: 'servidor',
        dica: 'O servidor está com problemas. Tente novamente em alguns minutos.',
        statusCode: 500,
        recuperavel: true
      },
      502: {
        codigo: '502',
        mensagem: 'Serviço temporariamente indisponível.',
        tipo: 'servidor',
        dica: 'O servidor AUDESP está em manutenção. Tente novamente mais tarde.',
        statusCode: 502,
        recuperavel: true
      },
      503: {
        codigo: '503',
        mensagem: 'Serviço indisponível.',
        tipo: 'servidor',
        dica: 'O servidor AUDESP está sobrecarregado. Tente novamente em alguns minutos.',
        statusCode: 503,
        recuperavel: true
      }
    };

    return (
      mapeamento[status] || {
        codigo: String(status),
        mensagem: `Erro HTTP ${status}`,
        tipo: 'desconhecido',
        statusCode: status,
        recuperavel: status >= 500
      }
    );
  }

  /**
   * Processar objeto de erro JavaScript
   */
  private static processarError(error: Error): ErroMapeado {
    const mensagem = error.message || 'Erro desconhecido';

    if (mensagem.includes('Failed to fetch')) {
      return {
        codigo: 'NETWORK_ERROR',
        mensagem: 'Erro de conexão com o servidor.',
        tipo: 'conexao',
        dica: 'Verifique sua conexão com a internet e tente novamente.',
        statusCode: 0,
        recuperavel: true
      };
    }

    if (mensagem.includes('timeout')) {
      return {
        codigo: 'TIMEOUT',
        mensagem: 'Requisição excedeu o tempo limite.',
        tipo: 'conexao',
        dica: 'A conexão está lenta. Tente novamente.',
        statusCode: 0,
        recuperavel: true
      };
    }

    if (mensagem.includes('CORS')) {
      return {
        codigo: 'CORS_ERROR',
        mensagem: 'Erro de política de origem (CORS).',
        tipo: 'servidor',
        dica: 'Você pode estar em um ambiente não autorizado. Verifique a URL.',
        statusCode: 0,
        recuperavel: false
      };
    }

    return {
      codigo: 'UNKNOWN_ERROR',
      mensagem: mensagem || 'Erro desconhecido',
      tipo: 'desconhecido',
      statusCode: 0,
      recuperavel: true
    };
  }

  /**
   * Processar resposta de API do AUDESP
   */
  private static processarRespostaAPI(resposta: RespostaAPI): ErroMapeado {
    const statusCode = resposta.status || 500;

    // Se tem erro específico
    if (resposta.error) {
      // Tentar parsear como ErroAudesp
      let erroAudesp: ErroAudesp | null = null;

      try {
        if (typeof resposta.error === 'string') {
          erroAudesp = JSON.parse(resposta.error);
        } else {
          erroAudesp = resposta.error as ErroAudesp;
        }
      } catch {
        // Não é JSON, é string simples
      }

      if (erroAudesp && erroAudesp.erros) {
        return {
          codigo: erroAudesp.codigo || String(statusCode),
          mensagem: erroAudesp.mensagem,
          tipo: this.mapearTipoErro(erroAudesp.codigo || String(statusCode)),
          errosJasmim: erroAudesp.erros,
          dica: erroAudesp.dica || this.gerarDica(statusCode),
          statusCode,
          recuperavel: statusCode < 500 || statusCode === 502 || statusCode === 503,
          protocoloRequisicao: erroAudesp.protocolo_requisicao
        };
      }

      return {
        codigo: String(statusCode),
        mensagem: resposta.message || resposta.error || 'Erro na requisição',
        tipo: this.mapearTipoErro(String(statusCode)),
        dica: this.gerarDica(statusCode),
        statusCode,
        recuperavel: statusCode < 500 || statusCode === 502 || statusCode === 503
      };
    }

    return {
      codigo: String(statusCode),
      mensagem: resposta.message || 'Erro desconhecido',
      tipo: 'desconhecido',
      statusCode,
      recuperavel: true
    };
  }

  /**
   * Mapear tipo de erro
   */
  private static mapearTipoErro(codigo: string): ErroMapeado['tipo'] {
    if (codigo === '401' || codigo === '400') return 'autenticacao';
    if (codigo === '403') return 'autorizacao';
    if (codigo === '413' || codigo === '422') return 'validacao';
    if (parseInt(codigo) >= 500) return 'servidor';
    if (codigo === 'NETWORK_ERROR' || codigo === 'TIMEOUT') return 'conexao';
    return 'desconhecido';
  }

  /**
   * Gerar dica baseada no status
   */
  private static gerarDica(status: number): string {
    if (status === 400) {
      return 'Verifique se todos os campos estão preenchidos corretamente e tente novamente.';
    }
    if (status === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }
    if (status === 403) {
      return 'Você não tem permissão para esta ação. Contate o suporte.';
    }
    if (status === 413) {
      return 'Reduzaoquência o tamanho do arquivo ou tente comprimir o PDF.';
    }
    if (status === 422) {
      return 'Valide os dados nos campos destacados.';
    }
    if (status >= 500) {
      return 'Tente novamente em alguns minutos.';
    }
    return 'Tente novamente.';
  }

  /**
   * Extrair erros por campo
   */
  static extrairErrosPorCampo(erroMapeado: ErroMapeado): { [campo: string]: string } {
    const resultado: { [campo: string]: string } = {};

    if (erroMapeado.errosJasmim) {
      erroMapeado.errosJasmim.forEach(erro => {
        resultado[erro.campo] = erro.mensagem;
      });
    }

    return resultado;
  }

  /**
   * Formatar erro para exibição no console (development)
   */
  static exibirConsole(erro: ErroMapeado): void {
    console.group(`❌ [AUDESP] ${erro.tipo.toUpperCase()} (${erro.codigo})`);
    console.error('Mensagem:', erro.mensagem);
    if (erro.dica) console.warn('Dica:', erro.dica);
    if (erro.errosJasmim) {
      console.table(erro.errosJasmim);
    }
    if (erro.protocoloRequisicao) {
      console.log('Protocolo:', erro.protocoloRequisicao);
    }
    console.groupEnd();
  }

  /**
   * Verificar se erro é recuperável
   */
  static ehRecuperavel(erro: ErroMapeado): boolean {
    return erro.recuperavel;
  }

  /**
   * Obter mensagem amigável para o usuário
   */
  static obterMensagemUsuario(erro: ErroMapeado): string {
    if (erro.errosJasmim && erro.errosJasmim.length > 0) {
      return `${erro.mensagem}\n\nCampos com erro:\n${erro.errosJasmim
        .map(e => `• ${e.campo}: ${e.mensagem}`)
        .join('\n')}`;
    }

    return erro.mensagem;
  }

  /**
   * Verificar se deve tentar retry
   */
  static deveRetentarFetch(erro: ErroMapeado): boolean {
    // Retentáveis: timeout, conexão, 429, 5xx
    return (
      erro.tipo === 'conexao' ||
      erro.codigo === '429' ||
      (erro.statusCode >= 500 && erro.statusCode !== 503)
    );
  }
}

export default AudespErrorHandler;
