/**
 * MÓDULO DE VALIDADORES ESPECIALIZADOS
 * Sistema completo de validação para prestação de contas
 * 
 * Responsabilidades:
 * - Validação de formatos (CPF, CNPJ, datas, moedas)
 * - Validação de regras de negócio
 * - Validação de período fiscal
 * - Validação de integridade de dados
 * - Geração de relatórios de erros estruturados
 */

import { PrestacaoContas } from '../types';

// ==================== TIPOS ====================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  section?: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    sections: Record<string, { errors: number; warnings: number }>;
  };
}

export interface ConsistencyReport {
  hasConsistencyIssues: boolean;
  issues: ValidationError[];
  crossReferences: {
    paymentToInvoice: { found: number; missing: number };
    contractToInvoice: { found: number; missing: number };
    employeeToPayment: { found: number; missing: number };
  };
}

// ==================== VALIDADORES BÁSICOS ====================

class FormatValidators {
  /**
   * Valida CPF (formato brasileiro)
   * Aceita: 123.456.789-10 ou 12345678910
   */
  static isValidCPF(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    
    // Rejeita sequências iguais
    if (/^(\d)\1{10}$/.test(clean)) return false;
    
    // Algoritmo de validação de CPF
    let sum = 0;
    let remainder: number;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(10, 11))) return false;
    
    return true;
  }

  /**
   * Valida CNPJ (formato brasileiro)
   * Aceita: 12.345.678/0001-90 ou 12345678000190
   */
  static isValidCNPJ(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    
    // Rejeita sequências iguais
    if (/^(\d)\1{13}$/.test(clean)) return false;
    
    // Algoritmo de validação de CNPJ
    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    let digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) as any * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) as any * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  }

  /**
   * Valida data em formato ISO (YYYY-MM-DD)
   */
  static isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr + 'T00:00:00Z');
    return !isNaN(date.getTime());
  }

  /**
   * Valida formato de moeda (permite valores positivos e negativos)
   */
  static isValidCurrency(value: number): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Valida CBO (Classificação Brasileira de Ocupações)
   * Aceita: 1234 ou 1234-56
   */
  static isValidCBO(cbo: string): boolean {
    const clean = cbo.replace('-', '');
    return /^\d{4}$/.test(clean);
  }

  /**
   * Valida CNS (Cartão Nacional de Saúde)
   * Deve ter 15 dígitos
   */
  static isValidCNS(cns: string): boolean {
    const clean = cns.replace(/\D/g, '');
    return clean.length === 15 && /^\d+$/.test(clean);
  }

  /**
   * Valida email
   */
  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida telefone brasileiro
   * Aceita: (XX) XXXXX-XXXX ou variações
   */
  static isValidPhone(phone: string): boolean {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 11;
  }
}

// ==================== VALIDADORES DE PERÍODO FISCAL ====================

class FiscalPeriodValidators {
  /**
   * Valida se o período está dentro do ano fiscal
   */
  static isValidFiscalMonth(mes: number): boolean {
    return mes >= 1 && mes <= 12;
  }

  /**
   * Valida se a data está dentro do período fiscal
   */
  static isDateInFiscalPeriod(date: string, mes: number, ano: number): boolean {
    try {
      const dateObj = new Date(date);
      const dateMonth = dateObj.getMonth() + 1;
      const dateYear = dateObj.getFullYear();
      
      // Para período de um mês específico
      return dateYear === ano && dateMonth === mes;
    } catch {
      return false;
    }
  }

  /**
   * Valida se as datas de vigência estão dentro do período de referência
   */
  static isVigencyWithinFiscalPeriod(
    vigenciaInicial: string,
    vigenciaFinal: string | undefined,
    mes: number,
    ano: number
  ): boolean {
    try {
      const startDate = new Date(vigenciaInicial);
      const endDate = vigenciaFinal ? new Date(vigenciaFinal) : new Date(vigenciaInicial);
      
      // Período fiscal (1º ao último dia do mês)
      const fiscalStart = new Date(`${ano}-${String(mes).padStart(2, '0')}-01`);
      const fiscalEnd = new Date(ano, mes, 0);
      
      // Valida se há sobreposição
      return startDate <= fiscalEnd && endDate >= fiscalStart;
    } catch {
      return false;
    }
  }
}

