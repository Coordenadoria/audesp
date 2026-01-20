import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedDocument {
  type: 'nota_fiscal' | 'contrato' | 'comprovante';
  numero: string;
  data?: string;
  valor?: number;
  cpf_cnpj?: string;
  confidence: number;
  text: string;
}

const PDFOCRExtractor: React.FC<{ onExtract: (docs: ExtractedDocument[]) => void }> = ({ onExtract }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractText = async (pdfPath: string): Promise<string> => {
    try {
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;
      let text = '';

      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }

      return text;
    } catch (err) {
      console.error('Erro ao extrair PDF:', err);
      return '';
    }
  };

  const extractWithOCR = async (pdfPath: string): Promise<string> => {
    try {
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;
      let text = '';

      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context as any, viewport }).promise;

        const { data: { text: pageText } } = await Tesseract.recognize(canvas, 'por');
        text += pageText + '\n';
      }

      return text;
    } catch (err) {
      console.error('Erro OCR:', err);
      return '';
    }
  };

  const parseDocument = (text: string): ExtractedDocument | null => {
    const patterns = {
      nota_fiscal: {
        regex: /nota fiscal.*?(?:n[°º]|número)[:\s]+(\d{1,10})|nf.*?(\d{1,10})/i,
        type: 'nota_fiscal'
      },
      contrato: {
        regex: /contrato.*?(?:n[°º]|número)[:\s]+(\S{1,20})/i,
        type: 'contrato'
      },
      comprovante: {
        regex: /comprovante|recibo/i,
        type: 'comprovante'
      }
    };

    let documentType: 'nota_fiscal' | 'contrato' | 'comprovante' = 'nota_fiscal';
    let confidence = 0.5;

    if (patterns.contrato.regex.test(text)) {
      documentType = 'contrato';
      confidence = 0.8;
    } else if (patterns.comprovante.regex.test(text)) {
      documentType = 'comprovante';
      confidence = 0.7;
    }

    const numeroMatch = text.match(/(?:n[°º]|número|nº)[:\s]+(\d{1,20})/i);
    const numero = numeroMatch?.[1] || '';

    const dataMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})/);
    const data = dataMatch ? `${dataMatch[3]}-${String(dataMatch[2]).padStart(2, '0')}-${String(dataMatch[1]).padStart(2, '0')}` : undefined;

    const valorMatch = text.match(/(?:r\$|valor|total)[:\s]+(?:r?\$?\s*)?(\d+[.,]\d{2})/i);
    const valor = valorMatch ? parseFloat(valorMatch[1].replace('.', '').replace(',', '.')) : undefined;

    const cpfCnpjMatch = text.match(/(?:cpf|cnpj)[:\s]*(\d{3}[.\-]?\d{3}[.\-]?\d{3}[.\-]?\d{2,4})/i);
    const cpf_cnpj = cpfCnpjMatch?.[1]?.replace(/\D/g, '') || undefined;

    if (!numero) return null;

    return {
      type: documentType,
      numero,
      data,
      valor,
      cpf_cnpj,
      confidence,
      text: text.substring(0, 500)
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      const url = URL.createObjectURL(file);
      setProgress(25);

      // Tentar extração padrão primeiro
      let text = await extractText(url);
      setProgress(50);

      // Se pouco texto extraído, usar OCR
      if (text.length < 200) {
        text = await extractWithOCR(url);
      }
      setProgress(75);

      // Parse document
      const doc = parseDocument(text);
      if (doc) {
        onExtract([doc]);
      } else {
        alert('Não foi possível extrair informações do PDF');
      }

      setProgress(100);
    } catch (err) {
      alert('Erro ao processar PDF: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setProgress(0);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-blue-300">
      <div className="flex items-center justify-center mb-4">
        <Upload size={32} className="text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-center mb-2">Importador OCR de PDFs</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Carregue PDFs de documentos fiscais, contratos ou comprovantes
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="application/pdf"
        className="hidden"
        disabled={loading}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Processando...' : 'Selecionar PDF'}
      </button>

      {loading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader size={16} className="animate-spin" />
            <span className="text-sm">Processando documento...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFOCRExtractor;
