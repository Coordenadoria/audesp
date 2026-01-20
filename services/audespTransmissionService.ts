/**
 * Serviço de Transmissão AUDESP
 * Submissão de dados para API oficial com rastreamento de protocolo
 */

import { PrestacaoContasAudesp } from './audespSchemaTypes';
import { AudespValidator, ValidationResult } from './audespValidator';
import { AudespJsonService } from './audespJsonService';

export interface ProtocolLog {
  id: string;
  timestamp: Date;
  status: 'pendente' | 'enviado' | 'sucesso' | 'erro' | 'rejeitado';
  protocolNumber?: string;
  municipio: string;
  entidade: string;
  ano: number;
  mes: number;
  mensagem: string;
  detalhes?: any;
  jsonSnapshot: string;
  validationResult?: ValidationResult;
}

export interface TransmissionResponse {
  success: boolean;
  protocolNumber?: string;
  message: string;
  timestamp: Date;
  validationErrors?: Array<{ field: string; message: string }>;
  serverResponse?: any;
}

export interface TransmissionOptions {
  ambiente?: 'piloto' | 'producao';
  email?: string;
  senhaSuporte?: string;
  autoValidate?: boolean;
  dryRun?: boolean;
}

/**
 * Gerencia transmissão de dados para AUDESP
 * Com rastreamento imutável de protocolo
 */
export class AudespTransmissionService {
  private static logs: ProtocolLog[] = [];
  private static readonly API_BASE = {
    piloto: 'https://audesp-piloto.tce.sp.gov.br/api/v1',
    producao: 'https://audesp.tce.sp.gov.br/api/v1'
  };

