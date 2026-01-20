// backend/src/services/ValidationService.ts
import Ajv, { JSONSchemaType } from 'ajv';
import { logger } from '../config/logger';

/**
 * Camadas de Validação:
 * 1. Type Validation - Valida tipos básicos (string, number, boolean, date, array)
 * 2. Enum Validation - Valida valores de enum
 * 3. Regex Patterns - Valida padrões (CPF, CNPJ, email, data)
 * 4. Accounting Rules - Valida regras contábeis (equação fundamental)
 * 5. Referential Integrity - Valida integridade referencial
 * 6. TCE-SP Conformance - Valida conformidade TCE-SP
 * 7. LGPD Compliance - Valida conformidade LGPD
 */

export interface ValidationError {
  layer: string;
  code: string;
  message: string;
  path: string;
  value?: any;
}

export interface ValidationWarning {
  layer: string;
  code: string;
  message: string;
  path: string;
}

export interface ValidationResult {
  valido: boolean;
  erros: ValidationError[];
  avisos: ValidationWarning[];
}

export class ValidationService {
  private static instance: ValidationService;
  private ajv: Ajv;

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
  }

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * LAYER 1: Type Validation
   * Valida tipos básicos: string, number, boolean, date, array
   */
  private validateTypes(data: any): ValidationError[] {
    const erros: ValidationError[] = [];

    if (data.descritor) {
      const desc = data.descritor;
      if (desc.numero && typeof desc.numero !== 'string') {
        erros.push({
          layer: 'Type Validation',
          code: 'INVALID_TYPE',
          message: 'Número deve ser string',
          path: 'descritor.numero',
          value: desc.numero,
        });
      }
      if (desc.competencia && typeof desc.competencia !== 'string') {
        erros.push({
          layer: 'Type Validation',
          code: 'INVALID_TYPE',
          message: 'Competência deve ser string',
          path: 'descritor.competencia',
          value: desc.competencia,
        });
      }
    }

    if (data.responsaveis && !Array.isArray(data.responsaveis)) {
      erros.push({
        layer: 'Type Validation',
        code: 'INVALID_TYPE',
        message: 'Responsáveis deve ser array',
        path: 'responsaveis',
        value: typeof data.responsaveis,
      });
    }

    if (data.contratos && !Array.isArray(data.contratos)) {
      erros.push({
        layer: 'Type Validation',
        code: 'INVALID_TYPE',
        message: 'Contratos deve ser array',
        path: 'contratos',
        value: typeof data.contratos,
      });
    }

    if (data.saldoInicial !== undefined && typeof data.saldoInicial !== 'number') {
      erros.push({
        layer: 'Type Validation',
        code: 'INVALID_TYPE',
        message: 'Saldo inicial deve ser number',
        path: 'saldoInicial',
        value: typeof data.saldoInicial,
      });
    }

    if (data.saldoFinal !== undefined && typeof data.saldoFinal !== 'number') {
      erros.push({
        layer: 'Type Validation',
        code: 'INVALID_TYPE',
        message: 'Saldo final deve ser number',
        path: 'saldoFinal',
        value: typeof data.saldoFinal,
      });
    }

    return erros;
  }

  /**
   * LAYER 2: Enum Validation
   * Valida valores pré-definidos
   */
  private validateEnums(data: any): ValidationError[] {
    const erros: ValidationError[] = [];

    const statusValidos = ['rascunho', 'validado', 'enviado'];
    if (data.status && !statusValidos.includes(data.status)) {
      erros.push({
        layer: 'Enum Validation',
        code: 'INVALID_ENUM',
        message: `Status deve ser um de: ${statusValidos.join(', ')}`,
        path: 'status',
        value: data.status,
      });
    }

    if (data.contratos && Array.isArray(data.contratos)) {
      data.contratos.forEach((contrato: any, idx: number) => {
        const tiposDocumento = ['NF', 'RPA', 'RECIBO'];
        if (contrato.tipo && !tiposDocumento.includes(contrato.tipo)) {
          erros.push({
            layer: 'Enum Validation',
            code: 'INVALID_ENUM',
            message: `Tipo de documento deve ser um de: ${tiposDocumento.join(', ')}`,
            path: `contratos[${idx}].tipo`,
            value: contrato.tipo,
          });
        }
      });
    }

    if (data.pagamentos && Array.isArray(data.pagamentos)) {
      data.pagamentos.forEach((pagamento: any, idx: number) => {
        const statusPagamento = ['PENDENTE', 'PAGO', 'CANCELADO'];
        if (pagamento.status && !statusPagamento.includes(pagamento.status)) {
          erros.push({
            layer: 'Enum Validation',
            code: 'INVALID_ENUM',
            message: `Status de pagamento deve ser um de: ${statusPagamento.join(', ')}`,
            path: `pagamentos[${idx}].status`,
            value: pagamento.status,
          });
        }
      });
    }

    return erros;
  }

  /**
   * LAYER 3: Regex Patterns
   * Valida CPF, CNPJ, Email, Data
   */
  private validatePatterns(data: any): ValidationError[] {
    const erros: ValidationError[] = [];

    // Validar CPF (11 dígitos)
    const cpfPattern = /^\d{11}$/;
    if (data.descritor?.cpfGestor && !cpfPattern.test(data.descritor.cpfGestor)) {
      erros.push({
        layer: 'Regex Patterns',
        code: 'INVALID_CPF',
        message: 'CPF do gestor deve conter 11 dígitos',
        path: 'descritor.cpfGestor',
        value: data.descritor.cpfGestor,
      });
    }

    if (data.descritor?.cpfResponsavel && !cpfPattern.test(data.descritor.cpfResponsavel)) {
      erros.push({
        layer: 'Regex Patterns',
        code: 'INVALID_CPF',
        message: 'CPF do responsável deve conter 11 dígitos',
        path: 'descritor.cpfResponsavel',
        value: data.descritor.cpfResponsavel,
      });
    }

    // Validar CNPJ (14 dígitos)
    const cnpjPattern = /^\d{14}$/;
    if (data.contratos && Array.isArray(data.contratos)) {
      data.contratos.forEach((contrato: any, idx: number) => {
        if (contrato.cnpjFornecedor && !cnpjPattern.test(contrato.cnpjFornecedor)) {
          erros.push({
            layer: 'Regex Patterns',
            code: 'INVALID_CNPJ',
            message: 'CNPJ do fornecedor deve conter 14 dígitos',
            path: `contratos[${idx}].cnpjFornecedor`,
            value: contrato.cnpjFornecedor,
          });
        }
      });
    }

    // Validar Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.descritor?.emailResponsavel && !emailPattern.test(data.descritor.emailResponsavel)) {
      erros.push({
        layer: 'Regex Patterns',
        code: 'INVALID_EMAIL',
        message: 'Email do responsável é inválido',
        path: 'descritor.emailResponsavel',
        value: data.descritor.emailResponsavel,
      });
    }

    // Validar Data (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (data.descritor?.competencia && !datePattern.test(data.descritor.competencia)) {
      erros.push({
        layer: 'Regex Patterns',
        code: 'INVALID_DATE',
        message: 'Competência deve estar em formato YYYY-MM-DD',
        path: 'descritor.competencia',
        value: data.descritor.competencia,
      });
    }

    // Validar datas em contratos
    if (data.contratos && Array.isArray(data.contratos)) {
      data.contratos.forEach((contrato: any, idx: number) => {
        if (contrato.dataInicio && !datePattern.test(contrato.dataInicio)) {
          erros.push({
            layer: 'Regex Patterns',
            code: 'INVALID_DATE',
            message: 'Data de início deve estar em formato YYYY-MM-DD',
            path: `contratos[${idx}].dataInicio`,
            value: contrato.dataInicio,
          });
        }
        if (contrato.dataFim && !datePattern.test(contrato.dataFim)) {
          erros.push({
            layer: 'Regex Patterns',
            code: 'INVALID_DATE',
            message: 'Data de fim deve estar em formato YYYY-MM-DD',
            path: `contratos[${idx}].dataFim`,
            value: contrato.dataFim,
          });
        }
      });
    }

    return erros;
  }

  /**
   * LAYER 4: Accounting Rules
   * Equação fundamental: Σ Receitas = Σ Despesas
   * Saldo inicial + Receitas - Despesas = Saldo final
   * Retorna tupla [erros, avisos]
   */
  private validateAccountingRules(data: any): [ValidationError[], ValidationWarning[]] {
    const erros: ValidationError[] = [];
    const avisos: ValidationWarning[] = [];

    // Verificar se saldo inicial e final existem para aplicar regra
    if (
      data.saldoInicial !== undefined &&
      data.saldoFinal !== undefined &&
      data.pagamentos &&
      Array.isArray(data.pagamentos)
    ) {
      // Calcular soma de pagamentos
      const totalPagamentos = data.pagamentos.reduce((sum: number, p: any) => {
        return sum + (p.valor || 0);
      }, 0);

      // Equação fundamental: SI + R - D = SF
      // Simplificado para: SI - Pagamentos = SF
      const saldoCalculado = data.saldoInicial - totalPagamentos;
      const diferenca = Math.abs(saldoCalculado - data.saldoFinal);

      // Se diferença maior que 0.01 (arredondamento), erro
      if (diferenca > 0.01) {
        erros.push({
          layer: 'Accounting Rules',
          code: 'INVALID_BALANCE',
          message: `Saldo não bate: SI(${data.saldoInicial}) - Pagamentos(${totalPagamentos}) = ${saldoCalculado}, mas SF = ${data.saldoFinal}`,
          path: 'saldoFinal',
          value: data.saldoFinal,
        });
      }
    }

    // Avisar se saldos negativos
    if (data.saldoInicial !== undefined && data.saldoInicial < 0) {
      avisos.push({
        layer: 'Accounting Rules',
        code: 'NEGATIVE_BALANCE',
        message: 'Saldo inicial é negativo (débito)',
        path: 'saldoInicial',
      });
    }

    return [erros, avisos];
  }

  /**
   * LAYER 5: Referential Integrity
   * Validar referências entre entidades
   */
  private validateReferentialIntegrity(data: any): ValidationError[] {
    const erros: ValidationError[] = [];

    // Se há documentos fiscais, devem referenciar contratos existentes
    if (
      data.documentosFiscais &&
      Array.isArray(data.documentosFiscais) &&
      data.contratos &&
      Array.isArray(data.contratos)
    ) {
      const contratoNumbers = data.contratos.map((c: any) => c.numero);

      data.documentosFiscais.forEach((doc: any, idx: number) => {
        if (doc.numeroContrato && !contratoNumbers.includes(doc.numeroContrato)) {
          erros.push({
            layer: 'Referential Integrity',
            code: 'INVALID_REFERENCE',
            message: `Contrato ${doc.numeroContrato} referenciado em documento não existe`,
            path: `documentosFiscais[${idx}].numeroContrato`,
            value: doc.numeroContrato,
          });
        }
      });
    }

    // Se há pagamentos, devem referenciar documentos existentes
    if (
      data.pagamentos &&
      Array.isArray(data.pagamentos) &&
      data.documentosFiscais &&
      Array.isArray(data.documentosFiscais)
    ) {
      const docNumbers = data.documentosFiscais.map((d: any) => d.numero);

      data.pagamentos.forEach((pag: any, idx: number) => {
        if (pag.numeroDocumento && !docNumbers.includes(pag.numeroDocumento)) {
          erros.push({
            layer: 'Referential Integrity',
            code: 'INVALID_REFERENCE',
            message: `Documento ${pag.numeroDocumento} referenciado em pagamento não existe`,
            path: `pagamentos[${idx}].numeroDocumento`,
            value: pag.numeroDocumento,
          });
        }
      });
    }

    return erros;
  }

  /**
   * LAYER 6: TCE-SP Conformance
   * Validar conformidade com regras TCE-SP
   * Retorna tupla [erros, avisos]
   */
  private validateTceSPConformance(data: any): [ValidationError[], ValidationWarning[]] {
    const erros: ValidationError[] = [];
    const avisos: ValidationWarning[] = [];

    // Descritor é obrigatório
    if (!data.descritor) {
      erros.push({
        layer: 'TCE-SP Conformance',
        code: 'MISSING_REQUIRED',
        message: 'Descritor é obrigatório',
        path: 'descritor',
      });
    } else {
      // Campos obrigatórios no descritor
      const camposObrigatorios = [
        'numero',
        'competencia',
        'nomeGestor',
        'cpfGestor',
        'nomeResponsavel',
        'cpfResponsavel',
      ];
      camposObrigatorios.forEach((campo) => {
        if (!data.descritor[campo]) {
          erros.push({
            layer: 'TCE-SP Conformance',
            code: 'MISSING_REQUIRED',
            message: `Campo obrigatório ausente: descritor.${campo}`,
            path: `descritor.${campo}`,
          });
        }
      });
    }

    // Pelo menos um responsável deve existir
    if (!data.responsaveis || !Array.isArray(data.responsaveis) || data.responsaveis.length === 0) {
      avisos.push({
        layer: 'TCE-SP Conformance',
        code: 'RECOMMENDED_MISSING',
        message: 'Recomenda-se ter pelo menos um responsável registrado',
        path: 'responsaveis',
      });
    }

    // Deve ter saldo inicial e saldo final
    if (data.saldoInicial === undefined) {
      avisos.push({
        layer: 'TCE-SP Conformance',
        code: 'RECOMMENDED_MISSING',
        message: 'Recomenda-se informar saldo inicial',
        path: 'saldoInicial',
      });
    }

    if (data.saldoFinal === undefined) {
      avisos.push({
        layer: 'TCE-SP Conformance',
        code: 'RECOMMENDED_MISSING',
        message: 'Recomenda-se informar saldo final',
        path: 'saldoFinal',
      });
    }

    return [erros, avisos];
  }

  /**
   * LAYER 7: LGPD Compliance
   * Validar conformidade com LGPD
   */
  private validateLGPDCompliance(data: any): ValidationError[] {
    const erros: ValidationError[] = [];

    // CPF presente - verificar consentimento (simplificado)
    if (data.descritor?.cpfGestor || data.descritor?.cpfResponsavel) {
      // Em produção, verificaria com banco de consentimentos
      // Aqui apenas avisamos
      logger.info('Prestação contém dados PII (CPF): deve ter consentimento do titular');
    }

    // Responsáveis com CPF - verificar LGPD
    if (data.responsaveis && Array.isArray(data.responsaveis)) {
      data.responsaveis.forEach((resp: any, idx: number) => {
        if (resp.cpf) {
          logger.info(`Responsável[${idx}] contém CPF: deve ter consentimento LGPD`);
        }
      });
    }

    // Nota: Validação LGPD completa requer:
    // 1. Verificação de consentimento no banco de dados
    // 2. Verificação de direito ao esquecimento
    // 3. Criptografia de PII
    // 4. Auditoria de acesso

    return erros;
  }

  /**
   * Método principal: executar todas as 7 camadas de validação
   */
  async validate(prestacao: any): Promise<ValidationResult> {
    const erros: ValidationError[] = [];
    const avisos: ValidationWarning[] = [];

    try {
      logger.info(`Iniciando validação em 7 camadas para prestação: ${prestacao.id}`);

      // Layer 1: Type Validation
      const errosType = this.validateTypes(prestacao);
      erros.push(...errosType);

      // Layer 2: Enum Validation
      const errosEnum = this.validateEnums(prestacao);
      erros.push(...errosEnum);

      // Layer 3: Regex Patterns
      const errosPattern = this.validatePatterns(prestacao);
      erros.push(...errosPattern);

      // Layer 4: Accounting Rules
      const [errosAccount, avisosAccount] = this.validateAccountingRules(prestacao);
      erros.push(...errosAccount);
      avisos.push(...avisosAccount);

      // Layer 5: Referential Integrity
      const errosRef = this.validateReferentialIntegrity(prestacao);
      erros.push(...errosRef);

      // Layer 6: TCE-SP Conformance
      const [errosTce, avisosTce] = this.validateTceSPConformance(prestacao);
      erros.push(...errosTce);
      avisos.push(...avisosTce);

      // Layer 7: LGPD Compliance
      const errosLGPD = this.validateLGPDCompliance(prestacao);
      erros.push(...errosLGPD);

      const resultado: ValidationResult = {
        valido: erros.length === 0,
        erros,
        avisos,
      };

      logger.info(`Validação concluída: ${resultado.valido ? 'VALIDA' : 'INVALIDA'}`);
      if (erros.length > 0) {
        logger.warn(`Encontrados ${erros.length} erros de validação`);
      }
      if (avisos.length > 0) {
        logger.info(`Encontrados ${avisos.length} avisos de validação`);
      }

      return resultado;
    } catch (error) {
      logger.error(`Erro ao validar prestação: ${error}`);
      throw error;
    }
  }
}

export default ValidationService.getInstance();
