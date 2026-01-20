/**
 * AUDESP RETRY & CIRCUIT BREAKER
 * Resiliência e tolerância a falhas
 * 
 * - Retry com backoff exponencial
 * - Circuit breaker para proteção
 * - Timeout configurável
 * - Logging de tentativas
 */

import { ConfigRetry, EstadoCircuitBreaker } from './types/audesp.types';

class RetryCircuitBreaker {
  private static readonly CONFIG_RETRY_DEFAULT: ConfigRetry = {
    maxTentativas: 3,
    delayInicial: 1000,
    delayMaximo: 30000,
    fatorExponencial: 2,
    codigosRetentaveis: [408, 429, 500, 502, 503, 504]
  };

  private static circuitBreakers: Map<string, EstadoCircuitBreaker> = new Map();

  /**
   * Executar função com retry automático
   */
  static async executarComRetry<T>(
    funcao: () => Promise<T>,
    config?: Partial<ConfigRetry>,
    chaveCircuitBreaker?: string
  ): Promise<T> {
    const configFinal = { ...RetryCircuitBreaker.CONFIG_RETRY_DEFAULT, ...config };

    // Verificar circuit breaker
    if (chaveCircuitBreaker) {
      const cb = RetryCircuitBreaker.obterCircuitBreaker(chaveCircuitBreaker);
      if (cb.estado === 'ABERTO') {
        throw new Error(`Circuit breaker aberto para: ${chaveCircuitBreaker}`);
      }
    }

    let ultimoErro: Error | null = null;

    for (let tentativa = 1; tentativa <= configFinal.maxTentativas; tentativa++) {
      try {
        console.log(
          `[Retry] Tentativa ${tentativa}/${configFinal.maxTentativas}`
        );

        const resultado = await funcao();

        // Sucesso - resetar circuit breaker
        if (chaveCircuitBreaker) {
          RetryCircuitBreaker.resetarCircuitBreaker(chaveCircuitBreaker);
        }

        return resultado;
      } catch (erro: any) {
        ultimoErro = erro;

        // Verificar se é código retentável
        const statusCode = erro.statusCode || erro.status || 0;
        const eRetentavel =
          configFinal.codigosRetentaveis.includes(statusCode) ||
          this.ehErroTemporario(erro);

        console.warn(`[Retry] Tentativa ${tentativa} falhou:`, {
          status: statusCode,
          mensagem: erro.message,
          retentavel: eRetentavel
        });

        // Se não é retentável, falhar imediatamente
        if (!eRetentavel) {
          throw erro;
        }

        // Se foi última tentativa
        if (tentativa === configFinal.maxTentativas) {
          console.error(
            `[Retry] Todas as ${configFinal.maxTentativas} tentativas falharam`
          );

          // Abrir circuit breaker após falhas
          if (chaveCircuitBreaker) {
            RetryCircuitBreaker.abrirCircuitBreaker(chaveCircuitBreaker);
          }

          throw erro;
        }

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          configFinal.delayInicial *
          Math.pow(configFinal.fatorExponencial, tentativa - 1),
          configFinal.delayMaximo
        );

        console.log(`[Retry] Aguardando ${delay}ms antes da próxima tentativa...`);

        // Esperar antes de retentarencryption
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw ultimoErro || new Error('Todas as tentativas falharam');
  }

  /**
   * Executar com timeout
   */
  static async executarComTimeout<T>(
    funcao: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      funcao(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * CIRCUIT BREAKER - Obter estado
   */
  private static obterCircuitBreaker(chave: string): EstadoCircuitBreaker {
    if (!RetryCircuitBreaker.circuitBreakers.has(chave)) {
      RetryCircuitBreaker.circuitBreakers.set(chave, {
        estado: 'FECHADO',
        tentativas: 0,
        limiteFalhas: 5,
        tempoResetMs: 60000
      });
    }

    return RetryCircuitBreaker.circuitBreakers.get(chave)!;
  }

  /**
   * CIRCUIT BREAKER - Abrir (stop requisições)
   */
  private static abrirCircuitBreaker(chave: string): void {
    const cb = RetryCircuitBreaker.obterCircuitBreaker(chave);
    cb.estado = 'ABERTO';
    cb.ultimaFalha = new Date();
    cb.tentativas = 0;

    console.warn(`[CircuitBreaker] Circuito ABERTO para: ${chave}`);

    // Auto-reset após tempo especificado
    setTimeout(() => {
      console.log(`[CircuitBreaker] Tentando MEIO_ABERTO para: ${chave}`);
      cb.estado = 'MEIO_ABERTO';
    }, cb.tempoResetMs);
  }

  /**
   * CIRCUIT BREAKER - Resetar (volta ao normal)
   */
  private static resetarCircuitBreaker(chave: string): void {
    const cb = RetryCircuitBreaker.obterCircuitBreaker(chave);

    if (cb.estado !== 'FECHADO') {
      console.log(`[CircuitBreaker] Circuito FECHADO para: ${chave}`);
      cb.estado = 'FECHADO';
      cb.tentativas = 0;
      cb.ultimaFalha = undefined;
    }
  }

  /**
   * Verificar se é erro temporário
   */
  private static ehErroTemporario(erro: any): boolean {
    const mensagem = erro.message || '';

    return (
      mensagem.includes('timeout') ||
      mensagem.includes('ECONNREFUSED') ||
      mensagem.includes('ECONNRESET') ||
      mensagem.includes('Failed to fetch') ||
      mensagem.includes('ERR_NETWORK')
    );
  }

  /**
   * Obter estado de todos os circuit breakers
   */
  static obterEstadoCircuitBreakers(): {
    [chave: string]: EstadoCircuitBreaker;
  } {
    const estado: { [chave: string]: EstadoCircuitBreaker } = {};

    RetryCircuitBreaker.circuitBreakers.forEach((cb, chave) => {
      estado[chave] = { ...cb };
    });

    return estado;
  }

  /**
   * Limpar circuit breaker específico
   */
  static limparCircuitBreaker(chave: string): void {
    RetryCircuitBreaker.circuitBreakers.delete(chave);
    console.log(`[CircuitBreaker] Circuito limpo: ${chave}`);
  }

  /**
   * Limpar todos os circuit breakers
   */
  static limparTodos(): void {
    RetryCircuitBreaker.circuitBreakers.clear();
    console.log('[CircuitBreaker] Todos os circuitos foram limpos');
  }
}

export default RetryCircuitBreaker;
