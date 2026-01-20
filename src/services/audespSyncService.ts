import type { PrestacaoConta } from './audespSchemaTypes';
import { audespJsonService } from './audespJsonService';

class AudespSyncService {
  private syncQueue: Map<string, Partial<PrestacaoConta>> = new Map();
  private readonly STORAGE_KEY = 'audesp_sync_data';
  private readonly SYNC_INTERVAL = 5000; // 5 segundos
  private syncTimer?: NodeJS.Timeout;

  /**
   * Iniciar sincronização automática
   */
  startAutoSync(callback?: (data: Partial<PrestacaoConta>) => void): void {
    if (this.syncTimer) return; // Já está sincronizando

    this.syncTimer = setInterval(() => {
      this.syncAll(callback);
    }, this.SYNC_INTERVAL);
  }

  /**
   * Parar sincronização automática
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * Adicionar dados à fila de sincronização
   */
  enqueueSync(id: string, data: Partial<PrestacaoConta>): void {
    this.syncQueue.set(id, data);
    this.persistToLocalStorage();
  }

  /**
   * Sincronizar todos os dados na fila
   */
  private syncAll(callback?: (data: Partial<PrestacaoConta>) => void): void {
    for (const [id, data] of this.syncQueue) {
      const synced = audespJsonService.syncWithTemplate(data);
      const withDerived = audespJsonService.calculateDerivedValues(synced);

      this.syncQueue.set(id, withDerived);

      if (callback) {
        callback(withDerived);
      }
    }

    this.persistToLocalStorage();
  }

  /**
   * Sincronizar dados específicos
   */
  syncData(data: Partial<PrestacaoConta>): Partial<PrestacaoConta> {
    const synced = audespJsonService.syncWithTemplate(data);
    return audespJsonService.calculateDerivedValues(synced);
  }

  /**
   * Obter dados sincronizados
   */
  getSyncedData(id: string): Partial<PrestacaoConta> | undefined {
    return this.syncQueue.get(id);
  }

  /**
   * Obter todos os dados sincronizados
   */
  getAllSyncedData(): Map<string, Partial<PrestacaoConta>> {
    return new Map(this.syncQueue);
  }

  /**
   * Remover dados da sincronização
   */
  removeSyncedData(id: string): void {
    this.syncQueue.delete(id);
    this.persistToLocalStorage();
  }

  /**
   * Limpar toda a sincronização
   */
  clearAll(): void {
    this.syncQueue.clear();
    this.persistToLocalStorage();
  }

  /**
   * Persistir dados no localStorage
   */
  private persistToLocalStorage(): void {
    try {
      const data = Object.fromEntries(this.syncQueue);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao persistir sincronização:', error);
    }
  }

  /**
   * Restaurar dados do localStorage
   */
  restoreFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.syncQueue = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Erro ao restaurar sincronização:', error);
    }
  }

  /**
   * Obter status da sincronização
   */
  getStatus(): {
    isActive: boolean;
    queueSize: number;
    items: string[];
  } {
    return {
      isActive: !!this.syncTimer,
      queueSize: this.syncQueue.size,
      items: Array.from(this.syncQueue.keys()),
    };
  }

  /**
   * Sincronizar dois objetos (merge)
   */
  mergeData(
    source: Partial<PrestacaoConta>,
    target: Partial<PrestacaoConta>
  ): Partial<PrestacaoConta> {
    const merged = {
      ...source,
      ...target,
      entidade: { ...source.entidade, ...target.entidade },
      responsavel: { ...source.responsavel, ...target.responsavel },
      endereco: { ...source.endereco, ...target.endereco },
      financeiro: { ...source.financeiro, ...target.financeiro },
      patrimonio: { ...source.patrimonio, ...target.patrimonio },
      conformidade: { ...source.conformidade, ...target.conformidade },
    };

    return audespJsonService.calculateDerivedValues(merged);
  }

  /**
   * Detectar mudanças entre dois datasets
   */
  detectChanges(
    original: Partial<PrestacaoConta>,
    modified: Partial<PrestacaoConta>
  ): {
    changed: boolean;
    changedFields: string[];
  } {
    const changedFields: string[] = [];

    // Comparar campos simples
    if (original.exercicio !== modified.exercicio) changedFields.push('exercicio');
    if (original.dataPrestacao !== modified.dataPrestacao) changedFields.push('dataPrestacao');

    // Comparar objetos aninhados
    if (JSON.stringify(original.entidade) !== JSON.stringify(modified.entidade)) {
      changedFields.push('entidade');
    }
    if (JSON.stringify(original.responsavel) !== JSON.stringify(modified.responsavel)) {
      changedFields.push('responsavel');
    }
    if (JSON.stringify(original.financeiro) !== JSON.stringify(modified.financeiro)) {
      changedFields.push('financeiro');
    }

    // Comparar arrays
    if (JSON.stringify(original.projetos) !== JSON.stringify(modified.projetos)) {
      changedFields.push('projetos');
    }

    return {
      changed: changedFields.length > 0,
      changedFields,
    };
  }

  /**
   * Sincronização com validação
   */
  syncWithValidation(
    data: Partial<PrestacaoConta>,
    validator?: (data: any) => boolean
  ): { success: boolean; data: Partial<PrestacaoConta>; error?: string } {
    try {
      const synced = this.syncData(data);

      if (validator && !validator(synced)) {
        return {
          success: false,
          data: synced,
          error: 'Dados não passaram na validação',
        };
      }

      return {
        success: true,
        data: synced,
      };
    } catch (error: any) {
      return {
        success: false,
        data,
        error: error.message,
      };
    }
  }
}

export const audespSyncService = new AudespSyncService();
