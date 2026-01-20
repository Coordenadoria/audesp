import Ajv from "ajv";
import addFormats from "ajv-formats";
import { AUDESP_SCHEMA } from '../schemas/audespSchema';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(AUDESP_SCHEMA);

export interface ValidationResult {
  valid: boolean;
  errors: any[];
  warnings: string[];
}

export const validatePrestacaoContas = (data: any): ValidationResult => {
  const valid = validate(data);
  const errors = validate.errors || [];
  const warnings: string[] = [];

  if (data.pagamentos && data.documentos_fiscais) {
    const docMap = new Map<string, number>();
    data.documentos_fiscais.forEach((doc: any) => {
      docMap.set(doc.numero, doc.valor_bruto);
    });

    data.pagamentos.forEach((pag: any, idx: number) => {
      const docValue = docMap.get(pag.numero_documento);
      if (docValue && pag.valor_pago > docValue) {
        warnings.push(`Pagamento #${idx + 1}: valor pago excede valor do documento`);
      }
    });
  }

  return {
    valid: valid === true,
    errors: errors.map(err => ({
      path: err.instancePath || '/',
      message: err.message,
      params: err.params
    })),
    warnings
  };
};

export const validateField = (path: string, value: any): string | null => {
  const keys = path.split('.');
  let current = AUDESP_SCHEMA.properties;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current && current[key]) {
      if ((current[key] as any).type === 'array') {
        current = (current[key] as any).items.properties;
      } else {
        current = (current[key] as any).properties;
      }
    }
  }

  const fieldSchema = current && current[keys[keys.length - 1]] as any;
  if (!fieldSchema) return null;

  if (fieldSchema.type === 'string' && typeof value !== 'string' && value !== '') {
    return 'Deve ser um texto';
  }
  if (fieldSchema.type === 'number' && isNaN(value) && value !== '') {
    return 'Deve ser um número';
  }

  if (fieldSchema.pattern && value && !new RegExp(fieldSchema.pattern).test(value)) {
    return 'Formato inválido';
  }

  if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
    return `Mínimo ${fieldSchema.minimum}`;
  }
  if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
    return `Máximo ${fieldSchema.maximum}`;
  }

  if (fieldSchema.minLength && value && value.length < fieldSchema.minLength) {
    return `Mínimo ${fieldSchema.minLength} caracteres`;
  }
  if (fieldSchema.maxLength && value && value.length > fieldSchema.maxLength) {
    return `Máximo ${fieldSchema.maxLength} caracteres`;
  }

  if (fieldSchema.enum && value && !fieldSchema.enum.includes(value)) {
    return 'Opção inválida';
  }

  return null;
};

export const formatValue = (value: any, type: string): string => {
  if (!value) return '';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    
    case 'date':
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('pt-BR');
      }
      return '';
    
    case 'cpf':
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    
    case 'cnpj':
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    
    default:
      return String(value);
  }
};

export const parseMask = (value: string, mask: string): string => {
  const digits = value.replace(/\D/g, '');

  switch (mask) {
    case 'cpf':
      return digits.slice(0, 11);
    case 'cnpj':
      return digits.slice(0, 14);
    case 'phone':
      return digits.slice(0, 11);
    default:
      return value;
  }
};

export const calculateSummary = (data: any) => {
  return {
    total_documentos_fiscais: (data.documentos_fiscais || []).length,
    valor_total_documentos: (data.documentos_fiscais || []).reduce((sum: number, doc: any) => sum + (doc.valor_bruto || 0), 0),
    total_pagamentos: (data.pagamentos || []).length,
    valor_total_pagamentos: (data.pagamentos || []).reduce((sum: number, pag: any) => sum + (pag.valor_pago || 0), 0),
    total_contratos: (data.contratos || []).length,
    total_empregados: (data.empregados || []).length,
  };
};

export const getAllSectionsStatus = (data: any) => {
  const sections = [
    { id: 'descritor', name: 'Descritor', complete: !!data.descritor?.tipo_documento },
    { id: 'contratos', name: 'Contratos', complete: (data.contratos || []).length > 0 },
    { id: 'documentos_fiscais', name: 'Documentos Fiscais', complete: (data.documentos_fiscais || []).length > 0 },
    { id: 'pagamentos', name: 'Pagamentos', complete: (data.pagamentos || []).length > 0 },
  ];
  
  const completedCount = sections.filter(s => s.complete).length;
  return {
    sections,
    total: sections.length,
    completed: completedCount,
    percentage: Math.round((completedCount / sections.length) * 100)
  };
};

export const validateConsistency = (data: any): string[] => [];

export interface SectionStatus {
    id: string;
    status: 'valid' | 'invalid' | 'empty' | 'partial';
    errors: string[];
}

export function validateSection(sectionId: string, data: any): string[] {
    return [];
}
