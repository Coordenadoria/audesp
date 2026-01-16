/**
 * MÓDULO APRIMORADO DE IMPORTAÇÃO/EXPORTAÇÃO
 * Sistema robusto de import/export com validação, versionamento e backup
 */

import { PrestacaoContas, INITIAL_DATA } from '../types';
import { ComprehensiveValidator } from './advancedValidationService';
import { AuditLogger } from './auditService';

// ==================== TIPOS ====================

export interface FileMetadata {
  version: string;
  createdAt: string;
  lastModified: string;
  format: 'json' | 'csv' | 'xlsx';
  description?: string;
  checksum?: string;
}

export interface ExportData {
  metadata: FileMetadata;
  data: PrestacaoContas;
}

export interface ImportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    sections: Record<string, boolean>;
    totalFields: number;
    validFields: number;
  };
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  version: string;
  checksum: string;
  size: number; // em bytes
}

// ==================== EXPORT SERVICE ====================

export class ExportService {
  private static readonly EXPORT_VERSION = '2.0.0';

  /**
   * Exporta dados com metadados
   */
  static exportWithMetadata(data: PrestacaoContas, description?: string): ExportData {
    return {
      metadata: {
        version: this.EXPORT_VERSION,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        format: 'json',
        description,
        checksum: this.calculateChecksum(data)
      },
      data
    };
  }

  /**
   * Exporta como JSON formatado
   */
  static exportAsJSON(data: PrestacaoContas, description?: string): string {
    const exportData = this.exportWithMetadata(data, description);
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporta como CSV (simplificado - flatten para primeiro nível)
   */
  static exportAsCSV(data: PrestacaoContas): string {
    let csv = 'Seção,Tipo Documento,Entidade,Municipio,Ano,Mês,Descrição\n';
    
    const row = [
      '1',
      data.descritor.tipo_documento,
      data.descritor.entidade,
      data.descritor.municipio,
      data.descritor.ano,
      data.descritor.mes,
      'Descritor'
    ];

    csv += row.map(v => `"${v}"`).join(',') + '\n';

    // Empregados
    if (data.relacao_empregados?.length) {
      csv += '\nSeção,CPF,Data Admissão,Cargo,Salário\n';
      data.relacao_empregados.forEach(emp => {
        const row = [
          '4',
          emp.cpf,
          emp.data_admissao,
          emp.cbo,
          emp.salario_contratual
        ];
        csv += row.map(v => `"${v}"`).join(',') + '\n';
      });
    }

    // Contratos
    if (data.contratos?.length) {
      csv += '\nSeção,Número,Credor,Vigência Inicial,Vigência Final,Valor\n';
      data.contratos.forEach(ctr => {
        const row = [
          '6',
          ctr.numero,
          ctr.credor.documento_numero,
          ctr.vigencia_data_inicial,
          ctr.vigencia_data_final || '-',
          ctr.valor_montante
        ];
        csv += row.map(v => `"${v}"`).join(',') + '\n';
      });
    }

    return csv;
  }

  /**
   * Download de arquivo
   */
  static download(content: string, filename: string, mimeType: string = 'application/json'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Calcula checksum simples para dados
   */
  private static calculateChecksum(data: PrestacaoContas): string {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// ==================== IMPORT SERVICE ====================

export class ImportService {
  /**
   * Importa e valida arquivo JSON
   */
  static async importJSON(file: File, userId?: string): Promise<{
    data: PrestacaoContas;
    validation: ImportValidation;
  }> {
    try {
      const content = await this.readFile(file);
      const json = JSON.parse(content);

      // Se contém metadados, extrair dados
      let data = json.data || json;

      // Validar se é estrutura válida
      const validation = this.validateImportedData(data);

      if (!validation.isValid) {
        AuditLogger.logImport('JSON', false, validation.errors.join('; '), userId);
        throw new Error(`Arquivo inválido: ${validation.errors[0]}`);
      }

      AuditLogger.logImport('JSON', true, undefined, userId);
      return { data, validation };
    } catch (error: any) {
      AuditLogger.logImport('JSON', false, error.message, userId);
      throw new Error(`Erro ao importar JSON: ${error.message}`);
    }
  }

  /**
   * Importa arquivo CSV simples
   */
  static async importCSV(file: File, userId?: string): Promise<{
    data: Partial<PrestacaoContas>;
    validation: ImportValidation;
  }> {
    try {
      const content = await this.readFile(file);
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);

      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou malformado');
      }

      // Implementação simplificada
      const data: Partial<PrestacaoContas> = { ...INITIAL_DATA };
      const validation = this.validateImportedData(data as PrestacaoContas);

      AuditLogger.logImport('CSV', validation.isValid, undefined, userId);
      return { data, validation };
    } catch (error: any) {
      AuditLogger.logImport('CSV', false, error.message, userId);
      throw new Error(`Erro ao importar CSV: ${error.message}`);
    }
  }

  /**
   * Valida dados importados
   */
  static validateImportedData(data: any): ImportValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sections: Record<string, boolean> = {};
    let totalFields = 0;
    let validFields = 0;

    // Validar estrutura básica
    if (!data || typeof data !== 'object') {
      errors.push('Dados não são um objeto válido');
      return {
        isValid: false,
        errors,
        warnings,
        summary: { sections, totalFields, validFields }
      };
    }

    // Validar seções obrigatórias
    if (!data.descritor) {
      errors.push('Seção "descritor" obrigatória');
    } else {
      sections['descritor'] = true;
    }

    // Validar com ComprehensiveValidator
    try {
      const validationResult = ComprehensiveValidator.validate(data);
      if (!validationResult.isValid) {
        errors.push(
          ...validationResult.errors.slice(0, 5).map(e => e.message)
        );
      }
      warnings.push(
        ...validationResult.warnings.slice(0, 5).map(w => w.message)
      );
      validFields = Math.max(0, 100 - validationResult.errors.length * 10);
      totalFields = 100;
    } catch (error) {
      errors.push('Erro ao validar dados');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        sections,
        totalFields,
        validFields
      }
    };
  }

