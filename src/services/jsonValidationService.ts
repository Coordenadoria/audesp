/**
 * JSON VALIDATION & SUGGESTION SERVICE
 * Valida JSON em tempo real e fornece sugestões de melhoria
 */

export interface ValidationError {
  field: string;
  path: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  value?: any;
  expectedType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  completionPercentage: number;
  duration: number;
}

// ==================== SCHEMA VALIDATION ====================

export class JSONValidator {
  /**
   * Valida JSON contra schema
   */
  static validate(
    data: Record<string, any>,
    schema: Record<string, any>,
    requiredFields?: string[]
  ): ValidationResult {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    // Validar campos obrigatórios
    const required = requiredFields || this.getRequiredFields(schema);
    for (const field of required) {
      if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
        errors.push({
          field,
          path: field,
          message: `Campo obrigatório vazio: ${this.humanizeField(field)}`,
          severity: 'error',
          suggestion: `Preenchimento obrigatório para ${this.humanizeField(field)}`
        });
      }
    }

    // Validar tipos de dados
    for (const [field, value] of Object.entries(data)) {
      if (value === null || value === undefined || value === '') continue;

      const expectedType = schema[field]?.type || typeof value;
      const validation = this.validateType(field, value, expectedType, schema[field]);

      if (!validation.valid) {
        errors.push({
          field,
          path: field,
          message: validation.message,
          severity: 'error',
          suggestion: validation.suggestion,
          value,
          expectedType
        });
      } else if (validation.warning) {
        warnings.push({
          field,
          path: field,
          message: validation.warning,
          severity: 'warning',
          value
        });
      }
    }

    // Gerar sugestões inteligentes
    const smartSuggestions = this.generateSuggestions(data, schema, errors);
    suggestions.push(...smartSuggestions);

