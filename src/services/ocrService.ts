
/**
 * OCR SERVICE - VERSÃO 2.0
 * Extrai texto de PDFs usando Tesseract.js com detecção avançada
 * Identifica padrões de dados (CNPJ, CPF, datas, valores monetários, etc)
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configurar worker do PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ExtractedData {
  cnpj?: string;
  razao_social?: string;
  municipio?: number;
  entidade?: number;
  ano?: number;
  mes?: number;
  
  // Valores monetários
  valores?: {
    repasses?: number;
    receitas?: number;
    despesas?: number;
    disponibilidades?: number;
  };
  
  // Pessoas
  responsaveis?: string[];
  cpfs?: string[];
  
  // Datas
  datas?: string[];
  
  // Documentos
  documentos_fiscais?: string[];
  contratos?: string[];
  
  // Confiança da extração (0-1)
  confidence: number;
  
  // Raw text extraído
  rawText: string;
}

/**
 * Extrai texto de um PDF usando OCR
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  console.log('[OCR] Iniciando extração de PDF:', file.name);
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Renderizar página como imagem para OCR
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Renderizar página no canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // Usar OCR no canvas
    console.log(`[OCR] Processando página ${pageNum}/${pdf.numPages}...`);
    const result = await Tesseract.recognize(canvas, 'por+eng', {
      logger: m => {
        if (m.status === 'recognizing') {
          console.log(`[OCR] Página ${pageNum}: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    fullText += result.data.text + '\n';
  }
  
  console.log('[OCR] Extração completa, tamanho:', fullText.length);
  return fullText;
}

/**
 * Detecta e extrai padrões de dados do texto
 */
export function detectPatterns(text: string): ExtractedData {
  const data: ExtractedData = {
    confidence: 0.5,
    rawText: text,
    valores: {},
    responsaveis: [],
    cpfs: [],
    datas: [],
    documentos_fiscais: [],
    contratos: []
  };
  
  // Padrão: CNPJ (14 dígitos)
  const cnpjMatch = text.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
  if (cnpjMatch) {
    data.cnpj = cleanCNPJ(cnpjMatch[1]);
    console.log('[OCR] CNPJ detectado:', data.cnpj);
  }
  
  // Padrão: CPF (11 dígitos)
  const cpfMatches = text.matchAll(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g);
  for (const match of cpfMatches) {
    const cpf = cleanCPF(match[1]);
    if (!data.cpfs!.includes(cpf)) {
      data.cpfs!.push(cpf);
    }
  }
  console.log('[OCR] CPFs detectados:', data.cpfs);
  
  // Padrão: Datas (DD/MM/YYYY ou YYYY-MM-DD)
  const dataMatches = text.matchAll(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g);
  for (const match of dataMatches) {
    const data_formatada = parseDate(match[1]);
    if (data_formatada && !data.datas!.includes(data_formatada)) {
      data.datas!.push(data_formatada);
    }
  }
  console.log('[OCR] Datas detectadas:', data.datas);
  
  // Padrão: Valores monetários (R$ XXX.XXX,XX)
  const valoresMatch = text.match(/R\$[\s]*([\d.,]+)/gi);
  if (valoresMatch) {
    const valores = valoresMatch.map(v => parseFloat(v.replace(/[^\d,]/g, '').replace(',', '.')));
    if (valores.length > 0) {
      data.valores!.despesas = valores.reduce((a, b) => a + b, 0) / valores.length;
      console.log('[OCR] Valores detectados:', valores);
    }
  }
  
  // Padrão: Mês e Ano
  const anoMatch = text.match(/(\d{4})/);
  if (anoMatch) {
    data.ano = parseInt(anoMatch[1]);
    console.log('[OCR] Ano detectado:', data.ano);
  }
  
  // Detectar mês (se em português)
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  for (let i = 0; i < meses.length; i++) {
    if (text.toLowerCase().includes(meses[i])) {
      data.mes = i + 1;
      console.log('[OCR] Mês detectado:', data.mes, meses[i]);
      break;
    }
  }
  
  // Força mês 12 para prestação de contas
  if (text.toLowerCase().includes('prestação') || text.toLowerCase().includes('contas')) {
    data.mes = 12;
    console.log('[OCR] Detectado prestação de contas - forçando mês 12');
  }
  
  // Padrão: Município (código IBGE 7 dígitos começando com 35 para SP)
  const municipioMatch = text.match(/(35\d{5})/);
  if (municipioMatch) {
    data.municipio = parseInt(municipioMatch[1]);
    console.log('[OCR] Município detectado:', data.municipio);
  }
  
  // Detecção de palavras-chave
  const keywords: { [key: string]: string[] } = {
    responsaveis: ['responsável', 'diretor', 'presidente', 'gestor', 'ordenador'],
    documentos: ['nf', 'nota fiscal', 'recibo', 'comprovante', 'fatura'],
    contratos: ['contrato', 'termo', 'acordo', 'licitação']
  };
  
  // Extrair linhas com palavras-chave
  const linhas = text.split('\n');
  for (const linha of linhas) {
    for (const [tipo, palavras] of Object.entries(keywords)) {
      if (palavras.some(p => linha.toLowerCase().includes(p))) {
        if (tipo === 'responsaveis' && !data.responsaveis!.includes(linha.trim())) {
          data.responsaveis!.push(linha.trim());
        } else if (tipo === 'documentos' && !data.documentos_fiscais!.includes(linha.trim())) {
          data.documentos_fiscais!.push(linha.trim());
        } else if (tipo === 'contratos' && !data.contratos!.includes(linha.trim())) {
          data.contratos!.push(linha.trim());
        }
      }
    }
  }
  
  // Calcular confiança (baseado em quantos campos foram encontrados)
  const camposPreenchidos = [
    data.cnpj,
    data.ano,
    data.mes,
    data.cpfs && data.cpfs.length > 0,
    data.datas && data.datas.length > 0,
    data.valores?.despesas
  ].filter(Boolean).length;
  
  data.confidence = Math.min(0.95, camposPreenchidos / 6);
  
  console.log('[OCR] Confiança da extração:', Math.round(data.confidence * 100) + '%');
  
  return data;
}

