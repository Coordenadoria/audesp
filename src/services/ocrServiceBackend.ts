/**
 * OCR Service - Python Backend Integration
 * 
 * This service communicates with the Python FastAPI backend for advanced PDF OCR
 * instead of using client-side Tesseract.js to avoid CDN/worker issues.
 */

const API_BASE = process.env.REACT_APP_OCR_API || 'http://localhost:8000';

export interface ExtractedPattern {
  cnpj: string[];
  cpf: string[];
  dates: string[];
  currency: string[];
  percentages: string[];
  phones: string[];
  emails: string[];
  urls: string[];
}

export interface OCRResponse {
  success: boolean;
  total_pages?: number;
  full_text?: string;
  patterns?: ExtractedPattern;
  summary?: {
    total_characters: number;
    total_lines: number;
    unique_patterns: number;
  };
  error?: string;
}

export interface BlockData {
  [key: string]: any;
}

/**
 * Extract text from PDF using Python backend
 */
export async function extractTextFromPDF(file: File): Promise<OCRResponse> {
  if (!file.type.includes('pdf')) {
    throw new Error('❌ Apenas PDF é suportado');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('[OCRService] Enviando PDF para backend:', file.name);
    
    const response = await fetch(`${API_BASE}/api/ocr/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data: OCRResponse = await response.json();
    console.log('[OCRService] Resposta recebida:', {
      pages: data.total_pages,
      characters: data.summary?.total_characters,
      patterns: data.summary?.unique_patterns,
    });

    return data;
  } catch (error: any) {
    const errorMsg = error.message || 'Erro ao processar PDF no backend';
    console.error('[OCRService] Erro:', errorMsg);
    throw new Error(`❌ Erro ao processar PDF: ${errorMsg}`);
  }
}

/**
 * Extract and structure data for specific form blocks
 */
export async function extractBlockData(
  file: File,
  blockType: 'general' | 'finance' | 'all' = 'general'
): Promise<BlockData> {
  if (!file.type.includes('pdf')) {
    throw new Error('❌ Apenas PDF é suportado');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('[OCRService] Extraindo dados de bloco:', blockType);
    
    const response = await fetch(`${API_BASE}/api/ocr/extract-block?block_type=${blockType}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Map extracted patterns to form fields
    return mapExtractedDataToForm(data.patterns, blockType);
  } catch (error: any) {
    const errorMsg = error.message || 'Erro ao extrair dados de bloco';
    console.error('[OCRService] Erro ao extrair bloco:', errorMsg);
    throw new Error(`❌ Erro na extração: ${errorMsg}`);
  }
}

/**
 * Map extracted patterns to form field structure
 */
function mapExtractedDataToForm(patterns: ExtractedPattern, blockType: string): BlockData {
  const mappedData: BlockData = {};

  switch (blockType) {
    case 'general':
      // CNPJ (primary, take first match)
      if (patterns.cnpj && patterns.cnpj.length > 0) {
        mappedData['cnpj'] = patterns.cnpj[0];
      }
      // CPF (primary, take first match)
      if (patterns.cpf && patterns.cpf.length > 0) {
        mappedData['cpf'] = patterns.cpf[0];
      }
      // Dates
      if (patterns.dates && patterns.dates.length > 0) {
        mappedData['dates'] = patterns.dates;
      }
      // Contact info
      if (patterns.phones && patterns.phones.length > 0) {
        mappedData['phone'] = patterns.phones[0];
      }
      if (patterns.emails && patterns.emails.length > 0) {
        mappedData['email'] = patterns.emails[0];
      }
      break;

    case 'finance':
      // Currency values
      if (patterns.currency && patterns.currency.length > 0) {
        mappedData['values'] = patterns.currency;
        // Try to extract numeric value from first currency string
        const currencyMatch = patterns.currency[0].match(/[\d.,]+/);
        if (currencyMatch) {
          mappedData['primary_value'] = currencyMatch[0];
        }
      }
      // Percentages
      if (patterns.percentages && patterns.percentages.length > 0) {
        mappedData['percentages'] = patterns.percentages;
      }
      break;

    case 'all':
    default:
      // Return all patterns
      mappedData['patterns'] = patterns;
      break;
  }

  return mappedData;
}

/**
 * Check if Python backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    console.warn('[OCRService] Backend não disponível:', error);
    return false;
  }
}

/**
 * Get backend capabilities and supported features
 */
export async function getOCRCapabilities() {
  try {
    const response = await fetch(`${API_BASE}/api/ocr/info`);
    if (!response.ok) throw new Error('Failed to get OCR info');
    return await response.json();
  } catch (error) {
    console.error('[OCRService] Erro ao obter capacidades:', error);
    return null;
  }
}

/**
 * Detect patterns in text (useful for quick validation)
 */
export function detectPatterns(text: string): Partial<ExtractedPattern> {
  const patterns: Partial<ExtractedPattern> = {};

  // CNPJ pattern
  patterns.cnpj = (text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g) || []);

  // CPF pattern
  patterns.cpf = (text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/g) || []);

  // Dates
  patterns.dates = (text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{4}/g) || []);

  // Currency
  patterns.currency = (text.match(/R\$\s*[\d.,]+/g) || []);

  // Percentages
  patterns.percentages = (text.match(/\d+(?:,\d+)?\s*%/g) || []);

  return patterns;
}
