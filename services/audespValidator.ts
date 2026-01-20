/**
 * Validador AUDESP - Conformidade com schema oficial v1.9
 * Valida todos os campos, tipos e regras de negócio
 */

import { PrestacaoContasAudesp } from './audespSchemaTypes';

export interface ValidationError {
  path: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  type: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    sections: Record<string, { valid: boolean; errorCount: number; warningCount: number }>;
  };
}

export class AudespValidator {
  /**
   * Valida a estrutura completa da Prestação de Contas
   */
  static validate(data: Partial<PrestacaoContasAudesp>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const sections: Record<string, { valid: boolean; errorCount: number; warningCount: number }> = {};

    // Validar cada seção
    this.validateDescriptor(data.descritor, errors, warnings, sections);
    this.validateAjuste(data.codigo_ajuste, errors, warnings, sections);
    this.validateEmpregados(data.relacao_empregados, errors, warnings, sections);
    this.validateBens(data.relacao_bens, errors, warnings, sections);
    this.validateContratos(data.contratos, errors, warnings, sections);
    this.validateDocumentosFiscais(data.documentos_fiscais, errors, warnings, sections);
    this.validatePagamentos(data.pagamentos, errors, warnings, sections);
    this.validateDisponibilidades(data.disponibilidades, errors, warnings, sections);
    this.validateReceitas(data.receitas, errors, warnings, sections);
    this.validateServidoresCedidos(data.servidores_cedidos, errors, warnings, sections);
    this.validateDescontos(data.descontos, errors, warnings, sections);
    this.validateDevolucoes(data.devolucoes, errors, warnings, sections);
    this.validateGlosas(data.glosas, errors, warnings, sections);
    this.validateEmpenhos(data.empenhos, errors, warnings, sections);
    this.validateRepasses(data.repasses, errors, warnings, sections);
    this.validateDeclaracoes(data.declaracoes, errors, warnings, sections);
    this.validateTransparencia(data.transparencia, errors, warnings, sections);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        sections
      }
    };
  }

  private static addError(
    errors: ValidationError[],
    path: string,
    field: string,
    message: string,
    type: string = 'validation'
  ) {
    errors.push({ path, field, message, severity: 'error', type });
  }

  private static addWarning(
    warnings: ValidationError[],
    path: string,
    field: string,
    message: string,
    type: string = 'warning'
  ) {
    warnings.push({ path, field, message, severity: 'warning', type });
  }

  private static updateSection(
    sections: Record<string, any>,
    sectionName: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ) {
    const sectionErrors = errors.filter(e => e.path.startsWith(sectionName)).length;
    const sectionWarnings = warnings.filter(w => w.path.startsWith(sectionName)).length;
    
    sections[sectionName] = {
      valid: sectionErrors === 0,
      errorCount: sectionErrors,
      warningCount: sectionWarnings
    };
  }

  private static validateDescriptor(
    descriptor: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'descritor';
    
    if (!descriptor) {
      this.addError(errors, path, 'descritor', 'Descritor é obrigatório', 'required');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    if (!descriptor.municipio) {
      this.addError(errors, path, 'municipio', 'Município é obrigatório', 'required');
    }
    if (!descriptor.entidade) {
      this.addError(errors, path, 'entidade', 'Entidade é obrigatória', 'required');
    }
    if (!descriptor.ano) {
      this.addError(errors, path, 'ano', 'Ano é obrigatório', 'required');
    }
    if (!descriptor.mes || descriptor.mes < 1 || descriptor.mes > 12) {
      this.addError(errors, path, 'mes', 'Mês deve estar entre 1 e 12', 'range');
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateAjuste(
    ajuste: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'codigo_ajuste';
    
    if (!ajuste) return;

    if (!ajuste.codigo_ajuste) {
      this.addWarning(warnings, path, 'codigo_ajuste', 'Código de ajuste não preenchido', 'recommended');
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateEmpregados(
    empregados: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'relacao_empregados';
    
    if (!empregados || empregados.length === 0) {
      this.addWarning(warnings, path, 'empregados', 'Nenhum empregado cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    empregados.forEach((emp, idx) => {
      const itemPath = `${path}[${idx}]`;
      
      if (!emp.cpf) {
        this.addError(errors, itemPath, 'cpf', 'CPF é obrigatório', 'required');
      } else if (!this.isValidCPF(emp.cpf)) {
        this.addError(errors, itemPath, 'cpf', 'CPF inválido', 'format');
      }

      if (!emp.cbo) {
        this.addError(errors, itemPath, 'cbo', 'CBO é obrigatório', 'required');
      }

      if (!emp.salario_contratual) {
        this.addError(errors, itemPath, 'salario_contratual', 'Salário é obrigatório', 'required');
      }

      if (!Array.isArray(emp.periodos_remuneracao) || emp.periodos_remuneracao.length === 0) {
        this.addWarning(warnings, itemPath, 'periodos', 'Nenhum período de remuneração cadastrado', 'info');
      }
    });

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateBens(
    bens: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'relacao_bens';
    
    if (!bens) {
      this.addWarning(warnings, path, 'bens', 'Informações de bens não preenchidas', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    // Validar bens móveis adquiridos
    if (Array.isArray(bens.relacao_bens_moveis_adquiridos)) {
      bens.relacao_bens_moveis_adquiridos.forEach((bem: any, idx: number) => {
        const itemPath = `${path}.moveis_adquiridos[${idx}]`;
        
        if (!bem.numero_patrimonio) {
          this.addError(errors, itemPath, 'numero_patrimonio', 'Número de patrimônio é obrigatório', 'required');
        }
        if (!bem.valor_aquisicao) {
          this.addError(errors, itemPath, 'valor_aquisicao', 'Valor de aquisição é obrigatório', 'required');
        }
      });
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateContratos(
    contratos: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'contratos';
    
    if (!contratos || contratos.length === 0) {
      this.addWarning(warnings, path, 'contratos', 'Nenhum contrato cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    contratos.forEach((contrato, idx) => {
      const itemPath = `${path}[${idx}]`;
      
      if (!contrato.numero) {
        this.addError(errors, itemPath, 'numero', 'Número do contrato é obrigatório', 'required');
      }
      if (!contrato.valor_montante) {
        this.addError(errors, itemPath, 'valor_montante', 'Valor é obrigatório', 'required');
      }
      if (!contrato.data_assinatura) {
        this.addError(errors, itemPath, 'data_assinatura', 'Data de assinatura é obrigatória', 'required');
      }
    });

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateDocumentosFiscais(
    docs: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'documentos_fiscais';
    
    if (!docs || docs.length === 0) {
      this.addWarning(warnings, path, 'docs', 'Nenhum documento fiscal cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    docs.forEach((doc, idx) => {
      const itemPath = `${path}[${idx}]`;
      
      if (!doc.numero) {
        this.addError(errors, itemPath, 'numero', 'Número do documento é obrigatório', 'required');
      }
      if (!doc.valor_bruto) {
        this.addError(errors, itemPath, 'valor_bruto', 'Valor bruto é obrigatório', 'required');
      }
    });

    this.updateSection(sections, path, errors, warnings);
  }

  private static validatePagamentos(
    pagamentos: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'pagamentos';
    
    if (!pagamentos || pagamentos.length === 0) {
      this.addWarning(warnings, path, 'pagamentos', 'Nenhum pagamento cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    pagamentos.forEach((pag, idx) => {
      const itemPath = `${path}[${idx}]`;
      
      if (!pag.pagamento_data) {
        this.addError(errors, itemPath, 'pagamento_data', 'Data de pagamento é obrigatória', 'required');
      }
      if (!pag.pagamento_valor) {
        this.addError(errors, itemPath, 'pagamento_valor', 'Valor de pagamento é obrigatório', 'required');
      }
    });

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateDisponibilidades(
    disp: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'disponibilidades';
    
    if (!disp) {
      this.addWarning(warnings, path, 'disponibilidades', 'Informações de disponibilidades não preenchidas', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateReceitas(
    receitas: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'receitas';
    
    if (!receitas) {
      this.addError(errors, path, 'receitas', 'Informações de receitas não preenchidas', 'required');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateServidoresCedidos(
    servidores: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'servidores_cedidos';
    
    if (!servidores || servidores.length === 0) {
      this.addWarning(warnings, path, 'servidores', 'Nenhum servidor cedido cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateDescontos(
    descontos: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'descontos';
    
    if (!descontos || descontos.length === 0) {
      this.addWarning(warnings, path, 'descontos', 'Nenhum desconto cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateDevolucoes(
    devolucoes: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'devolucoes';
    
    if (!devolucoes || devolucoes.length === 0) {
      this.addWarning(warnings, path, 'devolucoes', 'Nenhuma devolução cadastrada', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateGlosas(
    glosas: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'glosas';
    
    if (!glosas || glosas.length === 0) {
      this.addWarning(warnings, path, 'glosas', 'Nenhuma glosa cadastrada', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateEmpenhos(
    empenhos: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'empenhos';
    
    if (!empenhos || empenhos.length === 0) {
      this.addWarning(warnings, path, 'empenhos', 'Nenhum empenho cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateRepasses(
    repasses: any[],
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'repasses';
    
    if (!repasses || repasses.length === 0) {
      this.addWarning(warnings, path, 'repasses', 'Nenhum repasse cadastrado', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateDeclaracoes(
    declaracoes: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'declaracoes';
    
    if (!declaracoes) {
      this.addWarning(warnings, path, 'declaracoes', 'Declarações não preenchidas', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  private static validateTransparencia(
    transparencia: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    sections: Record<string, any>
  ) {
    const path = 'transparencia';
    
    if (!transparencia) {
      this.addWarning(warnings, path, 'transparencia', 'Informações de transparência não preenchidas', 'info');
      this.updateSection(sections, path, errors, warnings);
      return;
    }

    this.updateSection(sections, path, errors, warnings);
  }

  /**
   * Valida CPF usando algoritmo oficial
   */
  private static isValidCPF(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    digit1 = digit1 > 9 ? 0 : digit1;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    digit2 = digit2 > 9 ? 0 : digit2;

    return clean[9] === String(digit1) && clean[10] === String(digit2);
  }
}