/**
 * Função auxiliar para limpar e validar CNPJ
 */
function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Função auxiliar para limpar e validar CPF
 */
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Função auxiliar para parse de data (converte para YYYY-MM-DD)
 */
function parseDate(dateStr: string): string | null {
  try {
    // Tenta YYYY-MM-DD
    if (dateStr.match(/\d{4}[\/\-]\d{2}[\/\-]\d{2}/)) {
      const [year, month, day] = dateStr.replace(/\//g, '-').split('-');
      return `${year}-${month}-${day}`;
    }
    
    // Tenta DD/MM/YYYY
    const [day, month, year] = dateStr.replace(/\//g, '-').split('-');
    if (parseInt(year) > 1900 && parseInt(month) > 0 && parseInt(month) <= 12 && parseInt(day) > 0 && parseInt(day) <= 31) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Processa arquivo PDF e retorna dados extraídos
 */
export async function processPDFFile(file: File): Promise<ExtractedData> {
  try {
    console.log('[OCR] Iniciando processamento de:', file.name);
    
    // Extrair texto do PDF
    const text = await extractTextFromPDF(file);
    
    // Detectar padrões
    const data = detectPatterns(text);
    
    return data;
  } catch (error) {
    console.error('[OCR] Erro ao processar PDF:', error);
    throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Mapeia dados extraídos para o formato do formulário
 */
export function mapExtractedDataToForm(extracted: ExtractedData): Partial<any> {
  return {
    descritor: {
      municipio: extracted.municipio,
      entidade: extracted.entidade || 1,
      ano: extracted.ano,
      mes: extracted.mes || 12
    },
    dados_gerais_entidade_beneficiaria: {
      cnpj: extracted.cnpj,
      razao_social: extracted.razao_social
    },
    receitas: {
      repasses_recebidos: extracted.valores?.repasses || 0
    },
    disponibilidades: {
      saldos: [
        {
          saldo_bancario: extracted.valores?.disponibilidades || 0
        }
      ]
    },
    extraction_metadata: {
      source: 'PDF_OCR',
      confidence: extracted.confidence,
      timestamp: new Date().toISOString(),
      extracted_cpfs: extracted.cpfs,
      extracted_datas: extracted.datas,
      raw_text_preview: extracted.rawText.substring(0, 500)
    }
  };
}
/**
 * Extrai dados estruturados de documentos (base64) para um bloco específico
 * Função auxiliar para compatibilidade com GeminiUploader
 */
export async function extractBlockData(base64String: string, mimeType: string, section: string): Promise<any> {
  // Esta função será chamada pelo GeminiUploader para extrair dados por seção
  // Para PDFs, usa OCR; para outros formatos, seria Gemini
  
  console.log(`[OCR] Extracting block data for section: ${section}`);
  console.log(`[OCR] Mime type: ${mimeType}`);
  
  try {
    // Se é PDF, usa OCR
    if (mimeType === 'application/pdf') {
      // Converter base64 para Blob/File
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], 'document.pdf', { type: mimeType });
      
      // Processar PDF com OCR
      const extracted = await processPDFFile(file);
      
      // Mapear para a seção especificada
      const mapped = mapExtractedDataToForm(extracted);
      
      console.log(`[OCR] Extraction complete for section ${section}. Confidence: ${extracted.confidence}`);
      
      return {
        success: true,
        source: 'PDF_OCR',
        confidence: extracted.confidence,
        data: mapped,
        section: section
      };
    }
    
    // Para outros tipos de documento, retorna erro (apenas PDF suportado por enquanto)
    throw new Error(`Apenas PDF é suportado. Recebido: ${mimeType}`);
  } catch (error: any) {
    console.error(`[OCR] Error in extractBlockData:`, error);
    throw new Error(`Erro ao processar PDF: ${error.message}`);
  }
}