/**
 * Serviço de Sincronização - Bi-directional Form ↔ JSON
 * Mantém o formulário sincronizado com os dados JSON
 */

import { PrestacaoContasAudesp } from './audespSchemaTypes';
import { AudespValidator, ValidationResult } from './audespValidator';
import { AudespJsonService, JsonImportResult } from './audespJsonService';

export interface SyncState {
  formData: Partial<PrestacaoContasAudesp>;
  isDirty: boolean;
  lastValidation: ValidationResult | null;
  syncedAt: Date | null;
  changes: Array<{
    timestamp: Date;
    path: string;
    from: any;
    to: any;
    syncedToJson: boolean;
  }>;
}

export interface SyncOptions {
  autoValidate?: boolean;
  autoExport?: boolean;
  trackChanges?: boolean;
}

/**
 * Gerencia sincronização bidirecional entre formulário e JSON
 * Garante consistência e rastreabilidade
 */
export class AudespSyncService {
  private static state: SyncState = {
    formData: AudespJsonService.generateEmptyTemplate(),
    isDirty: false,
    lastValidation: null,
    syncedAt: null,
    changes: []
  };

  private static options: SyncOptions = {
    autoValidate: true,
    autoExport: false,
    trackChanges: true
  };

  private static listeners: Set<(state: SyncState) => void> = new Set();

  /**
   * Inicializa o serviço de sincronização
   */
  static initialize(options?: SyncOptions) {
    this.options = { ...this.options, ...options };
    this.state.formData = AudespJsonService.generateEmptyTemplate();
    this.notifyListeners();
  }

  /**
   * Carrega dados do JSON para o formulário
   */
  static loadFromJson(jsonString: string): JsonImportResult {
    const result = AudespJsonService.importJson(jsonString);

    if (result.success && result.data) {
      // Validar campos desconhecidos
      const unknownFields = AudespJsonService.hasUnknownFields(JSON.parse(jsonString));
      if (unknownFields.length > 0) {
        result.warnings.push(`Campos ignorados (não permitidos): ${unknownFields.join(', ')}`);
      }

      this.state.formData = result.data;
      this.state.isDirty = true;
      this.state.syncedAt = null;

      // Auto-validate se configurado
      if (this.options.autoValidate) {
        this.state.lastValidation = AudespValidator.validate(this.state.formData);
      }

      this.notifyListeners();
    }

    return result;
  }

  /**
   * Exporta dados do formulário como JSON
   */
  static exportToJson(prettyPrint = true): string {
    const json = AudespJsonService.exportJson(this.state.formData, {
      includeEmptyFields: false,
      prettyPrint,
      includeMeta: true
    });

    this.state.isDirty = false;
    this.state.syncedAt = new Date();

    this.notifyListeners();
    return json;
  }

  /**
   * Atualiza um campo do formulário
   */
  static updateField(path: string, value: any): void {
    const oldValue = this.getField(path);

    if (JSON.stringify(oldValue) === JSON.stringify(value)) {
      return; // Sem mudanças
    }

    // Atualizar valor
    this.setField(path, value);
    this.state.isDirty = true;

    // Rastrear mudança
    if (this.options.trackChanges) {
      this.state.changes.push({
        timestamp: new Date(),
        path,
        from: oldValue,
        to: value,
        syncedToJson: false
      });

      // Limitar histórico a últimas 100 mudanças
      if (this.state.changes.length > 100) {
        this.state.changes = this.state.changes.slice(-100);
      }
    }

    // Auto-validate
    if (this.options.autoValidate) {
      this.state.lastValidation = AudespValidator.validate(this.state.formData);
    }

    this.notifyListeners();
  }

  /**
   * Adiciona item a um array (ex: novo empregado)
   */
  static addItem(arrayPath: string, item: any): void {
    const array = this.getField(arrayPath) || [];

    if (!Array.isArray(array)) {
      console.error(`Campo ${arrayPath} não é um array`);
      return;
    }

    const newArray = [...array, item];
    this.updateField(arrayPath, newArray);
  }