  /**
   * Transmite dados para AUDESP
   */
  static async transmit(
    data: Partial<PrestacaoContasAudesp>,
    options: TransmissionOptions = {}
  ): Promise<TransmissionResponse> {
    const {
      ambiente = 'piloto',
      email,
      senhaSuporte,
      autoValidate = true,
      dryRun = false
    } = options;

    const logId = this.generateLogId();
    const timestamp = new Date();

    // Validar dados
    const validation = autoValidate 
      ? AudespValidator.validate(data)
      : { valid: true, errors: [], warnings: [], summary: { totalErrors: 0, totalWarnings: 0, sections: {} } };

    if (!validation.valid && !dryRun) {
      const response: TransmissionResponse = {
        success: false,
        message: `Validação falhou: ${validation.errors.length} erro(s) encontrado(s)`,
        timestamp,
        validationErrors: validation.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      };

      this.logTransmission(logId, 'erro', data, validation, response.message);
      return response;
    }

    // Preparar JSON
    const jsonData = AudespJsonService.exportJson(data, {
      includeEmptyFields: false,
      prettyPrint: false
    });

    // Modo dry-run
    if (dryRun) {
      const dryRunMessage = `[DRY RUN] Dados prontos para transmissão\nValidação: ${validation.valid ? 'OK' : 'COM ERROS'}\nTamanho: ${jsonData.length} bytes`;
      
      this.logTransmission(logId, 'pendente', data, validation, dryRunMessage);
      
      return {
        success: true,
        message: dryRunMessage,
        timestamp
      };
    }

    // Transmitir para API
    try {
      const response = await this.submitToAPI(jsonData, ambiente, email, senhaSuporte);

      if (response.success) {
        const protocolNumber = response.protocolNumber || this.generateProtocolNumber();
        
        this.logTransmission(
          logId,
          'sucesso',
          data,
          validation,
          `Transmissão bem-sucedida. Protocolo: ${protocolNumber}`,
          protocolNumber,
          response
        );

        return {
          success: true,
          protocolNumber,
          message: `Dados transmitidos com sucesso! Protocolo: ${protocolNumber}`,
          timestamp
        };
      } else {
        this.logTransmission(
          logId,
          'rejeitado',
          data,
          validation,
          `API rejeitou: ${response.message}`,
          undefined,
          response
        );

        return {
          success: false,
          message: response.message,
          timestamp,
          serverResponse: response
        };
      }
    } catch (error: any) {
      const errorMessage = `Erro na transmissão: ${error.message}`;
      
      this.logTransmission(logId, 'erro', data, validation, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Submete dados para API AUDESP
   */
  private static async submitToAPI(
    jsonData: string,
    ambiente: 'piloto' | 'producao',
    email?: string,
    senhaSuporte?: string
  ): Promise<any> {
    const baseUrl = this.API_BASE[ambiente];
    
    try {
      const response = await fetch(`${baseUrl}/transmissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(email && senhaSuporte && {
            'Authorization': `Bearer ${btoa(`${email}:${senhaSuporte}`)}`
          })
        },
        body: jsonData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        protocolNumber: result.numeroProtocolo || result.protocol_number,
        message: result.mensagem || 'Transmissão aceita',
        data: result
      };
    } catch (error: any) {
      console.error('Erro ao enviar para API:', error);
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  /**
   * Registra transmissão no log imutável
   */
  private static logTransmission(
    id: string,
    status: ProtocolLog['status'],
    data: Partial<PrestacaoContasAudesp>,
    validation: ValidationResult,
    mensagem: string,
    protocolNumber?: string,
    detalhes?: any
  ) {
    const log: ProtocolLog = {
      id,
      timestamp: new Date(),
      status,
      protocolNumber,
      municipio: data.descritor?.municipio || 'Desconhecido',
      entidade: data.descritor?.entidade || 'Desconhecida',
      ano: data.descritor?.ano || 0,
      mes: data.descritor?.mes || 0,
      mensagem,
      detalhes,
      jsonSnapshot: AudespJsonService.exportJson(data),
      validationResult: validation
    };

    this.logs.push(log);

    // Persistir em localStorage (backup)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existing = JSON.parse(localStorage.getItem('audesp_transmission_logs') || '[]');
        existing.push(log);
        localStorage.setItem('audesp_transmission_logs', JSON.stringify(existing.slice(-100)));
      } catch (error) {
        console.warn('Não foi possível salvar log no localStorage', error);
      }
    }
  }

  /**
   * Retorna o histórico de transmissões
   */
  static getLogs(): ProtocolLog[] {
    return [...this.logs];
  }

  /**
   * Retorna log específico por ID
   */
  static getLog(logId: string): ProtocolLog | undefined {
    return this.logs.find(l => l.id === logId);
  }

  /**
   * Retorna último protocolo bem-sucedido
   */
  static getLastSuccessfulProtocol(): ProtocolLog | undefined {
    return [...this.logs]
      .reverse()
      .find(l => l.status === 'sucesso' && l.protocolNumber);
  }

  /**
   * Exporta logs de transmissão
   */
  static exportLogs(): string {
    const report = {
      exportedAt: new Date().toISOString(),
      totalTransmissions: this.logs.length,
      successful: this.logs.filter(l => l.status === 'sucesso').length,
      failed: this.logs.filter(l => l.status === 'erro').length,
      rejected: this.logs.filter(l => l.status === 'rejeitado').length,
      pending: this.logs.filter(l => l.status === 'pendente').length,
      logs: this.logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        protocolNumber: log.protocolNumber,
        municipio: log.municipio,
        entidade: log.entidade,
        ano: log.ano,
        mes: log.mes,
        mensagem: log.mensagem,
        validationErrorCount: log.validationResult?.errors.length ?? 0
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Retorna resumo das transmissões
   */
  static getSummary() {
    const total = this.logs.length;
    const successful = this.logs.filter(l => l.status === 'sucesso').length;
    const failed = this.logs.filter(l => l.status === 'erro').length;
    const rejected = this.logs.filter(l => l.status === 'rejeitado').length;
    const pending = this.logs.filter(l => l.status === 'pendente').length;

    return {
      total,
      successful,
      failed,
      rejected,
      pending,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : 'N/A',
      lastTransmission: this.logs[this.logs.length - 1]?.timestamp || null
    };
  }

  /**
   * Valida formato antes de transmissão
   */
  static validateForTransmission(data: Partial<PrestacaoContasAudesp>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.descritor) {
      errors.push('Descritor é obrigatório');
    }

    if (!data.receitas) {
      errors.push('Receitas são obrigatórias');
    }

    if (!data.pagamentos) {
      errors.push('Pagamentos são obrigatórios');
    }

    // Validação AUDESP específica
    const validation = AudespValidator.validate(data);
    errors.push(...validation.errors.map(e => `${e.path}: ${e.message}`));

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gera ID único para log
   */
  private static generateLogId(): string {
    return `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera número de protocolo temporário
   */
  private static generateProtocolNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `AUDESP${year}${month}${day}${random}`;
  }

  /**
   * Limpa logs antigos (> 30 dias)
   */
  static cleanupOldLogs(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    return initialLength - this.logs.length;
  }

  /**
   * Reset para testes
   */
  static reset(): void {
    this.logs = [];
  }
}
