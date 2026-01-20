import { ReportData } from './ReportGenerator';
import { XMLReporter } from './XMLReporter';

/**
 * AUDESPWebService - Integração com WebService de transmissão AUDESP
 */

export interface WebServiceConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  apiKey?: string;
  certPath?: string;
}

export interface TransmissionRequest {
  id: string;
  cnpj: string;
  xmlContent: string;
  timestamp: Date;
  signed: boolean;
}

export interface TransmissionResponse {
  id: string;
  status: 'success' | 'error' | 'pending' | 'rejected';
  protocol: string;
  message: string;
  errors: Array<{
    code: string;
    description: string;
    line?: number;
  }>;
  timestamp: Date;
}

export class AUDESPWebService {
  private static instance: AUDESPWebService;
  private config: WebServiceConfig;
  private xmlReporter: XMLReporter;
  private transmissionHistory: Map<string, TransmissionResponse> = new Map();

  private constructor(config: WebServiceConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
    this.xmlReporter = XMLReporter;
  }

  static initialize(config: WebServiceConfig): AUDESPWebService {
    if (!this.instance) {
      this.instance = new AUDESPWebService(config);
    }
    return this.instance;
  }

  static getInstance(): AUDESPWebService {
    if (!this.instance) {
      throw new Error('AUDESPWebService não inicializado. Chame initialize primeiro.');
    }
    return this.instance;
  }

