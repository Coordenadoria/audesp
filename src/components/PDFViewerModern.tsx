/**
 * PDF VIEWER MODERNO COM EXTRAÇÃO DE TEXTO
 * Visualização de PDFs com detecção de texto via pdf.js
 * Sem emojis - Design profissional
 */

import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  onOCRComplete: (text: string) => void;
  onPDFLoaded: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  onOCRComplete,
  onPDFLoaded
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        renderPage(pdf, 1);
        onPDFLoaded();
      } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        alert('Erro ao carregar PDF');
      }
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Erro ao renderizar:', error);
    }
  };

  const handleExtractText = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n\n[Página ${i}]\n${pageText}`;
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      setOcrResults(fullText);
      onOCRComplete(fullText);
      setProgress(100);
    } catch (error) {
      console.error('Erro ao extrair texto:', error);
      alert('Erro ao processar PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const navigatePage = async (direction: 'prev' | 'next') => {
    if (!pdfFile) return;
    
    const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
    if (newPage >= 1 && newPage <= totalPages) {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      renderPage(pdf, newPage);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(ocrResults);
    alert('Texto copiado');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="border-b border-slate-200 p-6 bg-gradient-to-r from-slate-50 to-slate-100">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Visualizador de PDF</h2>
        
        <div className="flex items-center gap-4 flex-wrap">
          <label className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition text-sm">
            Selecionar PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />
          </label>

          {pdfFile && (
            <>
              <span className="text-sm text-slate-700 font-medium">
                {pdfFile.name}
              </span>

              {totalPages > 0 && (
                <button
                  onClick={handleExtractText}
                  disabled={isProcessing}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                    isProcessing
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isProcessing ? `Extraindo ${progress}%...` : 'Extrair Texto'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!pdfFile ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg text-slate-600 font-medium">Selecione um PDF</p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* VISUALIZADOR */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full"
                />
              </div>

              {totalPages > 1 && (
                <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
                  <button
                    onClick={() => navigatePage('prev')}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => navigatePage('next')}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded text-sm disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              )}
            </div>

            {/* TEXTO EXTRAÍDO */}
            {ocrResults && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Texto Extraído</h3>
                  <button
                    onClick={copyText}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                  >
                    Copiar
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 max-h-64 overflow-y-auto font-mono text-sm text-slate-700 whitespace-pre-wrap">
                  {ocrResults}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
