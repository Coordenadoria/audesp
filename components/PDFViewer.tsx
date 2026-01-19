import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFViewerProps {
  file: File;
  onTextSelected?: (text: string, boundingBox?: { x: number; y: number; width: number; height: number }) => void;
  onFieldDetected?: (fieldName: string, value: string) => void;
  highlightFields?: boolean;
  compact?: boolean;
}

interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  scale: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onTextSelected,
  onFieldDetected,
  highlightFields = false,
  compact = false
}) => {
  const [pages, setPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [selectedText, setSelectedText] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar PDF.js
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  // Carregar PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        setPages(pdf.numPages);
        renderPage(pdf, currentPage, scale);
      } catch (error) {
        console.error('[PDFViewer] Erro ao carregar PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // Renderizar página
  const renderPage = async (pdf: any, pageNumber: number, pageScale: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: pageScale });
      const canvas = canvasRef.current;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      await page.render({ canvasContext: context, viewport }).promise;

      // Extrair texto para selection
      const textContent = await page.getTextContent();
      console.log('[PDFViewer] Página renderizada:', pageNumber);
    } catch (error) {
      console.error('[PDFViewer] Erro ao renderizar página:', error);
    }
  };

  // Recarregar página quando mudar
  useEffect(() => {
    if (pages > 0 && canvasRef.current) {
      const loadPage = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        await renderPage(pdf, currentPage, scale);
      };
      loadPage();
    }
  }, [currentPage, scale, file, pages]);

  // Capturar texto selecionado
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString();
      setSelectedText(text);
      onTextSelected?.(text);
    }
  };

  // Próxima página
  const nextPage = () => {
    if (currentPage < pages) setCurrentPage(currentPage + 1);
  };

  // Página anterior
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Aumentar zoom
  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3));
  };

  // Diminuir zoom
  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Carregando PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-2 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Página anterior"
          >
            <ChevronLeftIcon />
          </button>

          <span className="text-sm font-medium text-slate-600 min-w-20 text-center">
            {currentPage} / {pages}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage === pages}
            className="p-2 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
            title="Próxima página"
          >
            <ChevronRightIcon />
          </button>

          <div className="w-px h-6 bg-slate-300 mx-2" />

          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-200 rounded transition text-sm"
            title="Diminuir zoom"
          >
            -
          </button>

          <span className="text-sm font-medium text-slate-600 min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-200 rounded transition text-sm"
            title="Aumentar zoom"
          >
            +
          </button>
        </div>

        {selectedText && (
          <div className="text-xs text-slate-500 max-w-xs truncate bg-blue-50 px-3 py-1 rounded">
            Selecionado: {selectedText}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center bg-slate-100"
        onMouseUp={handleTextSelection}
      >
        <canvas
          ref={canvasRef}
          className="cursor-text shadow-lg"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block'
          }}
        />
      </div>

      {/* Footer */}
      {selectedText && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs text-slate-600 mb-2">Texto selecionado:</p>
          <p className="text-sm font-mono text-blue-900 break-words">
            {selectedText.length > 200 ? selectedText.substring(0, 200) + '...' : selectedText}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== ICONS ====================

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default PDFViewer;
