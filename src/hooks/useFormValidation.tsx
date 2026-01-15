import { useEffect, useState } from 'react';
import { PrestacaoContas } from '../types';
import { validateSection, validatePrestacaoContas } from '../services/validationService';

export interface FieldValidationStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  touched: boolean;
}

export interface FormValidationState {
  [fieldPath: string]: FieldValidationStatus;
}

/**
 * Hook para validação em tempo real do formulário
 * Mostra feedback visual para cada campo preenchido
 */
export const useFormValidation = (data: PrestacaoContas, enabled: boolean = true) => {
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Valida o formulário completo
  useEffect(() => {
    if (!enabled) return;

    const allErrors = validatePrestacaoContas(data);
    setFormErrors(allErrors);
    setIsFormValid(allErrors.length === 0);
  }, [data, enabled]);

  /**
   * Valida um campo específico e retorna seu status
   */
  const validateField = (fieldPath: string, value: any): FieldValidationStatus => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações por tipo de campo
    if (fieldPath.includes('cpf')) {
      const cleaned = String(value).replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length !== 11) {
        errors.push('CPF deve ter exatamente 11 dígitos');
      }
    }

    if (fieldPath.includes('cnpj')) {
      const cleaned = String(value).replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length !== 14) {
        errors.push('CNPJ deve ter exatamente 14 dígitos');
      }
    }

    if (fieldPath.includes('data') || fieldPath.includes('data_')) {
      if (value && !isValidDate(value)) {
        errors.push('Data inválida. Use formato YYYY-MM-DD');
      }
    }

    if (fieldPath.includes('valor') || fieldPath.includes('saldo') || fieldPath.includes('montante')) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push('Deve ser um número válido');
      } else if (num < 0 && !fieldPath.includes('saldo')) {
        warnings.push('Valor negativo - verifique se está correto');
      }
    }

    if (fieldPath.includes('mes')) {
      const mes = parseInt(value);
      if (mes !== 12) {
        errors.push('Apenas dezembro (mês 12) é aceito para prestação de contas');
      }
    }

    if (fieldPath.includes('municipio')) {
      const code = parseInt(value);
      if (code < 1 || code > 9999) {
        errors.push('Código de município deve estar entre 1 e 9999');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      touched: true
    };
  };

  /**
   * Marca um campo como tocado para mostrar feedback
   */
  const touchField = (fieldPath: string, value: any) => {
    const status = validateField(fieldPath, value);
    setValidationState(prev => ({
      ...prev,
      [fieldPath]: status
    }));
  };

  /**
   * Obtém o status de um campo específico
   */
  const getFieldStatus = (fieldPath: string): FieldValidationStatus => {
    return validationState[fieldPath] || {
      isValid: true,
      errors: [],
      warnings: [],
      touched: false
    };
  };

  return {
    validationState,
    formErrors,
    isFormValid,
    validateField,
    touchField,
    getFieldStatus
  };
};

/**
 * Valida se a data está no formato correto (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Componente para mostrar feedback de validação de um campo
 */
export const FieldFeedback: React.FC<{
  status: FieldValidationStatus;
  label: string;
  manualRef?: string;
}> = ({ status, label, manualRef }) => {
  if (!status.touched) return null;

  return (
    <div className="mt-1">
      {status.isValid && status.touched && (
        <div className="flex items-center text-green-600 text-sm">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          ✓ {label} válido
        </div>
      )}

      {status.errors.length > 0 && (
        <div className="mt-1">
          {status.errors.map((error, idx) => (
            <div key={idx} className="flex items-start text-red-600 text-sm">
              <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          ))}
        </div>
      )}

      {status.warnings.length > 0 && (
        <div className="mt-1">
          {status.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start text-yellow-600 text-sm">
              <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {manualRef && (
        <div className="mt-1 text-xs text-blue-600">
          📖 {manualRef}
        </div>
      )}
    </div>
  );
};