  /**
   * Remove item de um array
   */
  static removeItem(arrayPath: string, index: number): void {
    const array = this.getField(arrayPath);

    if (!Array.isArray(array)) {
      console.error(`Campo ${arrayPath} não é um array`);
      return;
    }

    const newArray = array.filter((_, i) => i !== index);
    this.updateField(arrayPath, newArray);
  }

  /**
   * Obtém valor de um campo (suporta path aninhado)
   */
  static getField(path: string): any {
    const parts = path.split('.');
    let value = this.state.formData;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;

      // Suporta índices de array (ex: empregados[0].cpf)
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        value = value[arrayName]?.[parseInt(index, 10)];
      } else {
        value = value[part];
      }
    }

    return value;
  }

  /**
   * Define valor de um campo (suporta path aninhado)
   */
  private static setField(path: string, value: any): void {
    const parts = path.split('.');
    let current = this.state.formData as any;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // Suporta índices de array
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        if (!current[arrayName][parseInt(index, 10)]) {
          current[arrayName][parseInt(index, 10)] = {};
        }
        current = current[arrayName][parseInt(index, 10)];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }

    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (!current[arrayName]) current[arrayName] = [];
      current[arrayName][parseInt(index, 10)] = value;
    } else {
      current[lastPart] = value;
    }
  }

  /**
   * Obtém o estado atual
   */
  static getState(): Readonly<SyncState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Retorna os dados do formulário
   */
  static getFormData(): Readonly<Partial<PrestacaoContasAudesp>> {
    return Object.freeze({ ...this.state.formData });
  }

  /**
   * Retorna a última validação
   */
  static getValidation(): ValidationResult | null {
    return this.state.lastValidation;
  }

  /**
   * Valida o formulário manualmente
   */
  static validate(): ValidationResult {
    this.state.lastValidation = AudespValidator.validate(this.state.formData);
    this.notifyListeners();
    return this.state.lastValidation;
  }

  /**
   * Marca mudanças como sincronizadas
   */
  static markSynced(): void {
    this.state.changes.forEach(change => {
      change.syncedToJson = true;
    });
    this.notifyListeners();
  }

  /**
   * Retorna o histórico de mudanças
   */
  static getChanges(sincedOnly = false): typeof this.state.changes {
    return this.state.changes.filter(c => !sincedOnly || c.syncedToJson);
  }

  /**
   * Limpa o histórico de mudanças
   */
  static clearChanges(): void {
    this.state.changes = [];
    this.notifyListeners();
  }

  /**
   * Registra listener para mudanças de estado
   */
  static subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.getState() as SyncState);
    });
  }

  /**
   * Reset ao estado inicial
   */
  static reset(): void {
    this.state = {
      formData: AudespJsonService.generateEmptyTemplate(),
      isDirty: false,
      lastValidation: null,
      syncedAt: null,
      changes: []
    };
    this.notifyListeners();
  }

  /**
   * Desfaz a última mudança (Ctrl+Z)
   */
  static undo(): boolean {
    if (this.state.changes.length === 0) return false;

    const lastChange = this.state.changes.pop()!;
    this.setField(lastChange.path, lastChange.from);
    this.state.isDirty = true;

    if (this.options.autoValidate) {
      this.state.lastValidation = AudespValidator.validate(this.state.formData);
    }

    this.notifyListeners();
    return true;
  }

  /**
   * Exporta auditlog (mudanças)
   */
  static exportAuditLog(): string {
    const log = {
      exportedAt: new Date().toISOString(),
      totalChanges: this.state.changes.length,
      changes: this.state.changes.map(c => ({
        timestamp: c.timestamp.toISOString(),
        path: c.path,
        from: c.from,
        to: c.to,
        syncedToJson: c.syncedToJson
      }))
    };
    return JSON.stringify(log, null, 2);
  }
}
