/**
 * ADVANCED OCR SERVICE v2
 * Serviço de OCR ultramoderno com detecção de texto em PDFs
 * 
 * Features:
 * - Suporte a múltiplos formatos (PDF, PNG, JPG)
 * - Detecção automática de estrutura
 * - Confiança de reconhecimento
 * - Processamento assíncrono
 */

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
  language: string;
  processedAt: string;
  duration: number;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type: 'title' | 'paragraph' | 'table' | 'list' | 'number' | 'date' | 'currency' | 'other';
}

export interface OCRProgress {
  pageNumber: number;
  totalPages: number;
  percentage: number;
  currentBlock?: string;
}

// ==================== OCR ENGINE ====================

export class OCRService {
  private static worker: any = null;
  private static isInitialized = false;
  
  /**
   * Inicializa o serviço OCR (Tesseract.js)
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Dynamic import de Tesseract.js
      const { createWorker } = await import('tesseract.js');
      this.worker = await createWorker('por', 1);
      this.isInitialized = true;
      console.log('[OCR] Service initialized');
    } catch (error) {
      console.error('[OCR] Initialization failed:', error);
      throw new Error('OCR não disponível neste navegador');
    }
  }

  /**
   * Processa imagem com OCR
   */
  static async processImage(
    imageData: File | Blob | string,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    await this.initialize();

    const startTime = Date.now();

    try {
      // Converter para formato suportado
      const processedImage = await this.prepareImage(imageData);

      // Rodar OCR
      const result = await this.worker?.recognize(processedImage);

      if (!result) {
        throw new Error('OCR falhou');
      }

      // Processar resultado
      const ocrResult: OCRResult = {
        text: result.data.text || '',
        confidence: (result.data.confidence || 0) / 100,
        blocks: this.extractBlocks(result.data),
        language: 'pt-BR',
        processedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      console.log('[OCR] Processamento concluído:', {
        confidence: ocrResult.confidence,
        duration: ocrResult.duration,
        blocks: ocrResult.blocks.length
      });

      return ocrResult;
    } catch (error) {
      console.error('[OCR] Erro no processamento:', error);
      throw error;
    }
  }

  /**
   * Processa PDF página por página
   */
  static async processPDF(
    pdfFile: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    await this.initialize();

    try {
      const pdfjsLib = await import('pdfjs-dist');
      const pdf = await pdfjsLib.getDocument(pdfFile).promise;
      const totalPages = pdf.numPages;

      const results: OCRResult[] = [];
      const startTime = Date.now();

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        // Emitir progresso
        onProgress?.({
          pageNumber,
          totalPages,
          percentage: Math.round((pageNumber / totalPages) * 100),
          currentBlock: `Processando página ${pageNumber}`
        });

        // Extrair página como imagem
        const page = await pdf.getPage(pageNumber);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 2 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context!, viewport }).promise;

        // Processar com OCR
        const imageData = canvas.toDataURL('image/png');
        const result = await this.processImage(imageData);
        result.pageNumber = pageNumber;

        results.push(result);
      }

      console.log('[OCR] PDF processado:', {
        totalPages,
        duration: Date.now() - startTime,
        totalConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      });