    // Calcular completeness
    const completionPercentage = this.calculateCompletion(data, required);

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      completionPercentage,
      duration: Date.now() - startTime
    };

    return result;
  }

  /**
   * Valida tipo de dado
   */
  private static validateType(
    field: string,
    value: any,
    expectedType: string,
    fieldSchema?: any
  ): { valid: boolean; message?: string; suggestion?: string; warning?: string } {
    // CPF
    if (fieldSchema?.format === 'cpf' || field.includes('cpf')) {
      const cpf = String(value).replace(/\D/g, '');
      if (!this.isValidCPF(cpf)) {
        return {
          valid: false,
          message: 'CPF inválido',
          suggestion: 'CPF deve conter 11 dígitos válidos (ex: 12345678901)'
        };
      }
    }

    // CNPJ
    if (fieldSchema?.format === 'cnpj' || field.includes('cnpj')) {
      const cnpj = String(value).replace(/\D/g, '');
      if (!this.isValidCNPJ(cnpj)) {
        return {
          valid: false,
          message: 'CNPJ inválido',
          suggestion: 'CNPJ deve conter 14 dígitos válidos'
        };
      }
    }

    // Data
    if (fieldSchema?.format === 'date' || field.includes('data') || field.includes('date')) {
      if (!this.isValidDate(String(value))) {
        return {
          valid: false,
          message: 'Formato de data inválido',
          suggestion: 'Use formato DD/MM/YYYY ou YYYY-MM-DD'
        };
      }
    }

    // Email
    if (fieldSchema?.format === 'email' || field.includes('email')) {
      if (!this.isValidEmail(String(value))) {
        return {
          valid: false,
          message: 'Email inválido',
          suggestion: 'Use formato válido: usuario@dominio.com'
        };
      }
    }

    // Moeda
    if (fieldSchema?.format === 'currency' || field.includes('valor') || field.includes('price')) {
      const num = parseFloat(String(value).replace(/[^\d.,]/g, ''));
      if (isNaN(num)) {
        return {
          valid: false,
          message: 'Valor monetário inválido',
          suggestion: 'Use apenas números e vírgula/ponto para decimais'
        };
      }
      if (num < 0) {
        return {
          valid: false,
          message: 'Valor não pode ser negativo',
          suggestion: `Valor: ${Math.abs(num)}`
        };
      }
    }

    // Percentual
    if (fieldSchema?.format === 'percentage' || field.includes('percentual') || field.includes('percent')) {
      const num = parseFloat(String(value).replace(/[^\d.,]/g, ''));
      if (isNaN(num) || num < 0 || num > 100) {
        return {
          valid: false,
          message: 'Percentual deve estar entre 0 e 100',
          suggestion: 'Use valores de 0 a 100'
        };
      }
    }

    // Número
    if (expectedType === 'number' || fieldSchema?.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: 'Valor não é um número válido',
          suggestion: `Esperado: número, Recebido: ${typeof value}`
        };
      }
      if (fieldSchema?.minimum !== undefined && num < fieldSchema.minimum) {
        return {
          valid: true,
          warning: `Valor abaixo do mínimo recomendado (${fieldSchema.minimum})`
        };
      }
    }

    // String
    if (expectedType === 'string' || fieldSchema?.type === 'string') {
      const str = String(value);
      if (fieldSchema?.minLength && str.length < fieldSchema.minLength) {
        return {
          valid: true,
          warning: `Comprimento mínimo recomendado: ${fieldSchema.minLength} caracteres`
        };
      }
      if (fieldSchema?.maxLength && str.length > fieldSchema.maxLength) {
        return {
          valid: false,
          message: `Comprimento máximo: ${fieldSchema.maxLength} caracteres`,
          suggestion: `Texto muito longo: ${str.length} caracteres`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Gera sugestões inteligentes
   */
  private static generateSuggestions(
    data: Record<string, any>,
    schema: Record<string, any>,
    errors: ValidationError[]
  ): string[] {
    const suggestions: string[] = [];

    // Se há campos vazios críticos
    const emptyFields = errors.filter(e => e.message.includes('vazio')).length;
    if (emptyFields > 3) {
      suggestions.push(`Existem ${emptyFields} campos obrigatórios vazios. Priorize o preenchimento deles.`);
    }

    // Se há muitos erros de validação
    if (errors.length > 5) {
      suggestions.push('Considere importar dados de um PDF ou arquivo estruturado para acelerar o preenchimento.');
    }

    // Se tem campos com valores inconsistentes
    const inconsistencies = this.findInconsistencies(data);
    if (inconsistencies.length > 0) {
      suggestions.push(...inconsistencies);
    }

    // Sugestão de preenchimento automático
    const totalFields = Object.keys(schema).length;
    const filledFields = Object.values(data).filter(v => v && v !== '' && v !== null && v !== undefined).length;
    const percentage = (filledFields / totalFields) * 100;

    if (percentage > 0 && percentage < 50) {
      suggestions.push('Continue preenchendo! Você já completou ' + Math.round(percentage) + '% do formulário.');
    } else if (percentage >= 50 && percentage < 100) {
      suggestions.push('Quase lá! Apenas ' + (totalFields - filledFields) + ' campos faltam.');
    }

    return suggestions;
  }

  /**
   * Encontra inconsistências nos dados
   */
  private static findInconsistencies(data: Record<string, any>): string[] {
    const inconsistencies: string[] = [];

    // Datas inversas
    if (data.dataInicio && data.dataFim) {
      const start = new Date(data.dataInicio);
      const end = new Date(data.dataFim);
      if (start > end) {
        inconsistencies.push('Data de início não pode ser posterior à data de término');
      }
    }

    // Valores inconsistentes (ex: saldo não bate)
    if (data.receitas && data.despesas && data.saldo) {
      const calculated = data.receitas - data.despesas;
      const saldoNum = parseFloat(String(data.saldo));
      if (Math.abs(calculated - saldoNum) > 0.01) {
        inconsistencies.push(`Saldo inconsistente: Receitas (${data.receitas}) - Despesas (${data.despesas}) deveria ser ${calculated}, mas está ${data.saldo}`);
      }
    }

    return inconsistencies;
  }

  /**
   * Calcula percentual de completude
   */
  private static calculateCompletion(data: Record<string, any>, requiredFields: string[]): number {
    if (requiredFields.length === 0) return 0;

    const filled = requiredFields.filter(
      field => data[field] && data[field] !== '' && data[field] !== null && data[field] !== undefined
    ).length;

    return Math.round((filled / requiredFields.length) * 100);
  }

  /**
   * Obtém campos obrigatórios do schema
   */
  private static getRequiredFields(schema: Record<string, any>): string[] {
    return Object.entries(schema)
      .filter(([_, config]: [string, any]) => config.required === true)
      .map(([field]) => field);
  }

  /**
   * Humaniza nome de campo
   */
  private static humanizeField(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // ==================== VALIDAÇÕES ESPECÍFICAS ====================

  private static isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private static isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    let sum = 0;
    const multiplier1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * multiplier1[i];
    }

    let remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (remainder !== parseInt(cnpj[12])) return false;

    sum = 0;
    const multiplier2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * multiplier2[i];
    }

    remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (remainder !== parseInt(cnpj[13])) return false;

    return true;
  }

  private static isValidDate(date: string): boolean {
    const formats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,      // DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,        // DD-MM-YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/,        // YYYY-MM-DD
      /^\d{4}\/\d{1,2}\/\d{1,2}$/,      // YYYY/MM/DD
    ];

    return formats.some(format => format.test(date));
  }

  private static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

// ==================== AUTO-SUGGEST ENGINE ====================

export class AutoSuggestEngine {
  private static suggestions: Map<string, string[]> = new Map();

  /**
   * Sugere valores baseado em histórico
   */
  static suggestValue(field: string, partialValue: string): string[] {
    const suggestions = this.suggestions.get(field) || [];
    return suggestions.filter(s => s.toLowerCase().includes(partialValue.toLowerCase())).slice(0, 5);
  }

  /**
   * Aprende novo valor
   */
  static learnValue(field: string, value: string): void {
    if (!value) return;

    const suggestions = this.suggestions.get(field) || [];
    if (!suggestions.includes(value)) {
      suggestions.push(value);
      this.suggestions.set(field, suggestions);

      // Limitar a 50 sugestões por campo
      if (suggestions.length > 50) {
        suggestions.shift();
      }
    }
  }

  /**
   * Exporta sugestões aprendidas
   */
  static exportSuggestions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    this.suggestions.forEach((values, field) => {
      result[field] = values;
    });
    return result;
  }

  /**
   * Importa sugestões
   */
  static importSuggestions(data: Record<string, string[]>): void {
    this.suggestions.clear();
    Object.entries(data).forEach(([field, values]) => {
      this.suggestions.set(field, values);
    });
  }
}

export default {
  JSONValidator,
  AutoSuggestEngine
};
