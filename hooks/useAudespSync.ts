/**
 * Hook React para sincronização AUDESP
 * Facilita integração com componentes React
 */

import { useEffect, useReducer, useCallback } from 'react';
import { PrestacaoContasAudesp } from '../services/audespSchemaTypes';
import { AudespSyncService, SyncState } from '../services/audespSyncService';
import { ValidationResult } from '../services/audespValidator';
import { JsonImportResult } from '../services/audespJsonService';

export interface UseAudespSyncState {
  formData: Partial<PrestacaoContasAudesp>;
  isDirty: boolean;
  isValidating: boolean;
  validation: ValidationResult | null;
  syncedAt: Date | null;
  hasChanges: boolean;
  changeCount: number;
  error: string | null;
}

type Action =
  | { type: 'SYNC_STATE'; payload: SyncState }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

function reducer(state: UseAudespSyncState, action: Action): UseAudespSyncState {
  switch (action.type) {
    case 'SYNC_STATE':
      return {
        ...state,
        formData: action.payload.formData,
        isDirty: action.payload.isDirty,
        syncedAt: action.payload.syncedAt,
        validation: action.payload.lastValidation,
        hasChanges: action.payload.changes.length > 0,
        changeCount: action.payload.changes.length,
        error: null
      };
    case 'SET_VALIDATING':
      return { ...state, isValidating: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return {
        formData: {},
        isDirty: false,
        isValidating: false,
        validation: null,
        syncedAt: null,
        hasChanges: false,
        changeCount: 0,
        error: null
      };
    default:
      return state;
  }
}

/**
 * Hook principal para sincronização AUDESP
 */
export function useAudespSync(autoValidate = true): UseAudespSyncState & {
  updateField: (path: string, value: any) => void;
  addItem: (arrayPath: string, item: any) => void;
  removeItem: (arrayPath: string, index: number) => void;
  exportJson: (pretty?: boolean) => string;
  importJson: (jsonString: string) => JsonImportResult;
  validate: () => ValidationResult;
  reset: () => void;
  undo: () => boolean;
  getField: (path: string) => any;
} {
  const initialState: UseAudespSyncState = {
    formData: {},
    isDirty: false,
    isValidating: false,
    validation: null,
    syncedAt: null,
    hasChanges: false,
    changeCount: 0,
    error: null
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Inicializar serviço
  useEffect(() => {
    AudespSyncService.initialize({ autoValidate });

    // Subscrever a mudanças
    const unsubscribe = AudespSyncService.subscribe((syncState) => {
      dispatch({ type: 'SYNC_STATE', payload: syncState });
    });

    // Sincronizar estado inicial
    dispatch({ type: 'SYNC_STATE', payload: AudespSyncService.getState() as SyncState });

    return () => {
      unsubscribe();
    };
  }, [autoValidate]);

  // Callbacks
  const updateField = useCallback((path: string, value: any) => {
    try {
      AudespSyncService.updateField(path, value);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const addItem = useCallback((arrayPath: string, item: any) => {
    try {
      AudespSyncService.addItem(arrayPath, item);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const removeItem = useCallback((arrayPath: string, index: number) => {
    try {
      AudespSyncService.removeItem(arrayPath, index);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const exportJson = useCallback((pretty = true): string => {
    try {
      return AudespSyncService.exportToJson(pretty);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return '';
    }
  }, []);

  const importJson = useCallback((jsonString: string): JsonImportResult => {
    try {
      return AudespSyncService.loadFromJson(jsonString);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, errors: [error.message], warnings: [] };
    }
  }, []);

  const validate = useCallback((): ValidationResult => {
    try {
      dispatch({ type: 'SET_VALIDATING', payload: true });
      const result = AudespSyncService.validate();
      dispatch({ type: 'SET_VALIDATING', payload: false });
      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_VALIDATING', payload: false });
      return { valid: false, errors: [], warnings: [], summary: { totalErrors: 0, totalWarnings: 0, sections: {} } };
    }
  }, []);

  const reset = useCallback(() => {
    try {
      AudespSyncService.reset();
      dispatch({ type: 'RESET' });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const undo = useCallback((): boolean => {
    try {
      return AudespSyncService.undo();
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return false;
    }
  }, []);

  const getField = useCallback((path: string): any => {
    try {
      return AudespSyncService.getField(path);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return undefined;
    }
  }, []);

  return {
    ...state,
    updateField,
    addItem,
    removeItem,
    exportJson,
    importJson,
    validate,
    reset,
    undo,
    getField
  };
}

/**
 * Hook para trabalhar com um campo específico
 */
export function useAudespField(path: string, initialValue?: any) {
  const sync = useAudespSync();
  
  const value = sync.getField(path) ?? initialValue;
  const setValue = useCallback(
    (newValue: any) => {
      sync.updateField(path, newValue);
    },
    [path, sync]
  );

  return [value, setValue] as const;
}

/**
 * Hook para validação em tempo real
 */
export function useAudespValidation() {
  const sync = useAudespSync(true);
  
  return {
    isValid: sync.validation?.valid ?? true,
    errors: sync.validation?.errors ?? [],
    warnings: sync.validation?.warnings ?? [],
    sections: sync.validation?.summary.sections ?? {},
    validate: sync.validate
  };
}

/**
 * Hook para importação/exportação JSON
 */
export function useAudespJson() {
  const sync = useAudespSync();

  const downloadJson = useCallback(() => {
    const json = sync.exportJson(true);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audesp-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sync]);

  const uploadJson = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = sync.importJson(content);
        resolve(result.success);
      };
      reader.readAsText(file);
    });
  }, [sync]);

  return {
    exportJson: sync.exportJson,
    importJson: sync.importJson,
    downloadJson,
    uploadJson,
    isDirty: sync.isDirty
  };
}
