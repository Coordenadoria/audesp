import { useState, useCallback, useRef } from 'react';
import { AUDESPValidator, ValidationError, ValidationResult } from '../services/AUDESPValidator';

export interface FieldValidationState {
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

export const useFieldValidation = (initialValue: any = '') => {
  const [value, setValue] = useState(initialValue);
  const [validationState, setValidationState] = useState<FieldValidationState>({
    errors: [],
    isValid: true,
    isDirty: false,
    isTouched: false,
  });
  const validatorRef = useRef(new AUDESPValidator());
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Validar com debounce
  const validateField = useCallback(
    (fieldPath: string, fieldValue: any, fullFormData?: any) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const errors = validatorRef.current.validateField(
          fieldPath,
          fieldValue,
          fullFormData || {}
        );

        setValidationState((prev) => ({
          ...prev,
          errors,
          isValid: errors.length === 0,
        }));
      }, 300); // Debounce de 300ms
    },
    []
  );

  const handleChange = useCallback(
    (newValue: any, fieldPath?: string, fullFormData?: any) => {
      setValue(newValue);
      setValidationState((prev) => ({
        ...prev,
        isDirty: true,
      }));

      if (fieldPath) {
        validateField(fieldPath, newValue, fullFormData);
      }
    },
    [validateField]
  );

  const handleBlur = useCallback(() => {
    setValidationState((prev) => ({
      ...prev,
      isTouched: true,
    }));
  }, []);

  const handleFocus = useCallback(() => {
    setValidationState((prev) => ({
      ...prev,
      isTouched: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setValidationState({
      errors: [],
      isValid: true,
      isDirty: false,
      isTouched: false,
    });
  }, [initialValue]);

  return {
    value,
    setValue,
    handleChange,
    handleBlur,
    handleFocus,
    reset,
    ...validationState,
  };
};

/**
 * Hook para validação de formulário completo
 */
export const useFormValidation = (initialData: any = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalErrors: 0,
      totalWarnings: 0,
      completionPercentage: 0,
      requiredFieldsMissing: [],
    },
  });
  const validatorRef = useRef(new AUDESPValidator());
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Validar formulário com debounce
  const validateForm = useCallback((data: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const result = validatorRef.current.validate(data);
      setValidationResult(result);
    }, 500); // Debounce de 500ms
  }, []);

  const updateFormData = useCallback(
    (path: string, value: any) => {
      setFormData((prev: any) => {
        const newData = JSON.parse(JSON.stringify(prev)); // Deep copy
        const keys = path.split('.');
        let current = newData;

        // Navegar até o pai do campo
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key]) {
            current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
          }
          current = current[key];
        }

        // Atualizar o valor
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    },
    []
  );

  const handleFieldChange = useCallback(
    (path: string, value: any) => {
      updateFormData(path, value);
      validateForm(formData);
    },
    [formData, updateFormData, validateForm]
  );

  const addArrayItem = useCallback(
    (path: string, item: any = {}) => {
      setFormData((prev: any) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current = newData;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (!current[key]) {
            current[key] = [];
          }
          if (i === keys.length - 1) {
            if (!Array.isArray(current[key])) {
              current[key] = [];
            }
            current[key].push(item);
          } else {
            current = current[key];
          }
        }
        return newData;
      });
    },
    []
  );

  const removeArrayItem = useCallback(
    (path: string, index: number) => {
      setFormData((prev: any) => {
        const newData = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current = newData;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (i === keys.length - 1) {
            if (Array.isArray(current[key])) {
              current[key].splice(index, 1);
            }
          } else {
            current = current[key];
          }
        }
        return newData;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        completionPercentage: 0,
        requiredFieldsMissing: [],
      },
    });
  }, [initialData]);

  return {
    formData,
    setFormData,
    updateFormData,
    handleFieldChange,
    addArrayItem,
    removeArrayItem,
    validationResult,
    validateForm,
    reset,
    getErrorsForPath: (path: string) =>
      validationResult.errors.filter((e) => e.path === path || e.path.startsWith(path + '.')),
    hasErrors: validationResult.isValid === false,
    hasWarnings: validationResult.warnings.length > 0,
  };
};

export default useFormValidation;
