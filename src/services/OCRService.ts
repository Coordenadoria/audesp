import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  type: 'cpf' | 'cnpj' | 'date' | 'money' | 'number' | 'text';
  rawText: string;
}

export class OCRService {
  private static instance: OCRService;

  private constructor() {}

  static getInstance(): OCRService {
    if (!this.instance) {
      this.instance = new OCRService();
    }
    return this.instance;
  }

  /**
   * Extrai texto de um arquivo PDF (primeiro converte para imagem)
   */
  async extractTextFromPDF(file: File): Promise<OCRResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error('Não foi possível ler o arquivo');

          // Se for PDF, precisamos converter para imagem primeiro
          if (file.type === 'application/pdf') {
            await this.extractFromPDFBuffer(data as ArrayBuffer, resolve, reject);
          } else {
            // Se for imagem, fazer OCR direto
            await this.performOCR(data as string, resolve, reject);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Fazer OCR em uma imagem
   */
  private async performOCR(
    imageData: string,
    resolve: (value: OCRResult) => void,
    reject: (reason?: any) => void
  ): Promise<void> {
    try {
      const result = await Tesseract.recognize(imageData, 'por', {
        logger: (m) => {
          console.log('OCR Progress:', m.progress);
        },
      });

      const { data } = result;

      const ocrResult: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        blocks: (data.paragraphs || []).map((para: any) => ({
          text: para.text,
          confidence: para.confidence,
          bbox: para.bbox,
        })),
      };

      resolve(ocrResult);
      await Tesseract.terminate();
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Placeholder para extrair de PDF (requer biblioteca PDF.js)
   */
  private async extractFromPDFBuffer(
    buffer: ArrayBuffer,
    resolve: (value: OCRResult) => void,
    reject: (reason?: any) => void
  ): Promise<void> {
    // Nota: Implementação completa requer pdfjs-dist
    // Por enquanto, retornar erro indicativo
    reject(new Error('Extração direta de PDF não implementada. Converta para imagem primeiro.'));
  }

  /**
   * Extrair campos estruturados do texto OCR
   */
  extractFields(ocrText: string): ExtractedField[] {
    const fields: ExtractedField[] = [];

    // Padrão CPF: XXX.XXX.XXX-XX
    const cpfPattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
    const cpfMatches = ocrText.match(cpfPattern);
    if (cpfMatches) {
      cpfMatches.forEach((cpf) => {
        fields.push({
          name: 'CPF',
          value: cpf,
          confidence: 0.95,
          type: 'cpf',
          rawText: cpf,
        });
      });
    }

    // Padrão CNPJ: XX.XXX.XXX/XXXX-XX
    const cnpjPattern = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
    const cnpjMatches = ocrText.match(cnpjPattern);
    if (cnpjMatches) {
      cnpjMatches.forEach((cnpj) => {
        fields.push({
          name: 'CNPJ',
          value: cnpj,
          confidence: 0.95,
          type: 'cnpj',
          rawText: cnpj,
        });
      });
    }

    // Padrão Data: DD/MM/YYYY ou DD-MM-YYYY
    const datePattern = /\b(\d{1,2})([/-])(\d{1,2})\2(\d{4})\b/g;
    let dateMatch;
    while ((dateMatch = datePattern.exec(ocrText)) !== null) {
      const [, day, sep, month, year] = dateMatch;
      fields.push({
        name: 'Data',
        value: `${day}/${month}/${year}`,
        confidence: 0.9,
        type: 'date',
        rawText: dateMatch[0],
      });
    }

    // Padrão Valor: R$ XXX.XXX,XX
    const moneyPattern = /R\$\s*[\d.,]+/g;
    const moneyMatches = ocrText.match(moneyPattern);
    if (moneyMatches) {
      moneyMatches.forEach((money) => {
        const value = money.replace(/[^\d,]/g, '').replace(',', '.');
        fields.push({
          name: 'Valor',
          value: money,
          confidence: 0.85,
          type: 'money',
          rawText: money,
        });
      });
    }

    // Padrão Número (sequências de 6+ dígitos)
    const numberPattern = /\b\d{6,}\b/g;
    const numberMatches = ocrText.match(numberPattern);
    if (numberMatches) {
      numberMatches.slice(0, 5).forEach((num) => {
        // Limitar a 5 números
        fields.push({
          name: 'Número',
          value: num,
          confidence: 0.8,
          type: 'number',
          rawText: num,
        });
      });
    }

    return fields;
  }

  /**
   * Detectar tipo de documento baseado no texto OCR
   */
  detectDocumentType(
    ocrText: string
  ): 'nf' | 'contrato' | 'comprovante' | 'desconhecido' {
    const textLower = ocrText.toLowerCase();

    // Palavras-chave para cada tipo
    const nfKeywords = ['nota fiscal', 'nf', 'cfop', 'icms', 'pis', 'cofins', 'nfe'];
    const contractKeywords = ['contrato', 'contratante', 'contratada', 'objeto', 'vigência'];
    const proofKeywords = [
      'comprovante',
      'recebimento',
      'pagamento',
      'transferência',
      'boleto',
    ];

    let score = 0;
    let detectedType: 'nf' | 'contrato' | 'comprovante' | 'desconhecido' = 'desconhecido';

    // Calcular score para NF
    nfKeywords.forEach((kw) => {
      if (textLower.includes(kw)) score += 2;
    });
    if (score > 0) detectedType = 'nf';

    // Calcular score para Contrato
    score = 0;
    contractKeywords.forEach((kw) => {
      if (textLower.includes(kw)) score += 2;
    });
    if (score > 1) detectedType = 'contrato';

    // Calcular score para Comprovante
    score = 0;
    proofKeywords.forEach((kw) => {
      if (textLower.includes(kw)) score += 2;
    });
    if (score > 0) detectedType = 'comprovante';

    return detectedType;
  }

  /**
   * Validar qualidade do OCR (confidence)
   */
  getOCRQuality(result: OCRResult): 'excelente' | 'boa' | 'razoável' | 'baixa' {
    if (result.confidence >= 0.9) return 'excelente';
    if (result.confidence >= 0.7) return 'boa';
    if (result.confidence >= 0.5) return 'razoável';
    return 'baixa';
  }
}

export default OCRService.getInstance();
