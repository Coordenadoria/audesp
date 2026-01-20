import { ExtractedField } from './OCRService';

export interface FieldMapping {
  formField: string; // Campo do formulário AUDESP
  extractedField: ExtractedField;
  matchConfidence: number;
  suggestions: string[]; // Sugestões de valores similares
}

export interface FieldExtractionResult {
  mappings: FieldMapping[];
  unmappedFields: ExtractedField[];
  completionPercentage: number;
  requiredFieldsMissing: string[];
}

export class FieldExtractor {
  private static instance: FieldExtractor;

  // Mapeamento de campos AUDESP e seus padrões
  private fieldPatterns = {
    // Identificação
    cnpj: {
      patterns: [/CNPJ[:\s]*([0-9./-]+)/i, /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/],
      required: true,
    },
    cpf: {
      patterns: [/CPF[:\s]*([0-9./-]+)/i, /(\d{3}\.\d{3}\.\d{3}-\d{2})/],
      required: false,
    },
    razaoSocial: {
      patterns: [/razão social[:\s]*([^\n]+)/i, /empresa[:\s]*([^\n]+)/i],
      required: true,
    },

    // Documentos
    numeroNF: {
      patterns: [/NF[:\s]*([0-9]+)/i, /número.*nf[:\s]*([0-9]+)/i],
      required: false,
    },
    serieNF: {
      patterns: [/série[:\s]*([0-9]+)/i],
      required: false,
    },
    dataEmissao: {
      patterns: [
        /data[:\s]*emissão[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
        /emissão[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
      ],
      required: false,
    },
    dataVencimento: {
      patterns: [
        /vencimento[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
        /data.*vencimento[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
      ],
      required: false,
    },

    // Valores
    valorTotal: {
      patterns: [
        /total[:\s]*(R\$\s*[\d.,]+)/i,
        /valor[:\s]*(R\$\s*[\d.,]+)/i,
        /total[:\s]*([\d.,]+)/i,
      ],
      required: false,
    },
    valorBruto: {
      patterns: [/bruto[:\s]*(R\$\s*[\d.,]+)/i, /valor bruto[:\s]*([\d.,]+)/i],
      required: false,
    },
    impostos: {
      patterns: [/impostos[:\s]*(R\$\s*[\d.,]+)/i, /total impostos[:\s]*([\d.,]+)/i],
      required: false,
    },

    // Descrição
    descricao: {
      patterns: [
        /descrição[:\s]*([^\n]+)/i,
        /serviço[:\s]*([^\n]+)/i,
        /objeto[:\s]*([^\n]+)/i,
      ],
      required: false,
    },
  };

  private constructor() {}

  static getInstance(): FieldExtractor {
    if (!this.instance) {
      this.instance = new FieldExtractor();
    }
    return this.instance;
  }

  /**
   * Extrair e mapear campos do texto OCR para campos AUDESP
   */
  extractAndMap(ocrText: string, extractedFields: ExtractedField[]): FieldExtractionResult {
    const mappings: FieldMapping[] = [];
    const unmappedFields: ExtractedField[] = [...extractedFields];
    const requiredFieldsMissing: string[] = [];

    // Tentar mapear cada campo AUDESP
    Object.entries(this.fieldPatterns).forEach(([fieldName, config]) => {
      const patterns = config.patterns as RegExp[];

      for (const pattern of patterns) {
        const match = ocrText.match(pattern);
        if (match) {
          const value = match[1] || match[0];

          // Encontrar o campo extraído correspondente
          const relatedField = this.findRelatedExtractedField(
            fieldName,
            value,
            extractedFields
          );

          mappings.push({
            formField: fieldName,
            extractedField: relatedField || {
              name: fieldName,
              value: value.trim(),
              confidence: 0.8,
              type: this.inferFieldType(fieldName),
              rawText: value,
            },
            matchConfidence: relatedField ? 0.95 : 0.7,
            suggestions: this.getSuggestions(fieldName, ocrText, extractedFields),
          });

          // Remover do unmapped
          const idx = unmappedFields.indexOf(relatedField!);
          if (idx > -1) {
            unmappedFields.splice(idx, 1);
          }

          break; // Usar primeira correspondência
        }
      }

      // Adicionar a required fields missing
      if (config.required && !mappings.find((m) => m.formField === fieldName)) {
        requiredFieldsMissing.push(fieldName);
      }
    });

    // Calcular % de preenchimento
    const totalFields = Object.keys(this.fieldPatterns).length;
    const filledFields = mappings.length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    return {
      mappings,
      unmappedFields,
      completionPercentage,
      requiredFieldsMissing,
    };
  }

  /**
   * Encontrar campo extraído relacionado ao campo AUDESP
   */
  private findRelatedExtractedField(
    audeField: string,
    value: string,
    extractedFields: ExtractedField[]
  ): ExtractedField | undefined {
    const fieldTypeMap: { [key: string]: string[] } = {
      cnpj: ['cnpj'],
      cpf: ['cpf'],
      razaoSocial: ['text'],
      numeroNF: ['number'],
      serieNF: ['number'],
      dataEmissao: ['date'],
      dataVencimento: ['date'],
      valorTotal: ['money'],
      valorBruto: ['money'],
      impostos: ['money'],
      descricao: ['text'],
    };

    const expectedTypes = fieldTypeMap[audeField] || [];
    return extractedFields.find((f) =>
      expectedTypes.includes(f.type)
    );
  }

  /**
   * Inferir tipo do campo AUDESP
   */
  private inferFieldType(fieldName: string): ExtractedField['type'] {
    if (fieldName.includes('cnpj')) return 'cnpj';
    if (fieldName.includes('cpf')) return 'cpf';
    if (fieldName.includes('data')) return 'date';
    if (fieldName.includes('valor') || fieldName.includes('impostos')) return 'money';
    if (fieldName.includes('numero')) return 'number';
    return 'text';
  }

  /**
   * Gerar sugestões adicionais para um campo
   */
  private getSuggestions(
    fieldName: string,
    ocrText: string,
    extractedFields: ExtractedField[]
  ): string[] {
    const suggestions: string[] = [];

    // Sugestões baseadas em campos similares
    const allValues = extractedFields
      .filter((f) => {
        const expectedType = this.inferFieldType(fieldName);
        return f.type === expectedType;
      })
      .map((f) => f.value);

    if (allValues.length > 0) {
      suggestions.push(...allValues.slice(0, 3));
    }

    // Sugestões baseadas em contexto
    if (fieldName.includes('descricao')) {
      const lines = ocrText.split('\n').filter((l) => l.length > 10 && l.length < 200);
      suggestions.push(...lines.slice(0, 2));
    }

    return suggestions.filter((s, i) => suggestions.indexOf(s) === i);
  }

  /**
   * Validar se campos obrigatórios foram preenchidos
   */
  validateRequiredFields(result: FieldExtractionResult): {
    isValid: boolean;
    errors: string[];
  } {
    const errors = result.requiredFieldsMissing.map(
      (field) => `Campo obrigatório não encontrado: ${field}`
    );

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Limpar e normalizar valor extraído
   */
  normalizeValue(value: string, fieldType: string): string {
    let normalized = value.trim();

    if (fieldType === 'money') {
      // Remove R$, espaços e converte para padrão
      normalized = normalized
        .replace(/[^\d,]/g, '')
        .replace(',', '.')
        .replace(/\./g, '')
        .replace(/(\d{2})$/, '.$1');
    } else if (fieldType === 'date') {
      // Converte para formato DD/MM/YYYY
      const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
      const match = normalized.match(dateRegex);
      if (match) {
        const [, day, month, year] = match;
        normalized = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    } else if (fieldType === 'cnpj' || fieldType === 'cpf') {
      // Remove formatação
      normalized = normalized.replace(/[^\d]/g, '');
      if (fieldType === 'cnpj' && normalized.length === 14) {
        normalized = normalized.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      } else if (fieldType === 'cpf' && normalized.length === 11) {
        normalized = normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }

    return normalized;
  }

  /**
   * Gerar relatório de extração
   */
  generateExtractionReport(result: FieldExtractionResult): string {
    let report = '📋 RELATÓRIO DE EXTRAÇÃO DE CAMPOS\n';
    report += '='.repeat(50) + '\n\n';

    report += `✅ Taxa de Preenchimento: ${result.completionPercentage}%\n`;
    report += `📊 Campos Mapeados: ${result.mappings.length}\n`;
    report += `❌ Campos Faltando: ${result.requiredFieldsMissing.length}\n`;
    report += `⚠️  Campos Não Mapeados: ${result.unmappedFields.length}\n\n`;

    if (result.mappings.length > 0) {
      report += '🔍 CAMPOS EXTRAÍDOS:\n';
      report += '-'.repeat(50) + '\n';
      result.mappings.forEach((m) => {
        report += `• ${m.formField}: "${m.extractedField.value}"\n`;
        report += `  Confiança: ${m.matchConfidence * 100}%\n`;
      });
    }

    if (result.requiredFieldsMissing.length > 0) {
      report += '\n⛔ CAMPOS OBRIGATÓRIOS FALTANDO:\n';
      report += '-'.repeat(50) + '\n';
      result.requiredFieldsMissing.forEach((f) => {
        report += `• ${f}\n`;
      });
    }

    return report;
  }
}

export default FieldExtractor.getInstance();