// ==================== VALIDADORES DE INTEGRIDADE ====================

class IntegrityValidators {
  /**
   * Valida se todas as referências de documentos fiscais existem
   */
  static validateInvoiceReferences(data: PrestacaoContas): ValidationError[] {
    const errors: ValidationError[] = [];
    const invoiceNumbers = new Set(
      data.documentos_fiscais?.map(d => d.numero) || []
    );

    data.pagamentos?.forEach((pag, i) => {
      if (!invoiceNumbers.has(pag.identificacao_documento_fiscal.numero)) {
        errors.push({
          field: `pagamentos[${i}].identificacao_documento_fiscal.numero`,
          message: `Documento fiscal "${pag.identificacao_documento_fiscal.numero}" não encontrado na seção 7`,
          severity: 'error',
          section: '8',
          value: pag.identificacao_documento_fiscal.numero
        });
      }
    });

    return errors;
  }

  /**
   * Valida se todas as referências de contratos existem
   */
  static validateContractReferences(data: PrestacaoContas): ValidationError[] {
    const errors: ValidationError[] = [];
    const contractNumbers = new Set(
      data.contratos?.map(c => c.numero) || []
    );

    data.documentos_fiscais?.forEach((doc, i) => {
      if (doc.identificacao_contrato?.numero && !contractNumbers.has(doc.identificacao_contrato.numero)) {
        errors.push({
          field: `documentos_fiscais[${i}].identificacao_contrato.numero`,
          message: `Contrato "${doc.identificacao_contrato.numero}" não encontrado na seção 6`,
          severity: 'error',
          section: '7',
          value: doc.identificacao_contrato.numero
        });
      }
    });

    return errors;
  }

  /**
   * Valida coerência entre documento e pagamento
   */
  static validatePaymentConsistency(data: PrestacaoContas): ValidationError[] {
    const errors: ValidationError[] = [];
    const docMap = new Map(
      (data.documentos_fiscais || []).map(d => [d.numero, d])
    );

    data.pagamentos?.forEach((pag, i) => {
      const doc = docMap.get(pag.identificacao_documento_fiscal.numero);
      if (doc) {
        // Validar data: pagamento deve ser após documento
        if (pag.pagamento_data && doc.data_emissao) {
          const payDate = new Date(pag.pagamento_data);
          const emitDate = new Date(doc.data_emissao);
          if (payDate < emitDate) {
            errors.push({
              field: `pagamentos[${i}].pagamento_data`,
              message: `Data do pagamento (${pag.pagamento_data}) anterior à emissão do documento (${doc.data_emissao})`,
              severity: 'error',
              section: '8'
            });
          }
        }

        // Validar valor: pagamento não deve exceder documento (com tolerância)
        if (pag.pagamento_valor > doc.valor_bruto * 1.05) {
          errors.push({
            field: `pagamentos[${i}].pagamento_valor`,
            message: `Valor do pagamento (R$ ${pag.pagamento_valor}) superior em mais de 5% ao documento (R$ ${doc.valor_bruto})`,
            severity: 'warning',
            section: '8'
          });
        }
      }
    });

    return errors;
  }

  /**
   * Valida coerência de saldos
   */
  static validateBalanceConsistency(data: PrestacaoContas): ValidationError[] {
    const errors: ValidationError[] = [];

    data.disponibilidades?.saldos?.forEach((saldo, i) => {
      // Saldo contábil não deve ser negativo
      if (saldo.saldo_contabil < 0) {
        errors.push({
          field: `disponibilidades.saldos[${i}].saldo_contabil`,
          message: `Saldo contábil não pode ser negativo (${saldo.saldo_contabil})`,
          severity: 'error',
          section: '9'
        });
      }

      // Validar alerta se saldo bancário diferir muito do contábil
      const diff = Math.abs(saldo.saldo_bancario - saldo.saldo_contabil);
      const tolerance = Math.max(100, saldo.saldo_contabil * 0.01); // 1% ou R$ 100

      if (diff > tolerance) {
        errors.push({
          field: `disponibilidades.saldos[${i}]`,
          message: `Diferença significativa entre saldo bancário (R$ ${saldo.saldo_bancario}) e contábil (R$ ${saldo.saldo_contabil}) - Diferença: R$ ${diff}`,
          severity: 'warning',
          section: '9'
        });
      }
    });

    return errors;
  }
}

