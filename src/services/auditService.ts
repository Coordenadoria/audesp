/**
 * MÓDULO DE AUDITORIA E LOGGING
 * Sistema completo de rastreamento de alterações e auditoria
 * 
 * Responsabilidades:
 * - Log de todas as operações
 * - Rastreamento de alterações (quem, quando, o quê)
 * - Histórico completo de versões
 * - Geração de relatório de auditoria
 * - Verificação de integridade
 */

import { PrestacaoContas } from '../types';

// ==================== TIPOS ====================

export interface AuditEntry {
  id: string; // UUID
  timestamp: string; // ISO 8601
  userId?: string; // Email ou ID do usuário
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'TRANSMIT' | 'VALIDATE' | 'EXPORT' | 'IMPORT';
  section?: string; // Seção afetada
  field?: string; // Campo específico
  oldValue?: any;
  newValue?: any;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  details?: string; // Descrição adicional
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

export interface ChangeLog {
  field: string;
  section: string;
  timestamp: string;
  oldValue: any;
  newValue: any;
  userId?: string;
}

export interface AuditReport {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  totalOperations: number;
  operationsByType: Record<string, number>;
  changedSections: Record<string, number>;
  changedFields: ChangeLog[];
  userData?: string;
  summary: {
    createsCount: number;
    updatesCount: number;
    deletesCount: number;
    transmitsCount: number;
    failuresCount: number;
  };
}

export interface IntegrityCheck {
  dataHash: string;
  timestamp: string;
  userId?: string;
  isValid: boolean;
  previousHash?: string;
  hashAlgorithm: string;
}

// ==================== AUDIT LOGGER ====================

export class AuditLogger {
  private static readonly STORAGE_KEY = 'audesp_audit_log';
  private static readonly MAX_ENTRIES = 10000; // Limite para não sobrecarregar localStorage

  /**
   * Log de uma operação
   */
  static logOperation(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    const currentLog = this.getLog();
    const updatedLog = [auditEntry, ...currentLog].slice(0, this.MAX_ENTRIES);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLog));
    
    // Log também no console para debugging
    console.log('[AUDIT]', auditEntry);
    