      return results;
    } catch (error) {
      console.error('[OCR] Erro ao processar PDF:', error);
      throw error;
    }
  }

  /**
   * Extrai blocos de texto e seus tipos
   */
  private static extractBlocks(data: any): TextBlock[] {
    const blocks: TextBlock[] = [];
    const lines = data.lines || [];

    for (const line of lines) {
      const text = line.text || '';
      if (!text.trim()) continue;

      const block: TextBlock = {
        text,
        confidence: line.confidence ? line.confidence / 100 : 0.8,
        type: this.detectBlockType(text),
        boundingBox: line.bbox ? {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0
        } : undefined
      };

      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Detecta o tipo de bloco de texto
   */
  private static detectBlockType(text: string): TextBlock['type'] {
    text = text.trim();

    // Número
    if (/^\d+(\.\d+)?$/.test(text)) return 'number';

    // Data
    if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(text)) return 'date';

    // Moeda
    if (/R\$|€|\$|\£/.test(text)) return 'currency';

    // Título (tudo maiúsculo ou muito curto)
    if (text.length < 50 && text === text.toUpperCase()) return 'title';

    // Lista
    if (/^[-•\*]\s/.test(text)) return 'list';

    // Tabela (contém múltiplos separadores)
    if ((text.match(/\t/g) || []).length > 1) return 'table';

    // Parágrafo
    return 'paragraph';
  }

  /**
   * Prepara imagem para OCR
   */
  private static async prepareImage(imageData: File | Blob | string): Promise<string> {
    if (typeof imageData === 'string') {
      return imageData;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(imageData);
    });
  }

  /**
   * Extrai campos estruturados do texto
   */
  static extractStructuredData(blocks: TextBlock[]): Record<string, any> {
    const data: Record<string, any> = {};

    let currentSection = '';

    for (const block of blocks) {
      if (block.type === 'title') {
        currentSection = block.text.toLowerCase();
        data[currentSection] = [];
      } else if (block.type === 'currency' || block.type === 'number') {
        // Extrair valor
        const match = block.text.match(/[\d.,]+/);
        if (match && currentSection) {
          if (Array.isArray(data[currentSection])) {
            data[currentSection].push(parseFloat(match[0].replace(',', '.')));
          }
        }
      } else if (block.type === 'date') {
        // Extrair data
        if (currentSection) {
          if (Array.isArray(data[currentSection])) {
            data[currentSection].push(block.text);
          }
        }
      }
    }

    return data;
  }

  /**
   * Termina o serviço
   */
  static async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.isInitialized = false;
      console.log('[OCR] Service terminated');
    }
  }
}

// ==================== PDF EXTRACTOR ====================

export class PDFExtractor {
  /**
   * Extrai texto puro de PDF
   */
  static async extractText(pdfFile: File): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const pdf = await pdfjsLib.getDocument(pdfFile).promise;

      let fullText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('[PDFExtractor] Erro:', error);
      throw error;
    }
  }

  /**
   * Extrai tabelas de PDF
   */
  static async extractTables(pdfFile: File): Promise<Array<Array<string>>> {
    try {
      const text = await this.extractText(pdfFile);
      const tables: Array<Array<string>> = [];

      // Detectar linhas que parecem ser linhas de tabela
      const lines = text.split('\n');
      let currentTable: string[] = [];

      for (const line of lines) {
        if (line.includes('\t') || /\s{2,}/.test(line)) {
          currentTable.push(line);
        } else if (currentTable.length > 0) {
          tables.push(currentTable);
          currentTable = [];
        }
      }

      return tables;
    } catch (error) {
      console.error('[PDFExtractor] Erro ao extrair tabelas:', error);
      return [];
    }
  }
}

// ==================== SMART FIELD DETECTOR ====================

export class SmartFieldDetector {
  /**
   * Detecta campos de formulário em PDF
   */
  static detectFields(blocks: TextBlock[]): Map<string, string> {
    const fields = new Map<string, string>();

    let lastLabel = '';

    for (const block of blocks) {
      // Se é um título ou label
      if (block.type === 'title' || (block.text.length < 100 && block.text.endsWith(':') === false)) {
        lastLabel = this.normalizeLabel(block.text);
      } else if (block.type === 'number' || block.type === 'date' || block.type === 'currency') {
        // Se é um valor, associar com label anterior
        if (lastLabel) {
          fields.set(lastLabel, block.text);
          lastLabel = '';
        }
      }
    }

    return fields;
  }

  /**
   * Normaliza nome de label
   */
  private static normalizeLabel(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[:\.]/g, '')
      .replace(/\s+/g, '_');
  }

  /**
   * Sugere mapeamento de campos para schema
   */
  static suggestMapping(
    detectedFields: Map<string, string>,
    schema: Record<string, any>
  ): Map<string, string> {
    const mapping = new Map<string, string>();

    for (const [detected, value] of detectedFields.entries()) {
      // Encontrar campo do schema mais similar
      const matched = this.findBestMatch(detected, Object.keys(schema));

      if (matched) {
        mapping.set(matched, value);
      }
    }

    return mapping;
  }

  /**
   * Encontra o campo mais similar
   */
  private static findBestMatch(detected: string, schemaKeys: string[]): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const key of schemaKeys) {
      const score = this.calculateSimilarity(detected, key);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = key;
      }
    }

    return bestMatch;
  }

  /**
   * Calcula similaridade entre strings
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Distância de Levenshtein para comparação
   */
  private static levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;

      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];

          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }

          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }

      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }
}

// ==================== EXPORTS ====================

export default {
  OCRService,
  PDFExtractor,
  SmartFieldDetector
};