  /**
   * Lê arquivo como texto
   */
  private static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Erro ao ler arquivo'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
}

// ==================== BACKUP SERVICE ====================

export class BackupService {
  private static readonly BACKUP_STORAGE_KEY = 'audesp_backups';
  private static readonly MAX_BACKUPS = 10;

  /**
   * Cria backup automático
   */
  static createBackup(data: PrestacaoContas, userId?: string): BackupInfo {
    const backup: BackupInfo = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      checksum: this.calculateChecksum(data),
      size: JSON.stringify(data).length
    };

    const backups = this.getBackups();
    const updatedBackups = [backup, ...backups].slice(0, this.MAX_BACKUPS);

    localStorage.setItem(this.BACKUP_STORAGE_KEY, JSON.stringify(updatedBackups));

    // Armazenar dados do backup separadamente
    localStorage.setItem(`backup_${backup.id}`, JSON.stringify(data));

    AuditLogger.logOperation({
      action: 'CREATE',
      section: 'BACKUP',
      status: 'SUCCESS',
      details: `Backup criado: ${backup.id}`,
      userId
    });

    return backup;
  }

  /**
   * Restaura backup
   */
  static restoreBackup(backupId: string, userId?: string): PrestacaoContas | null {
    try {
      const data = localStorage.getItem(`backup_${backupId}`);
      if (!data) {
        AuditLogger.logOperation({
          action: 'UPDATE',
          section: 'BACKUP',
          status: 'FAILED',
          details: `Backup não encontrado: ${backupId}`,
          userId,
          errorMessage: 'Backup not found'
        });
        return null;
      }

      const parsed = JSON.parse(data);

      AuditLogger.logOperation({
        action: 'UPDATE',
        section: 'BACKUP',
        status: 'SUCCESS',
        details: `Backup restaurado: ${backupId}`,
        userId
      });

      return parsed;
    } catch (error: any) {
      AuditLogger.logOperation({
        action: 'UPDATE',
        section: 'BACKUP',
        status: 'FAILED',
        details: `Erro ao restaurar backup: ${backupId}`,
        userId,
        errorMessage: error.message
      });
      return null;
    }
  }

  /**
   * Obtém lista de backups
   */
  static getBackups(): BackupInfo[] {
    try {
      const backups = localStorage.getItem(this.BACKUP_STORAGE_KEY);
      return backups ? JSON.parse(backups) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove backup
   */
  static removeBackup(backupId: string, userId?: string): boolean {
    const backups = this.getBackups();
    const updated = backups.filter(b => b.id !== backupId);

    if (backups.length === updated.length) {
      AuditLogger.logOperation({
        action: 'DELETE',
        section: 'BACKUP',
        status: 'FAILED',
        details: `Backup não encontrado: ${backupId}`,
        userId
      });
      return false;
    }

    localStorage.setItem(this.BACKUP_STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(`backup_${backupId}`);

    AuditLogger.logOperation({
      action: 'DELETE',
      section: 'BACKUP',
      status: 'SUCCESS',
      details: `Backup removido: ${backupId}`,
      userId
    });

    return true;
  }

  /**
   * Calcula checksum
   */
  private static calculateChecksum(data: PrestacaoContas): string {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Gera ID único
   */
  private static generateId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Exportar classes principais
const fileExports = {
  ExportService,
  ImportService,
  BackupService
};

export default fileExports;