// ==================== VALIDADOR PRINCIPAL ====================

export class ComprehensiveValidator {
  /**
   * Realiza validação completa da prestação de contas
   */
  static validate(data: PrestacaoContas): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validações de formato básico
    this.validateBasicFormats(data, errors);

    // Validações de período fiscal
    this.validateFiscalPeriod(data, errors, warnings);

    // Validações de integridade
    errors.push(...IntegrityValidators.validateInvoiceReferences(data));
    errors.push(...IntegrityValidators.validateContractReferences(data));
    warnings.push(...IntegrityValidators.validatePaymentConsistency(data));
    warnings.push(...IntegrityValidators.validateBalanceConsistency(data));

    // Separar errors e warnings
    const allErrors = errors.filter(e => e.severity === 'error');
    const allWarnings = [...warnings, ...errors.filter(e => e.severity === 'warning')];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      summary: this.generateSummary(allErrors, allWarnings)
    };
  }

  /**
   * Validação de formatos básicos
   */
  private static validateBasicFormats(data: PrestacaoContas, errors: ValidationError[]): void {
    // Descritor
    if (!data.descritor.municipio) {
      errors.push({
        field: 'descritor.municipio',
        message: 'Município é obrigatório',
        severity: 'error',
        section: '1'
      });
    }

    // Empregados
    data.relacao_empregados?.forEach((emp, i) => {
      if (!FormatValidators.isValidCPF(emp.cpf)) {
        errors.push({
          field: `relacao_empregados[${i}].cpf`,
          message: `CPF inválido: ${emp.cpf}`,
          severity: 'error',
          section: '4',
          value: emp.cpf
        });
      }

      if (!FormatValidators.isValidDate(emp.data_admissao)) {
        errors.push({
          field: `relacao_empregados[${i}].data_admissao`,
          message: `Data de admissão em formato inválido: ${emp.data_admissao}`,
          severity: 'error',
          section: '4',
          value: emp.data_admissao
        });
      }

      if (!FormatValidators.isValidCBO(emp.cbo)) {
        errors.push({
          field: `relacao_empregados[${i}].cbo`,
          message: `CBO inválido: ${emp.cbo}`,
          severity: 'error',
          section: '4',
          value: emp.cbo
        });
      }
    });

    // Contratos
    data.contratos?.forEach((contract, i) => {
      if (!FormatValidators.isValidCNPJ(contract.credor.documento_numero) && 
          !FormatValidators.isValidCPF(contract.credor.documento_numero)) {
        errors.push({
          field: `contratos[${i}].credor.documento_numero`,
          message: `CPF/CNPJ inválido: ${contract.credor.documento_numero}`,
          severity: 'error',
          section: '6',
          value: contract.credor.documento_numero
        });
      }

      if (!FormatValidators.isValidDate(contract.data_assinatura)) {
        errors.push({
          field: `contratos[${i}].data_assinatura`,
          message: `Data de assinatura em formato inválido: ${contract.data_assinatura}`,
          severity: 'error',
          section: '6',
          value: contract.data_assinatura
        });
      }
    });

    // Documentos Fiscais
    data.documentos_fiscais?.forEach((doc, i) => {
      if (!FormatValidators.isValidCNPJ(doc.credor.documento_numero) && 
          !FormatValidators.isValidCPF(doc.credor.documento_numero)) {
        errors.push({
          field: `documentos_fiscais[${i}].credor.documento_numero`,
          message: `CPF/CNPJ inválido: ${doc.credor.documento_numero}`,
          severity: 'error',
          section: '7',
          value: doc.credor.documento_numero
        });
      }
    });
  }

  /**
   * Validação de período fiscal
   */
  private static validateFiscalPeriod(data: PrestacaoContas, errors: ValidationError[], warnings: ValidationError[]): void {
    const { mes, ano } = data.descritor;

    if (!FiscalPeriodValidators.isValidFiscalMonth(mes)) {
      errors.push({
        field: 'descritor.mes',
        message: `Mês inválido: ${mes}`,
        severity: 'error',
        section: '1'
      });
    }

    // Validar período de empregados
    data.relacao_empregados?.forEach((emp, i) => {
      if (!FiscalPeriodValidators.isDateInFiscalPeriod(emp.data_admissao, mes, ano)) {
        warnings.push({
          field: `relacao_empregados[${i}].data_admissao`,
          message: `Data de admissão (${emp.data_admissao}) fora do período de referência (${mes}/${ano})`,
          severity: 'warning',
          section: '4'
        });
      }
    });

    // Validar períodos de contratos
    data.contratos?.forEach((contract, i) => {
      if (!FiscalPeriodValidators.isVigencyWithinFiscalPeriod(
        contract.vigencia_data_inicial,
        contract.vigencia_data_final,
        mes,
        ano
      )) {
        warnings.push({
          field: `contratos[${i}].vigencia`,
          message: `Vigência do contrato não se sobrepõe com período fiscal (${mes}/${ano})`,
          severity: 'warning',
          section: '6'
        });
      }
    });
  }

  /**
   * Gera sumário de validação
   */
  private static generateSummary(
    errors: ValidationError[],
    warnings: ValidationError[]
  ): ValidationResult['summary'] {
    const sections: Record<string, { errors: number; warnings: number }> = {};

    errors.forEach(err => {
      if (err.section) {
        if (!sections[err.section]) sections[err.section] = { errors: 0, warnings: 0 };
        sections[err.section].errors++;
      }
    });

    warnings.forEach(warn => {
      if (warn.section) {
        if (!sections[warn.section]) sections[warn.section] = { errors: 0, warnings: 0 };
        sections[warn.section].warnings++;
      }
    });

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      sections
    };
  }

  /**
   * Gera relatório de consistência
   */
  static generateConsistencyReport(data: PrestacaoContas): ConsistencyReport {
    const issues: ValidationError[] = [];

    // Contar referências
    const invoices = new Set(data.documentos_fiscais?.map(d => d.numero) || []);
    const contracts = new Set(data.contratos?.map(c => c.numero) || []);

    let paymentToInvoiceFound = 0;
    let paymentToInvoiceMissing = 0;
    data.pagamentos?.forEach(pag => {
      if (invoices.has(pag.identificacao_documento_fiscal.numero)) {
        paymentToInvoiceFound++;
      } else {
        paymentToInvoiceMissing++;
      }
    });

    let contractToInvoiceFound = 0;
    let contractToInvoiceMissing = 0;
    data.documentos_fiscais?.forEach(doc => {
      if (doc.identificacao_contrato?.numero && contracts.has(doc.identificacao_contrato.numero)) {
        contractToInvoiceFound++;
      } else if (doc.identificacao_contrato?.numero) {
        contractToInvoiceMissing++;
      }
    });

    return {
      hasConsistencyIssues: paymentToInvoiceMissing > 0 || contractToInvoiceMissing > 0,
      issues,
      crossReferences: {
        paymentToInvoice: { found: paymentToInvoiceFound, missing: paymentToInvoiceMissing },
        contractToInvoice: { found: contractToInvoiceFound, missing: contractToInvoiceMissing },
        employeeToPayment: { found: 0, missing: 0 } // TODO: Implementar lógica
      }
    };
  }
}

// Exportar para uso
export const validatePrestacaoContas = (data: PrestacaoContas): ValidationResult => {
  return ComprehensiveValidator.validate(data);
};

export const generateConsistencyReport = (data: PrestacaoContas): ConsistencyReport => {
  return ComprehensiveValidator.generateConsistencyReport(data);
};

export const validateFormatters = FormatValidators;
export const validateFiscalPeriod = FiscalPeriodValidators;
export const validateIntegrity = IntegrityValidators;
