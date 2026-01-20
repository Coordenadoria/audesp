import { ReportData, ReportGenerationOptions } from './ReportGenerator';

/**
 * PDFReporter - Gera PDF de relatórios AUDESP
 * Nota: Usa biblioteca HTML2Canvas + jsPDF para renderização no navegador
 */

export interface PDFExportOptions extends ReportGenerationOptions {
  filename?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
}

export class PDFReporter {
  private static instance: PDFReporter;

  private constructor() {}

  static getInstance(): PDFReporter {
    if (!this.instance) {
      this.instance = new PDFReporter();
    }
    return this.instance;
  }

  /**
   * Converter HTML para PDF e fazer download
   * Utilizando HTML2Canvas + jsPDF (carregamento dinâmico)
   */
  async generateAndDownloadPDF(
    htmlContent: string,
    options: PDFExportOptions
  ): Promise<void> {
    try {
      // Carregar bibliotecas dinamicamente
      const html2canvas = await this.loadHTML2Canvas();
      const { jsPDF } = await this.loadJsPDF();

      // Criar container temporário
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1000px';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);

      // Renderizar para canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Remover container
      document.body.removeChild(container);

      // Criar PDF
      const pageSize = options.pageSize || 'A4';
      const orientation = options.orientation || 'portrait';
      const margins = options.margins || { top: 10, right: 10, bottom: 10, left: 10 };

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize,
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const availableWidth = pageWidth - margins.left - margins.right;
      const availableHeight = pageHeight - margins.top - margins.bottom;

      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = margins.top;
      let remainingHeight = imgHeight;

      // Adicionar imagem ao PDF (suporta múltiplas páginas)
      while (remainingHeight > 0) {
        const pageHeight_mm = pageHeight - margins.top - margins.bottom;

        if (remainingHeight > pageHeight_mm) {
          pdf.addImage(
            imgData,
            'PNG',
            margins.left,
            yPosition,
            imgWidth,
            pageHeight_mm
          );
          remainingHeight -= pageHeight_mm;
          yPosition = margins.top;
          pdf.addPage();
        } else {
          pdf.addImage(
            imgData,
            'PNG',
            margins.left,
            yPosition,
            imgWidth,
            remainingHeight
          );
          remainingHeight = 0;
        }
      }

      // Download
      const filename = options.filename || `relatorio-${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Não foi possível gerar o PDF');
    }
  }

  /**
   * Gerar PDF e retornar como Blob
   */
  async generatePDFBlob(
    htmlContent: string,
    options: PDFExportOptions
  ): Promise<Blob> {
    const html2canvas = await this.loadHTML2Canvas();
    const { jsPDF } = await this.loadJsPDF();

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = '1000px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    document.body.removeChild(container);

    const pageSize = options.pageSize || 'A4';
    const orientation = options.orientation || 'portrait';
    const margins = options.margins || { top: 10, right: 10, bottom: 10, left: 10 };

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const availableWidth = pageWidth - margins.left - margins.right;
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margins.left, margins.top, imgWidth, imgHeight);

    return pdf.output('blob');
  }

  /**
   * Carregar HTML2Canvas dinamicamente
   */
  private async loadHTML2Canvas() {
    if (typeof window !== 'undefined' && (window as any).html2canvas) {
      return (window as any).html2canvas;
    }

    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        resolve((window as any).html2canvas);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Carregar jsPDF dinamicamente
   */
  private async loadJsPDF() {
    if (typeof window !== 'undefined' && (window as any).jspdf) {
      return (window as any).jspdf;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        resolve((window as any).jspdf);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Gerar PDF com múltiplas seções
   */
  async generateMultiSectionPDF(
    sections: Array<{ title: string; content: string }>,
    options: PDFExportOptions
  ): Promise<Blob> {
    const html2canvas = await this.loadHTML2Canvas();
    const { jsPDF } = await this.loadJsPDF();

    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'A4',
    });

    const margins = options.margins || { top: 10, right: 10, bottom: 10, left: 10 };
    let isFirstPage = true;

    for (const section of sections) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Renderizar seção
      const container = document.createElement('div');
      container.innerHTML = `<h1>${section.title}</h1>${section.content}`;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '1000px';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const availableWidth = pageWidth - margins.left - margins.right;
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        margins.left,
        margins.top,
        imgWidth,
        Math.min(imgHeight, pageHeight - margins.top - margins.bottom)
      );
    }

    return pdf.output('blob');
  }

  /**
   * Adicionar marca d'água ao PDF
   */
  async addWatermark(pdfBlob: Blob, watermarkText: string): Promise<Blob> {
    const { PDFDocument, rgb } = await this.loadPDFLib();

    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont((await this.loadDefaultFont()) as Buffer);

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      page.drawText(watermarkText, {
        x: width / 2 - 50,
        y: height / 2,
        size: 48,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.5,
        angle: Math.PI / 4, // 45 degrees
        font,
      });
    });

    return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
  }

  /**
   * Carregar PDFLib (para manipulação avançada)
   */
  private async loadPDFLib() {
    if (typeof window !== 'undefined' && (window as any).PDFLib) {
      return (window as any).PDFLib;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        resolve((window as any).PDFLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Carregar fonte padrão para PDFLib
   */
  private async loadDefaultFont() {
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/pdfkit/js/fonts/Helvetica'
    );
    return await response.arrayBuffer();
  }
}

export default PDFReporter.getInstance();
