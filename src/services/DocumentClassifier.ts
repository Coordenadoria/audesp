import { ExtractedField } from './OCRService';

export interface ClassificationResult {
  type: 'nf' | 'contrato' | 'comprovante' | 'desconhecido';
  confidence: number;
  category: string;
  suggestion: string;
  matchedPatterns: string[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  documentType: string;
  classificationType: string;
  extractedFields: ExtractedField[];
  ocrConfidence: number;
}

export class DocumentClassifier {
  private static instance: DocumentClassifier;

  private constructor() {}

  static getInstance(): DocumentClassifier {
    if (!this.instance) {
      this.instance = new DocumentClassifier();
    }
    return this.instance;
  }

  /**
   * Classificar documento com base em metadados e texto
   */
  classify(fileName: string, ocrText: string, extractedFields: ExtractedField[]): ClassificationResult {
    const fileExtension = this.getFileExtension(fileName);
    const matchedPatterns: string[] = [];
    let confidence = 0.5;
    let type: 'nf' | 'contrato' | 'comprovante' | 'desconhecido' = 'desconhecido';
    let category = 'Documento genérico';
    let suggestion = 'Verifique manualmente o tipo de documento';

    // Verificação 1: Extensão do arquivo
    if (fileExtension === 'nf' || fileName.toLowerCase().includes('nota')) {
      type = 'nf';
      confidence += 0.3;
      matchedPatterns.push('Nome de arquivo sugere NF');
    }

    // Verificação 2: Padrões de texto
    const textLower = ocrText.toLowerCase();

    // NF Keywords
    const nfKeywords = ['nota fiscal', 'nf-e', 'danfe', 'cfop', 'icms', 'pis', 'cofins', 'número nf'];
    const nfMatches = nfKeywords.filter((kw) => textLower.includes(kw));
    if (nfMatches.length > 0) {
      type = 'nf';
      confidence += 0.2 * nfMatches.length;
      matchedPatterns.push(`Palavras-chave encontradas: ${nfMatches.join(', ')}`);
    }

    // Contrato Keywords
    const contractKeywords = [
      'contrato',
      'contratante',
      'contratada',
      'objeto do contrato',
      'vigência',
      'cláusula',
      'valor total',
    ];
    const contractMatches = contractKeywords.filter((kw) => textLower.includes(kw));
    if (contractMatches.length > 0) {
      type = 'contrato';
      confidence += 0.2 * contractMatches.length;
      matchedPatterns.push(`Palavras-chave de contrato: ${contractMatches.join(', ')}`);
    }

    // Comprovante Keywords
    const proofKeywords = ['comprovante', 'recebimento', 'pagamento', 'transferência', 'depósito', 'boleto'];
    const proofMatches = proofKeywords.filter((kw) => textLower.includes(kw));
    if (proofMatches.length > 0) {
      type = 'comprovante';
      confidence += 0.2 * proofMatches.length;
      matchedPatterns.push(`Palavras-chave de comprovante: ${proofMatches.join(', ')}`);
    }

    // Verificação 3: Campos extraídos
    const fieldTypes = extractedFields.map((f) => f.type);
    const hasCNPJ = fieldTypes.includes('cnpj');
    const hasCPF = fieldTypes.includes('cpf');
    const hasDate = fieldTypes.includes('date');
    const hasMoney = fieldTypes.includes('money');

    if (hasCNPJ && hasMoney) {
      if (type === 'desconhecido') {
        type = 'nf';
        category = 'Nota Fiscal';
        suggestion = 'Documento parece ser uma Nota Fiscal';
      }
      confidence += 0.1;
      matchedPatterns.push('Contém CNPJ e valores');
    }

    if (hasCPF && hasDate) {
      if (type === 'desconhecido') {
        type = 'comprovante';
        category = 'Comprovante';
        suggestion = 'Documento parece ser um comprovante de pagamento';
      }
      confidence += 0.1;
      matchedPatterns.push('Contém CPF e data');
    }

    // Normalizar confidence para 0-1
    confidence = Math.min(confidence, 1.0);
    confidence = Math.max(confidence, 0.0);

    // Atualizar categoria e sugestão baseado no tipo detectado
    if (type === 'nf') {
      category = 'Nota Fiscal';
      suggestion = 'Linkado para seção: Receitas / Notas Fiscais';
    } else if (type === 'contrato') {
      category = 'Contrato';
      suggestion = 'Linkado para seção: Documentos / Contratos';
    } else if (type === 'comprovante') {
      category = 'Comprovante de Pagamento';
      suggestion = 'Linkado para seção: Comprovantes / Pagamentos';
    }

    return {
      type,
      confidence: Math.round(confidence * 100) / 100,
      category,
      suggestion,
      matchedPatterns,
    };
  }

  /**
   * Sugerir qual seção do formulário o documento pertence
   */
  suggestFormSection(classification: ClassificationResult): {
    section: string;
    subsection?: string;
    fields: string[];
  } {
    const suggestions = {
      nf: {
        section: 'Receitas',
        subsection: 'Notas Fiscais Emitidas',
        fields: ['cnpj', 'dataEmissao', 'valorTotal', 'descricaoServico'],
      },
      contrato: {
        section: 'Documentos Suportes',
        subsection: 'Contratos',
        fields: ['cnpj', 'dataVigencia', 'valorContrato', 'objeto'],
      },
      comprovante: {
        section: 'Comprovantes',
        subsection: 'Pagamentos',
        fields: ['cpf', 'cnpj', 'dataPagamento', 'valorPago'],
      },
      desconhecido: {
        section: 'Documentos Diversos',
        subsection: undefined,
        fields: [],
      },
    };

    return suggestions[classification.type] || suggestions.desconhecido;
  }

  /**
   * Gerar metadados completos do documento
   */
  generateMetadata(
    file: File,
    ocrText: string,
    extractedFields: ExtractedField[],
    ocrConfidence: number
  ): DocumentMetadata {
    const classification = this.classify(file.name, ocrText, extractedFields);

    return {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      documentType: classification.type,
      classificationType: classification.category,
      extractedFields,
      ocrConfidence,
    };
  }

  /**
   * Validar se documento é válido para processamento
   */
  validateDocument(
    file: File,
    ocrConfidence: number
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar tipo de arquivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      errors.push(`Tipo de arquivo não suportado: ${file.type}`);
    }

    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      errors.push('Arquivo muito grande (máximo 50MB)');
    }

    // Validar OCR confidence
    if (ocrConfidence < 0.5) {
      errors.push('Qualidade do OCR muito baixa (< 50%)');
    } else if (ocrConfidence < 0.7) {
      warnings.push('Qualidade do OCR moderada. Recomenda-se verificação manual.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Auxiliar: extrair extensão do arquivo
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Similaridade entre dois valores (para matching de campos)
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Levenshtein distance normalizado
    const len = Math.max(s1.length, s2.length);
    if (len === 0) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / len;
  }

  /**
   * Calcular distância de Levenshtein entre duas strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const track = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(0));

    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[s2.length][s1.length];
  }
}

export default DocumentClassifier.getInstance();