    return auditEntry;
  }

  /**
   * Log de criação de dados
   */
  static logCreate(section: string, data: any, userId?: string): AuditEntry {
    return this.logOperation({
      action: 'CREATE',
      section,
      newValue: data,
      status: 'SUCCESS',
      userId
    });
  }

  /**
   * Log de atualização de dados
   */
  static logUpdate(section: string, field: string, oldValue: any, newValue: any, userId?: string): AuditEntry {
    return this.logOperation({
      action: 'UPDATE',
      section,
      field,
      oldValue,
      newValue,
      status: 'SUCCESS',
      userId
    });
  }

  /**
   * Log de transmissão
   */
  static logTransmission(
    tipoDocumento: string,
    protocolo: string | null,
    status: 'SUCCESS' | 'FAILED',
    errorMessage?: string,
    userId?: string
  ): AuditEntry {
    return this.logOperation({
      action: 'TRANSMIT',
      section: 'TRANSMISSION',
      status,
      details: `${tipoDocumento} - Protocolo: ${protocolo || 'N/A'}`,
      errorMessage,
      userId
    });
  }

  /**
   * Log de validação
   */
  static logValidation(isValid: boolean, errorCount: number, userId?: string): AuditEntry {
    return this.logOperation({
      action: 'VALIDATE',
      section: 'VALIDATION',
      status: isValid ? 'SUCCESS' : 'FAILED',
      details: `Erros encontrados: ${errorCount}`,
      userId
    });
  }

  /**
   * Log de login
   */
  static logLogin(userId: string, success: boolean, errorMessage?: string): AuditEntry {
    return this.logOperation({
      action: 'LOGIN',
      status: success ? 'SUCCESS' : 'FAILED',
      userId,
      errorMessage
    });
  }

  /**
   * Log de logout
   */
  static logLogout(userId: string): AuditEntry {
    return this.logOperation({
      action: 'LOGOUT',
      status: 'SUCCESS',
      userId
    });
  }

  /**
   * Log de exportação
   */
  static logExport(format: string, userId?: string): AuditEntry {
    return this.logOperation({
      action: 'EXPORT',
      section: `EXPORT_${format.toUpperCase()}`,
      status: 'SUCCESS',
      userId
    });
  }

  /**
   * Log de importação
   */
  static logImport(format: string, success: boolean, errorMessage?: string, userId?: string): AuditEntry {
    return this.logOperation({
      action: 'IMPORT',
      section: `IMPORT_${format.toUpperCase()}`,
      status: success ? 'SUCCESS' : 'FAILED',
      errorMessage,
      userId
    });
  }

  /**
   * Obtém o log completo
   */
  static getLog(): AuditEntry[] {
    try {
      const log = localStorage.getItem(this.STORAGE_KEY);
      return log ? JSON.parse(log) : [];
    } catch {
      console.error('Erro ao ler log de auditoria');
      return [];
    }
  }

  /**
   * Obtém log filtrado por período
   */
  static getLogByPeriod(from: string, to: string): AuditEntry[] {
    const log = this.getLog();
    const fromDate = new Date(from).getTime();
    const toDate = new Date(to).getTime();

    return log.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= fromDate && entryTime <= toDate;
    });
  }

  /**
   * Obtém log filtrado por ação
   */
  static getLogByAction(action: AuditEntry['action']): AuditEntry[] {
    return this.getLog().filter(entry => entry.action === action);
  }

  /**
   * Obtém log filtrado por seção
   */
  static getLogBySection(section: string): AuditEntry[] {
    return this.getLog().filter(entry => entry.section === section);
  }

  /**
   * Obtém log filtrado por usuário
   */
  static getLogByUser(userId: string): AuditEntry[] {
    return this.getLog().filter(entry => entry.userId === userId);
  }

  /**
   * Limpa o log (apenas para manutenção, requer confirmação)
   */
  static clearLog(confirmToken?: string): boolean {
    if (confirmToken !== 'CONFIRM_CLEAR_AUDIT_LOG') {
      console.warn('Tentativa de limpar log sem confirmação');
      return false;
    }
    
    localStorage.removeItem(this.STORAGE_KEY);
    console.warn('[AUDIT] Log de auditoria foi limpo');
    return true;
  }

  /**
   * Gera ID único
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== CHANGE TRACKER ====================

export class ChangeTracker {
  /**
   * Compara dois objetos e gera lista de alterações
   */
  static trackChanges(oldData: PrestacaoContas, newData: PrestacaoContas, userId?: string): ChangeLog[] {
    const changes: ChangeLog[] = [];

    // Comparar cada seção
    const sections = [
      'descritor',
      'relacao_empregados',
      'relacao_bens',
      'contratos',
      'documentos_fiscais',
      'pagamentos',
      'disponibilidades',
      'receitas'
    ];

    sections.forEach(section => {
      const oldValue = (oldData as any)[section];
      const newValue = (newData as any)[section];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: section,
          section: this.getSectionNumber(section),
          timestamp: new Date().toISOString(),
          oldValue,
          newValue,
          userId
        });

        // Log individual da alteração
        AuditLogger.logUpdate(this.getSectionNumber(section), section, oldValue, newValue, userId);
      }
    });

    return changes;
  }

  /**
   * Identifica campos específicos que mudaram
   */
  static getSpecificChanges(oldData: PrestacaoContas, newData: PrestacaoContas): ChangeLog[] {
    const changes: ChangeLog[] = [];

    // Helper para percorrer objetos recursivamente
    const compareObjects = (obj1: any, obj2: any, path: string = '', section: string = ''): void => {
      for (const key in obj1) {
        if (obj1.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            compareObjects(obj1[key], obj2?.[key] || {}, newPath, section);
          } else if (obj1[key] !== obj2?.[key]) {
            changes.push({
              field: newPath,
              section,
              timestamp: new Date().toISOString(),
              oldValue: obj1[key],
              newValue: obj2?.[key]
            });
          }
        }
      }
    };

    compareObjects(oldData, newData, '', 'GLOBAL');
    return changes;
  }

  /**
   * Mapeia nome da seção para número
   */
  private static getSectionNumber(section: string): string {
    const map: Record<string, string> = {
      'descritor': '1',
      'relacao_empregados': '4-5',
      'relacao_bens': '5',
      'contratos': '6',
      'documentos_fiscais': '7',
      'pagamentos': '8',
      'disponibilidades': '9',
      'receitas': '10'
    };
    return map[section] || 'N/A';
  }
}

// ==================== INTEGRITY CHECKER ====================

export class IntegrityChecker {
  private static readonly INTEGRITY_KEY = 'audesp_integrity_check';

  /**
   * Gera hash SHA-256 dos dados
   * Nota: SHA-256 nativo via SubtleCrypto é assíncrono
   * Para simplificar, usar biblioteca ou implementação simples
   */
  static async computeDataHash(data: PrestacaoContas): Promise<string> {
    const jsonString = JSON.stringify(data);
    
    // Usar crypto nativo do browser se disponível
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: usar hash simples (djb2)
    return this.simpleHash(jsonString);
  }

