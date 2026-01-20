import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import audesp_schema_v1_9 from '../schemas/audesp-schema-v1.9.json';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    completionPercentage: number;
    requiredFieldsMissing: string[];
  };
}

export interface ValidationError {
  path: string;
  field: string;
  message: string;
  value: any;
  rule: string;
  severity: 'error' | 'critical';
  suggestion?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  type: 'inconsistency' | 'divergence' | 'missing-related';
}

export class AUDESPValidator {
  private ajv: Ajv;
  private validateFunction: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });

    // Adicionar formatos padrão (date, email, uri, etc)
    addFormats(this.ajv);

    // Compilar schema
    this.validateFunction = this.ajv.compile(audesp_schema_v1_9);
  }

  /**
   * Valida o JSON completo contra o schema AUDESP
   */
  public validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validação Schema
    const isValid = this.validateFunction(data);
    if (!isValid && this.validateFunction.errors) {
      for (const ajvError of this.validateFunction.errors) {
        errors.push(this.convertAjvError(ajvError));
      }
    }

    // 2. Validações de Negócio
    if (data) {
      const businessErrors = this.validateBusinessRules(data);
      errors.push(...businessErrors);

      const businessWarnings = this.validateConsistency(data);
      warnings.push(...businessWarnings);
    }

    // 3. Campos Obrigatórios
    const requiredFieldsMissing = this.checkRequiredFields(data);

    // 4. Completude do Formulário
    const completionPercentage = this.calculateCompletion(data);

    const result: ValidationResult = {
      isValid: errors.length === 0 && isValid,
      errors: errors.sort((a, b) => {
        if (a.severity === 'critical') return -1;
        if (b.severity === 'critical') return 1;
        return a.path.localeCompare(b.path);
      }),
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        completionPercentage,
        requiredFieldsMissing,
      },
    };

    return result;
  }

  /**
   * Converte erro do AJV para nosso formato
   */
  private convertAjvError(ajvError: ErrorObject): ValidationError {
    const path = ajvError.instancePath || '/';
    const field = path.split('/').pop() || 'unknown';

    let message = 'Erro de validação';
    let suggestion: string | undefined;
    let severity: 'error' | 'critical' = 'error';

    switch (ajvError.keyword) {
      case 'required':
        message = `Campo obrigatório: ${ajvError.params.missingProperty}`;
        severity = 'critical';
        break;
      case 'type':
        message = `Tipo de dados inválido. Esperado: ${ajvError.params.type}`;
        break;
      case 'pattern':
        message = `Formato inválido (não corresponde ao padrão esperado)`;
        suggestion = `Esperado: ${ajvError.params.pattern}`;
        break;
      case 'minLength':
        message = `Comprimento mínimo: ${ajvError.params.limit} caracteres`;
        break;
      case 'maxLength':
        message = `Comprimento máximo: ${ajvError.params.limit} caracteres`;
        break;
      case 'minimum':
        message = `Valor mínimo: ${ajvError.params.limit}`;
        break;
      case 'maximum':
        message = `Valor máximo: ${ajvError.params.limit}`;
        break;
      case 'enum':
        message = `Valor deve ser um de: ${ajvError.params.allowedValues.join(', ')}`;
        break;
      case 'format':
        message = `Formato inválido para ${ajvError.params.format}`;
        break;
      case 'minItems':
        message = `Mínimo de ${ajvError.params.limit} item(ns) necessário(s)`;
        severity = 'critical';
        break;
    }

    return {
      path,
      field,
      message,
      value: (ajvError.data as any)?.[field],
      rule: ajvError.keyword,
      severity,
      suggestion,
    };
  }

  /**
   * Validações de regras de negócio AUDESP
   */
  private validateBusinessRules(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // R1: Pagamentos ≤ Documentos Fiscais
    if (data.documentosFiscais && data.pagamentos) {
      const totalDocs = data.documentosFiscais.reduce(
        (sum: number, doc: any) => sum + (doc.valorLiquido || 0),
        0
      );
      const totalPagamentos = data.pagamentos.reduce(
        (sum: number, pag: any) => sum + (pag.valor || 0),
        0
      );

      if (totalPagamentos > totalDocs) {
        errors.push({
          path: '/pagamentos',
          field: 'pagamentos',
          message: `Valor total de pagamentos (R$ ${totalPagamentos.toFixed(2)}) excede o total de documentos fiscais (R$ ${totalDocs.toFixed(2)})`,
          value: totalPagamentos,
          rule: 'businessRule.paymentExceedsDocuments',
          severity: 'critical',
          suggestion: `Reduza os pagamentos ou adicione mais documentos fiscais`,
        });
      }
    }

    // R2: Datas devem respeitar período de vigência
    if (data.descritor && data.descritor.dataElaboracao && data.documentosFiscais) {
      const dataElaboracao = new Date(data.descritor.dataElaboracao);
      data.documentosFiscais.forEach((doc: any, idx: number) => {
        if (doc.dataEmissao) {
          const dataEmissao = new Date(doc.dataEmissao);
          if (dataEmissao > dataElaboracao) {
            errors.push({
              path: `/documentosFiscais/${idx}/dataEmissao`,
              field: 'dataEmissao',
              message: `Data de emissão (${doc.dataEmissao}) não pode ser posterior à data de elaboração (${data.descritor.dataElaboracao})`,
              value: doc.dataEmissao,
              rule: 'businessRule.dateOutOfRange',
              severity: 'error',
            });
          }
        }
      });
    }

    // R3: CPF válido (algoritmo de validação)
    if (data.descritor?.responsavel?.cpf) {
      if (!this.isValidCPF(data.descritor.responsavel.cpf)) {
        errors.push({
          path: '/descritor/responsavel/cpf',
          field: 'cpf',
          message: `CPF inválido: ${data.descritor.responsavel.cpf}`,
          value: data.descritor.responsavel.cpf,
          rule: 'businessRule.invalidCPF',
          severity: 'critical',
        });
      }
    }

    // R4: CNPJ válido
    data.contratos?.forEach((contrato: any, idx: number) => {
      if (contrato.contratada?.cnpj) {
        if (!this.isValidCNPJ(contrato.contratada.cnpj)) {
          errors.push({
            path: `/contratos/${idx}/contratada/cnpj`,
            field: 'cnpj',
            message: `CNPJ inválido: ${contrato.contratada.cnpj}`,
            value: contrato.contratada.cnpj,
            rule: 'businessRule.invalidCNPJ',
            severity: 'critical',
          });
        }
      }
    });

    // R5: Exercício válido (ano)
    if (data.descritor?.exercicio) {
      const ano = parseInt(data.descritor.exercicio);
      const currentYear = new Date().getFullYear();
      if (ano < 2000 || ano > currentYear + 1) {
        errors.push({
          path: '/descritor/exercicio',
          field: 'exercicio',
          message: `Exercício fora do intervalo válido (2000-${currentYear + 1})`,
          value: data.descritor.exercicio,
          rule: 'businessRule.invalidYear',
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Validações de consistência e divergências
   */
  private validateConsistency(data: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // W1: Documento fiscal sem pagamento relacionado
    if (data.documentosFiscais && data.pagamentos) {
      const docNumeros = new Set(data.documentosFiscais.map((d: any) => d.numero));
      const pagDocumentos = new Set(
        data.pagamentos
          .map((p: any) => p.documentoRelacionado)
          .filter((d: any) => d)
      );

      docNumeros.forEach((docNum) => {
        if (!pagDocumentos.has(docNum)) {
          warnings.push({
            path: `/documentosFiscais`,
            message: `Documento fiscal nº ${docNum} não possui pagamento relacionado`,
            type: 'missing-related',
          });
        }
      });
    }

    // W2: Contrato sem documentos fiscais relacionados
    if (data.contratos && data.documentosFiscais) {
      const docContratos = new Set(
        data.documentosFiscais
          .map((d: any) => d.contrato)
          .filter((c: any) => c)
      );

      data.contratos.forEach((contrato: any) => {
        if (!docContratos.has(contrato.numero)) {
          warnings.push({
            path: `/contratos`,
            message: `Contrato nº ${contrato.numero} sem documentos fiscais relacionados`,
            type: 'missing-related',
          });
        }
      });
    }

    // W3: Divergência de valor entre documento e pagamento
    if (data.documentosFiscais && data.pagamentos) {
      data.documentosFiscais.forEach((doc: any) => {
        const pagamentosRelacionados = data.pagamentos.filter(
          (p: any) => p.documentoRelacionado === doc.numero
        );
        const totalPagamentos = pagamentosRelacionados.reduce(
          (sum: number, p: any) => sum + (p.valor || 0),
          0
        );
        const valorEsperado = doc.valorLiquido || 0;

        if (Math.abs(totalPagamentos - valorEsperado) > 0.01) {
          // Tolerância de 1 centavo
          warnings.push({
            path: `/documentosFiscais`,
            message: `Divergência de valor no documento nº ${doc.numero}: esperado R$ ${valorEsperado.toFixed(2)}, pago R$ ${totalPagamentos.toFixed(2)}`,
            type: 'divergence',
          });
        }
      });
    }

    return warnings;
  }

  /**
   * Verifica campos obrigatórios faltando
   */
  private checkRequiredFields(data: any): string[] {
    const required = [
      'descritor',
      'codigoAjuste',
      'documentosFiscais',
      'pagamentos',
    ];
    const missing: string[] = [];

    required.forEach((field) => {
      if (!data || !data[field]) {
        missing.push(field);
      }
    });

    // Campos dentro de descritor
    if (data?.descritor) {
      const requiredDescriptor = ['exercicio', 'orgao', 'municipio'];
      requiredDescriptor.forEach((field) => {
        if (!data.descritor[field]) {
          missing.push(`descritor.${field}`);
        }
      });
    }

    return missing;
  }

  /**
   * Calcula percentual de completude do formulário
   */
  private calculateCompletion(data: any): number {
    if (!data) return 0;

    const sections = [
      'descritor',
      'codigoAjuste',
      'relacaoEmpregados',
      'relacaoBens',
      'contratos',
      'documentosFiscais',
      'pagamentos',
      'conciliacao',
      'transparencia',
      'anexos',
    ];

    let filled = 0;
    sections.forEach((section) => {
      if (data[section]) {
        const isArray = Array.isArray(data[section]);
        const hasContent = isArray ? data[section].length > 0 : Object.keys(data[section]).length > 0;
        if (hasContent) filled++;
      }
    });

    return Math.round((filled / sections.length) * 100);
  }

  /**
   * Valida CPF usando algoritmo de dígito verificador
   */
  private isValidCPF(cpf: string): boolean {
    // Remove formatação
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;

    // CPF com todos os dígitos iguais é inválido
    if (/^(\d)\1{10}$/.test(clean)) return false;

    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i]) * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(clean[9]) !== digit1) return false;

    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean[i]) * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(clean[10]) !== digit2) return false;

    return true;
  }

  /**
   * Valida CNPJ usando algoritmo de dígito verificador
   */
  private isValidCNPJ(cnpj: string): boolean {
    // Remove formatação
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;

    // CNPJ com todos os dígitos iguais é inválido
    if (/^(\d)\1{13}$/.test(clean)) return false;

    // Validar primeiro dígito verificador
    let sum = 0;
    const multiplier1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean[i]) * multiplier1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(clean[12]) !== digit1) return false;

    // Validar segundo dígito verificador
    sum = 0;
    const multiplier2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(clean[i]) * multiplier2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(clean[13]) !== digit2) return false;

    return true;
  }

  /**
   * Valida um campo específico
   */
  public validateField(fieldPath: string, value: any, fullData: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validações específicas por caminho
    switch (fieldPath) {
      case 'descritor.responsavel.cpf':
        if (!this.isValidCPF(value)) {
          errors.push({
            path: fieldPath,
            field: 'cpf',
            message: 'CPF inválido',
            value,
            rule: 'cpf.invalid',
            severity: 'critical',
          });
        }
        break;

      case 'descritor.responsavel.email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({
            path: fieldPath,
            field: 'email',
            message: 'Email inválido',
            value,
            rule: 'email.invalid',
            severity: 'error',
          });
        }
        break;

      // Adicione mais validações específicas conforme necessário
    }

    return errors;
  }
}

export default new AUDESPValidator();
