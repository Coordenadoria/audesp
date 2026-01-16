/**
 * SERVIÇO DE IA AVANÇADA PARA PROCESSAMENTO EM LOTE DE PDFs
 * Usa APIs mais avançadas (Claude, GPT-4V)
 * Extrai informações automaticamente e sugere preenchimento
 */

export interface ExtractedDocument {
  filename: string;
  type: 'edital' | 'licitacao' | 'ata' | 'contrato' | 'empenho' | 'pagamento' | 'outro';
  confidence: number;
  extractedData: {
    [key: string]: any;
  };
  suggestedFields: {
    field: string;
    value: string;
    confidence: number;
  }[];
  rawText: string;
}

export interface BatchProcessingResult {
  totalFiles: number;
  processedFiles: number;
  extractedDocuments: ExtractedDocument[];
  summary: {
    estimatedCompleteness: number;
    suggestedNextSteps: string[];
    warnings: string[];
  };
}

export class AdvancedPDFService {
  private static anthropicApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  private static openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  /**
   * Processar lote de PDFs com IA avançada
   * Usa Claude 3.5 Sonnet (modelo mais avançado disponível)
   */
  static async processBatchPDFs(files: File[]): Promise<BatchProcessingResult> {
    console.log(`[AI] Iniciando processamento em lote de ${files.length} PDFs`);

    const results: ExtractedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        console.log(`[AI] Processando arquivo ${i + 1}/${files.length}: ${files[i].name}`);
        const extracted = await this.processDocument(files[i]);
        results.push(extracted);
      } catch (error: any) {
        console.error(`[AI] Erro ao processar ${files[i].name}:`, error);
        results.push({
          filename: files[i].name,
          type: 'outro',
          confidence: 0,
          extractedData: {},
          suggestedFields: [],
          rawText: '',
        });
      }
    }

    return this.generateBatchSummary(results);
  }

  /**
   * Processar um documento individual
   */
  private static async processDocument(file: File): Promise<ExtractedDocument> {
    // 1. Converter PDF para texto
    const text = await this.extractTextFromPDF(file);

    // 2. Classificar documento
    const docType = await this.classifyDocument(text);

    // 3. Extrair campos estruturados
    const extractedData = await this.extractStructuredData(text, docType);

    // 4. Gerar sugestões
    const suggestedFields = await this.generateSuggestions(text, extractedData, docType);

    return {
      filename: file.name,
      type: docType,
      confidence: this.calculateConfidence(extractedData),
      extractedData,
      suggestedFields,
      rawText: text
    };
  }

  /**
   * Extrair texto de PDF (browser-based)
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Usar PDFjs Worker para extrair texto
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('PDFjs não carregado');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
      }

      return text;
    } catch (error) {
      console.warn('[PDF] PDFjs não disponível, usando fallback');
      return `Não foi possível extrair texto de ${file.name}`;
    }
  }

  /**
   * Classificar documento usando Claude 3.5 Sonnet
   */
  private static async classifyDocument(
    text: string
  ): Promise<ExtractedDocument['type']> {
    if (!this.anthropicApiKey) {
      return this.classifyDocumentLocally(text);
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: `Classifique este documento em uma destas categorias: edital, licitacao, ata, contrato, empenho, pagamento, outro.

Texto do documento (primeiros 2000 caracteres):
${text.substring(0, 2000)}

Responda apenas com uma palavra da lista acima, sem explicação.`
            }
          ]
        })
      });

      const data = await response.json();
      const classification = data.content[0].text.toLowerCase().trim();

      const validTypes: ExtractedDocument['type'][] = [
        'edital',
        'licitacao',
        'ata',
        'contrato',
        'empenho',
        'pagamento',
        'outro'
      ];

      return validTypes.includes(classification as any)
        ? (classification as ExtractedDocument['type'])
        : this.classifyDocumentLocally(text);
    } catch (error) {
      console.error('[AI] Erro ao classificar com Claude:', error);
      return this.classifyDocumentLocally(text);
    }
  }

  /**
   * Classificação local (fallback)
   */
  private static classifyDocumentLocally(text: string): ExtractedDocument['type'] {
    const lower = text.toLowerCase();

    if (lower.includes('edital')) return 'edital';
    if (lower.includes('licitação') || lower.includes('licitacao')) return 'licitacao';
    if (lower.includes('ata')) return 'ata';
    if (lower.includes('contrato')) return 'contrato';
    if (lower.includes('empenho')) return 'empenho';
    if (lower.includes('pagamento')) return 'pagamento';

    return 'outro';
  }

  /**
   * Extrair dados estruturados com Claude
   */
  private static async extractStructuredData(
    text: string,
    docType: ExtractedDocument['type']
  ): Promise<Record<string, any>> {
    if (!this.anthropicApiKey) {
      return this.extractDataLocally(text, docType);
    }

    try {
      const prompt = this.buildExtractionPrompt(text, docType);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const jsonStr = data.content[0].text;

      try {
        return JSON.parse(jsonStr);
      } catch {
        return this.extractDataLocally(text, docType);
      }
    } catch (error) {
      console.error('[AI] Erro ao extrair dados:', error);
      return this.extractDataLocally(text, docType);
    }
  }

  /**
   * Construir prompt de extração
   */
  private static buildExtractionPrompt(text: string, docType: string): string {
    const fieldsByType: Record<string, string[]> = {
      edital: [
        'numero_edital',
        'data_publicacao',
        'modalidade',
        'objeto',
        'valor_estimado',
        'data_abertura'
      ],
      licitacao: [
        'numero_processo',
        'data',
        'vencedor',
        'valor_contratado',
        'modalidade'
      ],
      ata: ['data_assinatura', 'signatarios', 'objeto', 'valor'],
      contrato: [
        'numero_contrato',
        'data_assinatura',
        'partes',
        'vigencia',
        'valor',
        'objeto'
      ],
      empenho: [
        'numero_empenho',
        'data',
        'valor',
        'favorecido',
        'descricao'
      ],
      pagamento: [
        'data_pagamento',
        'valor',
        'beneficiario',
        'numero_nota',
        'referencia'
      ],
      outro: ['informacoes_principais', 'valores', 'datas']
    };

    const fields = fieldsByType[docType] || fieldsByType['outro'];

    return `Extraia os seguintes campos deste documento ${docType}:
${fields.map((f) => `- ${f}`).join('\n')}

Documento:
${text.substring(0, 3000)}

Responda em JSON válido com os campos extraídos. Se um campo não for encontrado, use null.
Exemplo: {"numero_contrato": "123/2024", "valor": 50000.00}`;
  }

  /**
   * Extração local (regex)
   */
  private static extractDataLocally(
    text: string,
    _docType: string
  ): Record<string, any> {
    const data: Record<string, any> = {};

    // Padrões de regex comuns
    const patterns = {
      cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
      cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
      valores: /R\$\s*[\d.,]+/g,
      datas: /\d{2}\/\d{2}\/\d{4}/g,
      numeros: /[Nº#]\s*(\d+)/g
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        data[key] = matches.slice(0, 5); // Primeiros 5 matches
      }
    }

    return data;
  }

  /**
   * Gerar sugestões de preenchimento
   */
  private static async generateSuggestions(
    text: string,
    extractedData: Record<string, any>,
    docType: string
  ): Promise<ExtractedDocument['suggestedFields']> {
    const suggestions: ExtractedDocument['suggestedFields'] = [];

    // Sugestões baseadas em dados extraídos
    for (const [key, value] of Object.entries(extractedData)) {
      if (value && Array.isArray(value) && value.length > 0) {
        suggestions.push({
          field: key,
          value: String(value[0]),
          confidence: 0.85
        });
      } else if (value && value !== null) {
        suggestions.push({
          field: key,
          value: String(value),
          confidence: 0.8
        });
      }
    }

    return suggestions.slice(0, 10); // Máximo 10 sugestões
  }

  /**
   * Calcular confiança geral
   */
  private static calculateConfidence(extractedData: Record<string, any>): number {
    const fields = Object.keys(extractedData).length;
    const filledFields = Object.values(extractedData).filter((v) => v !== null).length;

    return fields > 0 ? filledFields / fields : 0;
  }

  /**
   * Gerar resumo do processamento em lote
   */
  private static generateBatchSummary(
    results: ExtractedDocument[]
  ): BatchProcessingResult {
    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / Math.max(results.length, 1);

    const totalSuggestedFields = results.reduce((sum, r) => sum + r.suggestedFields.length, 0);

    return {
      totalFiles: results.length,
      processedFiles: results.filter((r) => r.confidence > 0).length,
      extractedDocuments: results,
      summary: {
        estimatedCompleteness: avgConfidence,
        suggestedNextSteps: [
          'Revisar campos extraídos automaticamente',
          totalSuggestedFields > 0
            ? `${totalSuggestedFields} campos sugeridos para preenchimento`
            : 'Nenhuma sugestão automática disponível',
          'Validar dados críticos antes de enviar'
        ],
        warnings:
          avgConfidence < 0.5
            ? [
                'Baixa confiança na extração. Revise manualmente os dados extraídos.'
              ]
            : []
      }
    };
  }
}

export default AdvancedPDFService;