  /**
   * Hash simples para fallback (não é criptográfico, apenas para detecção rápida de mudanças)
   */
  static simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  /**
   * Registra checksum de dados
   */
  static async registerIntegrityCheck(data: PrestacaoContas, userId?: string): Promise<IntegrityCheck> {
    const dataHash = await this.computeDataHash(data);
    const previousChecks = this.getIntegrityHistory();
    const previousHash = previousChecks.length > 0 ? previousChecks[0].dataHash : undefined;

    const check: IntegrityCheck = {
      dataHash,
      previousHash,
      timestamp: new Date().toISOString(),
      userId,
      isValid: true,
      hashAlgorithm: typeof window !== 'undefined' && window.crypto?.subtle ? 'SHA-256' : 'SIMPLE_HASH'
    };

    const history = [check, ...previousChecks].slice(0, 100); // Manter últimos 100
    localStorage.setItem(this.INTEGRITY_KEY, JSON.stringify(history));

    AuditLogger.logOperation({
      action: 'VALIDATE',
      status: 'SUCCESS',
      details: `Integrity check: ${dataHash}`,
      userId
    });

    return check;
  }

  /**
   * Verifica integridade dos dados
   */
  static async verifyIntegrity(data: PrestacaoContas): Promise<boolean> {
    const currentHash = await this.computeDataHash(data);
    const history = this.getIntegrityHistory();

    if (history.length === 0) {
      return true; // Primeira vez
    }

    const lastCheck = history[0];
    return currentHash === lastCheck.dataHash;
  }

  /**
   * Obtém histórico de integridade
   */
  static getIntegrityHistory(): IntegrityCheck[] {
    try {
      const history = localStorage.getItem(this.INTEGRITY_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * Detecta alterações não registradas
   */
  static async detectUnregisteredChanges(data: PrestacaoContas): Promise<boolean> {
    const currentHash = await this.computeDataHash(data);
    const history = this.getIntegrityHistory();

    if (history.length === 0) {
      return false; // Sem histórico
    }

    const lastCheck = history[0];
    return currentHash !== lastCheck.dataHash;
  }
}

// ==================== AUDIT REPORT GENERATOR ====================

export class AuditReportGenerator {
  /**
   * Gera relatório de auditoria completo
   */
  static generateReport(from?: string, to?: string): AuditReport {
    const now = new Date().toISOString();
    const fromDate = from || new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Últimos 30 dias
    const toDate = to || now;

    const log = AuditLogger.getLogByPeriod(fromDate, toDate);

    const operationsByType: Record<string, number> = {};
    const changedSections: Record<string, number> = {};
    const changedFields: ChangeLog[] = [];

    let createsCount = 0;
    let updatesCount = 0;
    let deletesCount = 0;
    let transmitsCount = 0;
    let failuresCount = 0;

    log.forEach(entry => {
      // Contar por tipo
      operationsByType[entry.action] = (operationsByType[entry.action] || 0) + 1;

      // Contar falhas
      if (entry.status === 'FAILED') {
        failuresCount++;
      }

      // Contar específicos
      switch (entry.action) {
        case 'CREATE':
          createsCount++;
          break;
        case 'UPDATE':
          updatesCount++;
          break;
        case 'DELETE':
          deletesCount++;
          break;
        case 'TRANSMIT':
          transmitsCount++;
          break;
      }

      // Contar por seção
      if (entry.section) {
        changedSections[entry.section] = (changedSections[entry.section] || 0) + 1;
      }

      // Adicionar a campos alterados se relevante
      if (entry.action === 'UPDATE' && entry.field) {
        changedFields.push({
          field: entry.field,
          section: entry.section || 'N/A',
          timestamp: entry.timestamp,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          userId: entry.userId
        });
      }
    });

    return {
      generatedAt: now,
      period: { from: fromDate, to: toDate },
      totalOperations: log.length,
      operationsByType,
      changedSections,
      changedFields: changedFields.slice(0, 1000), // Limitar para não sobrecarregar
      summary: {
        createsCount,
        updatesCount,
        deletesCount,
        transmitsCount,
        failuresCount
      }
    };
  }

  /**
   * Exporta relatório em JSON
   */
  static exportReportJSON(from?: string, to?: string): string {
    const report = this.generateReport(from, to);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Exporta relatório em CSV (simplificado)
   */
  static exportReportCSV(from?: string, to?: string): string {
    const report = this.generateReport(from, to);
    const log = AuditLogger.getLogByPeriod(report.period.from, report.period.to);

    let csv = 'Timestamp,Ação,Seção,Campo,Status,Usuário,Detalhes\n';

    log.forEach(entry => {
      const row = [
        entry.timestamp,
        entry.action,
        entry.section || '-',
        entry.field || '-',
        entry.status,
        entry.userId || '-',
        (entry.details || '').replace(/,/g, ';') // Escapar vírgulas
      ].map(v => `"${v}"`).join(',');

      csv += row + '\n';
    });

    return csv;
  }
}

// Exportar principais classes
const auditExports = {
  AuditLogger,
  ChangeTracker,
  IntegrityChecker,
  AuditReportGenerator
};

export default auditExports;
