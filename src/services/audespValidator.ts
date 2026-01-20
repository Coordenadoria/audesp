import type { PrestacaoConta, ValidationError, ValidationWarning } from './audespSchemaTypes';

class AudespValidator {
  // Regra 1: Validar CPF
  validateCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
  }

  // Regra 2: Validar CNPJ
  validateCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    let sum = 0;
    const firstDigits = 5;
    let multiplier = 2;

    for (let i = firstDigits; i >= 0; i--) {
      sum += parseInt(cleaned.substring(i, i + 1)) * multiplier;
      multiplier++;
      if (multiplier === 10) multiplier = 2;
    }

    let remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    if (remainder !== parseInt(cleaned.substring(12, 13))) return false;

    sum = 0;
    multiplier = 2;

    for (let i = 6; i >= 0; i--) {
      sum += parseInt(cleaned.substring(i, i + 1)) * multiplier;
      multiplier++;
      if (multiplier === 10) multiplier = 2;
    }

    remainder = sum % 11;
    if (remainder < 2) remainder = 0;
    else remainder = 11 - remainder;

    if (remainder !== parseInt(cleaned.substring(13, 14))) return false;

    return true;
  }

  // Regra 3: Validar Email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Regra 4: Validar Data
  validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  // Regra 5: Validar Valor Monetário
  validateMonetary(value: number): boolean {
    return value >= 0 && !isNaN(value) && isFinite(value);
  }

  // Regra 6: Validar Percentual
  validatePercentage(value: number): boolean {
    return value >= 0 && value <= 100 && !isNaN(value);
  }

  // Regra 7: Validar CEP
  validateCEP(cep: string): boolean {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.length === 8;
  }

  // Regra 8: Validar Telefone
  validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  // Regra 9: Validar Banco
  validateBankCode(code: string): boolean {
    const cleaned = code.replace(/\D/g, '');
    return cleaned.length === 3;
  }

  // Regra 10: Validar Agência
  validateAgency(agency: string): boolean {
    const cleaned = agency.replace(/\D/g, '');
    return cleaned.length >= 4 && cleaned.length <= 5;
  }

  // Regra 11: Validar Conta
  validateAccount(account: string): boolean {
    const cleaned = account.replace(/\D/g, '');
    return cleaned.length >= 6 && cleaned.length <= 12;
  }

  // Regra 12: Data válida (não pode ser futura)
  validatePastDate(date: string): boolean {
    if (!this.validateDate(date)) return false;
    return new Date(date) <= new Date();
  }

  // Regra 13: Validar Exercício Fiscal (ano válido)
  validateFiscalYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  }

  // Regra 14: Validar URLs
  validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Regra 15: Validar Intervalo de Datas
  validateDateRange(startDate: string, endDate: string): boolean {
    if (!this.validateDate(startDate) || !this.validateDate(endDate)) return false;
    return new Date(startDate) <= new Date(endDate);
  }

  // Regra 16: Validar Campos Obrigatórios
  validateRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  // Regra 17: Validação Completa
  validateAll(data: Partial<PrestacaoConta>): {
    isValid: boolean;
    errors: ValidationError;
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError = {};
    const warnings: ValidationWarning[] = [];

    // Validar campos obrigatórios
    const requiredFields = ['exercicio', 'dataPrestacao'];
    for (const field of requiredFields) {
      if (!this.validateRequired((data as any)[field])) {
        errors[field] = [`Campo obrigatório: ${field}`];
      }
    }

    // Validar CPF do responsável
    if (data.responsavel?.cpf && !this.validateCPF(data.responsavel.cpf)) {
      errors.responsavelCPF = ['CPF inválido'];
    }

    // Validar CNPJ da entidade
    if (data.entidade?.cnpj && !this.validateCNPJ(data.entidade.cnpj)) {
      errors.entidadeCNPJ = ['CNPJ inválido'];
    }

    // Validar email
    if (data.responsavel?.email && !this.validateEmail(data.responsavel.email)) {
      errors.email = ['Email inválido'];
    }

    // Validar CEP
    if (data.endereco?.cep && !this.validateCEP(data.endereco.cep)) {
      errors.cep = ['CEP inválido'];
    }

    // Validar telefone
    if (data.responsavel?.telefone && !this.validatePhone(data.responsavel.telefone)) {
      errors.telefone = ['Telefone inválido'];
    }

    // Validar datas
    if (data.dataPrestacao && !this.validatePastDate(data.dataPrestacao)) {
      errors.dataPrestacao = ['Data não pode ser no futuro'];
    }

    // Validar exercício fiscal
    if (data.exercicio && !this.validateFiscalYear(data.exercicio)) {
      errors.exercicio = ['Ano fiscal inválido'];
    }

    // Validar valores monetários
    if (data.financeiro?.receitaTotal !== undefined && 
        !this.validateMonetary(data.financeiro.receitaTotal)) {
      errors.receitaTotal = ['Valor monetário inválido'];
    }

    if (data.financeiro?.despesaTotal !== undefined &&
        !this.validateMonetary(data.financeiro.despesaTotal)) {
      errors.despesaTotal = ['Valor monetário inválido'];
    }

    // Avisos
    if (data.financeiro?.receitaTotal === 0) {
      warnings.push('Atenção: Receita total é zero');
    }

    if (data.financeiro?.despesaTotal === 0) {
      warnings.push('Atenção: Despesa total é zero');
    }

    const isValid = Object.keys(errors).length === 0;

    return { isValid, errors, warnings };
  }
}

export const audespValidator = new AudespValidator();