  /**
   * Preparar requisição de transmissão
   */
  prepareTransmission(reportData: ReportData): TransmissionRequest {
    const xmlContent = this.xmlReporter.generateAUDESPXML(reportData, {
      version: '1.2',
      includeDigitalSignature: false,
    });

    // Validar XML
    const validation = this.xmlReporter.validateXML(xmlContent);
    if (!validation.isValid) {
      throw new Error(`XML inválido: ${validation.errors.join('; ')}`);
    }

    return {
      id: `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cnpj: reportData.formRecord.data.cnpj,
      xmlContent,
      timestamp: new Date(),
      signed: false,
    };
  }

  /**
   * Transmitir documento ao WebService AUDESP
   */
  async transmit(request: TransmissionRequest): Promise<TransmissionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.retryAttempts || 3); attempt++) {
      try {
        // Delay entre tentativas (exceto na primeira)
        if (attempt > 0) {
          await this.delay((this.config.retryDelay || 1000) * attempt);
        }

        const response = await this.sendToWebService(request);
        this.transmissionHistory.set(request.id, response);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Tentativa ${attempt + 1} falhou:`, lastError.message);
      }
    }

    // Se todas as tentativas falharam
    const errorResponse: TransmissionResponse = {
      id: request.id,
      status: 'error',
      protocol: '',
      message: `Erro após ${this.config.retryAttempts} tentativas: ${lastError?.message}`,
      errors: [
        {
          code: 'TRANSMISSION_ERROR',
          description: lastError?.message || 'Erro desconhecido',
        },
      ],
      timestamp: new Date(),
    };

    this.transmissionHistory.set(request.id, errorResponse);
    return errorResponse;
  }

  /**
   * Enviar para WebService (implementação real)
   */
  private async sendToWebService(request: TransmissionRequest): Promise<TransmissionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout || 30000
    );

    try {
      const endpoint = `${this.config.baseURL}/transmissao`;

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'X-AUDESP-Version': '1.2',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        },
        body: request.xmlContent,
        signal: controller.signal,
      };

      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      return {
        id: request.id,
        status: responseData.status || 'pending',
        protocol: responseData.protocol || `PROTO-${Date.now()}`,
        message: responseData.message || 'Transmissão iniciada',
        errors: responseData.errors || [],
        timestamp: new Date(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Consultar status de transmissão
   */
  async queryStatus(transactionId: string): Promise<TransmissionResponse | null> {
    // Primeiro tenta buscar no histórico local
    if (this.transmissionHistory.has(transactionId)) {
      return this.transmissionHistory.get(transactionId)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout || 30000
      );

      const endpoint = `${this.config.baseURL}/transmissao/${transactionId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseData = await response.json();

      const statusResponse: TransmissionResponse = {
        id: transactionId,
        status: responseData.status,
        protocol: responseData.protocol,
        message: responseData.message,
        errors: responseData.errors || [],
        timestamp: new Date(),
      };

      this.transmissionHistory.set(transactionId, statusResponse);
      return statusResponse;
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      return null;
    }
  }

  /**
   * Processar resposta de rejeição
   */
  processRejectionResponse(response: TransmissionResponse): {
    isRejected: boolean;
    criticalErrors: Array<{ code: string; description: string }>;
    warnings: Array<{ code: string; description: string }>;
    recommendation: string;
  } {
    const criticalErrors = response.errors.filter((e) =>
      ['CNPJ_INVALID', 'CNPJ_BLOCKED', 'DATA_INVALID', 'FORMAT_ERROR'].includes(e.code)
    );

    const warnings = response.errors.filter((e) =>
      !['CNPJ_INVALID', 'CNPJ_BLOCKED', 'DATA_INVALID', 'FORMAT_ERROR'].includes(e.code)
    );

    let recommendation = '';
    if (criticalErrors.some((e) => e.code === 'CNPJ_INVALID')) {
      recommendation = 'Verifique o CNPJ informado no formulário';
    } else if (criticalErrors.some((e) => e.code === 'CNPJ_BLOCKED')) {
      recommendation = 'CNPJ bloqueado. Contate o suporte AUDESP';
    } else if (criticalErrors.some((e) => e.code === 'DATA_INVALID')) {
      recommendation = 'Corrija os dados inválidos e reenvie';
    } else if (criticalErrors.some((e) => e.code === 'FORMAT_ERROR')) {
      recommendation = 'XML em formato inválido. Revise o documento';
    } else if (warnings.length > 0) {
      recommendation = 'Documento aceito com advertências. Verifique os detalhes.';
    } else {
      recommendation = 'Reenvie o documento após correções';
    }

    return {
      isRejected: response.status === 'rejected',
      criticalErrors,
      warnings,
      recommendation,
    };
  }

  /**
   * Obter histórico de transmissões
   */
  getTransmissionHistory(): Array<{ id: string; response: TransmissionResponse }> {
    return Array.from(this.transmissionHistory.entries()).map(([id, response]) => ({
      id,
      response,
    }));
  }

  /**
   * Limpar histórico
   */
  clearHistory(): void {
    this.transmissionHistory.clear();
  }

  /**
   * Gerar relatório de transmissões
   */
  generateTransmissionReport(): string {
    const history = this.getTransmissionHistory();
    let report = '📊 RELATÓRIO DE TRANSMISSÕES AUDESP\n';
    report += '='.repeat(60) + '\n\n';

    const successful = history.filter((h) => h.response.status === 'success').length;
    const rejected = history.filter((h) => h.response.status === 'rejected').length;
    const pending = history.filter((h) => h.response.status === 'pending').length;
    const errors = history.filter((h) => h.response.status === 'error').length;

    report += `✅ Sucesso: ${successful}\n`;
    report += `❌ Rejeitado: ${rejected}\n`;
    report += `⏳ Pendente: ${pending}\n`;
    report += `🚫 Erro: ${errors}\n\n`;

    report += 'DETALHES:\n';
    report += '-'.repeat(60) + '\n';

    history.forEach((h, i) => {
      report += `\n${i + 1}. ID: ${h.id}\n`;
      report += `   Status: ${h.response.status}\n`;
      report += `   Protocol: ${h.response.protocol || 'N/A'}\n`;
      report += `   Timestamp: ${h.response.timestamp.toISOString()}\n`;

      if (h.response.errors.length > 0) {
        report += `   Erros:\n`;
        h.response.errors.forEach((error) => {
          report += `     - ${error.code}: ${error.description}\n`;
        });
      }
    });

    return report;
  }

  /**
   * Testar conexão com WebService
   */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await fetch(`${this.config.baseURL}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        return { connected: true, message: 'Conexão estabelecida com sucesso' };
      } else {
        return {
          connected: false,
          message: `Erro HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        connected: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      };
    }
  }

  /**
   * Auxiliar: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default AUDESPWebService;
