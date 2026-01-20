import type { PrestacaoConta } from './audespSchemaTypes';

interface TransmissionResult {
  success: boolean;
  protocol?: string;
  timestamp?: string;
  error?: string;
  details?: any;
}

class AudespTransmissionService {
  private readonly API_URL = '/api/audesp';
  private readonly API_TIMEOUT = 30000;

  /**
   * Transmite dados para a API AUDESP
   */
  async transmitData(data: PrestacaoConta): Promise<TransmissionResult> {
    try {
      const payload = this.preparePayload(data);

      const response = await this.fetch(`${this.API_URL}/transmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          protocol: result.protocol || this.generateProtocol(),
          timestamp: new Date().toISOString(),
          details: result,
        };
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erro na transmissão');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro desconhecido na transmissão',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifica status de uma transmissão anterior
   */
  async checkTransmissionStatus(protocol: string): Promise<TransmissionResult> {
    try {
      const response = await this.fetch(
        `${this.API_URL}/status/${protocol}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          protocol,
          details: result,
        };
      } else {
        throw new Error('Protocolo não encontrado');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Resubmite uma transmissão falhada
   */
  async retryTransmission(protocol: string, data: PrestacaoConta): Promise<TransmissionResult> {
    try {
      const payload = this.preparePayload(data);
      payload.originalProtocol = protocol;

      const response = await this.fetch(`${this.API_URL}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          protocol: result.protocol || this.generateProtocol(),
          timestamp: new Date().toISOString(),
          details: result,
        };
      } else {
        throw new Error('Erro ao reenviar dados');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Preparar payload para envio
   */
  private preparePayload(data: PrestacaoConta): any {
    return {
      exercicio: data.exercicio,
      dataPrestacao: data.dataPrestacao,
      entidade: {
        nome: data.entidade.nome,
        cnpj: this.cleanCNPJ(data.entidade.cnpj),
        natureza: data.entidade.natureza,
        esfera: data.entidade.esfera,
      },
      responsavel: {
        nome: data.responsavel.nome,
        cpf: this.cleanCPF(data.responsavel.cpf),
        email: data.responsavel.email,
        cargo: data.responsavel.cargo,
      },
      financeiro: {
        receitaTotal: data.financeiro.receitaTotal,
        despesaTotal: data.financeiro.despesaTotal,
        resultadoExercicio: data.financeiro.resultadoExercicio,
      },
      projetos: data.projetos?.length || 0,
      atividades: data.atividades?.length || 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Gerar número de protocolo
   */
  private generateProtocol(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `AUDESP-${year}${month}${day}-${random}`;
  }

  /**
   * Limpar CPF
   */
  private cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  /**
   * Limpar CNPJ
   */
  private cleanCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  /**
   * Fetch com timeout
   */
  private async fetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validar dados antes de transmitir
   */
  validateForTransmission(data: PrestacaoConta): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.entidade?.cnpj) errors.push('CNPJ da entidade é obrigatório');
    if (!data.responsavel?.cpf) errors.push('CPF do responsável é obrigatório');
    if (!data.responsavel?.email) errors.push('Email do responsável é obrigatório');
    if (!data.financeiro?.receitaTotal) errors.push('Receita total é obrigatória');
    if (data.exercicio < 1900) errors.push('Exercício fiscal inválido');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const audespTransmissionService = new AudespTransmissionService();
