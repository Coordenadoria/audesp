import { ReportData, ReportGenerationOptions } from './ReportGenerator';
import { FormRecord } from './DocumentLinker';

/**
 * ExcelReporter - Gera arquivos XLSX de relatórios AUDESP
 * Nota: Requer biblioteca 'xlsx' para geração de Excel
 */

export interface ExcelExportOptions extends ReportGenerationOptions {
  filename?: string;
  includeCharts?: boolean;
  sheetNames?: string[];
  freezeHeader?: boolean;
  autoFilter?: boolean;
}

interface SheetData {
  name: string;
  data: Array<Record<string, any>>;
  columnWidths?: number[];
}

export class ExcelReporter {
  private static instance: ExcelReporter;

  private constructor() {}

  static getInstance(): ExcelReporter {
    if (!this.instance) {
      this.instance = new ExcelReporter();
    }
    return this.instance;
  }

  /**
   * Gerar e fazer download de arquivo Excel
   */
  async generateAndDownloadExcel(
    reportData: ReportData,
    options: ExcelExportOptions
  ): Promise<void> {
    try {
      const XLSX = await this.loadXLSX();
      const workbook = XLSX.utils.book_new();

      // Resumo
      if (options.template.includeSummary && reportData.summary) {
        const summaryData = [
          { Campo: 'Taxa de Preenchimento', Valor: `${reportData.summary.completionPercentage}%` },
          { Campo: 'Campos Preenchidos', Valor: reportData.summary.filledFields },
          { Campo: 'Total de Campos', Valor: reportData.summary.totalFields },
          { Campo: 'Documentos Linkados', Valor: reportData.summary.linkedDocuments },
        ];

        if (reportData.summary.warnings.length > 0) {
          summaryData.push({
            Campo: 'Advertências',
            Valor: reportData.summary.warnings.join('; '),
          });
        }

        if (reportData.summary.errors.length > 0) {
          summaryData.push({
            Campo: 'Erros',
            Valor: reportData.summary.errors.join('; '),
          });
        }

        const ws = XLSX.utils.json_to_sheet(summaryData);
        this.formatSheet(ws, summaryData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Resumo');
      }

      // Seções
      options.template.sections.forEach((section) => {
        const sectionData = reportData.sections[section.id];
        if (sectionData && Object.keys(sectionData).length > 0) {
          const data = Array.isArray(sectionData)
            ? sectionData
            : [sectionData];

          const ws = XLSX.utils.json_to_sheet(data);
          this.formatSheet(ws, data);
          XLSX.utils.book_append_sheet(workbook, ws, section.title);
        }
      });

      // Documentos Linkados
      if (reportData.formRecord.linkedDocuments.length > 0) {
        const docsData = reportData.formRecord.linkedDocuments.map((doc, i) => ({
          '#': i + 1,
          'Documento ID': doc.documentId,
          'Seção Vinculada': doc.linkedFormSection,
          'Confiança': `${(doc.linkStrength * 100).toFixed(0)}%`,
          'Requer Revisão': doc.requiresReview ? 'Sim' : 'Não',
          'Notas': doc.notes.join('; '),
        }));

        const ws = XLSX.utils.json_to_sheet(docsData);
        this.formatSheet(ws, docsData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Documentos Linkados');
      }

      // Metadados
      if (options.template.includeMetadata) {
        const metadataData = [
          { Chave: 'Título', Valor: reportData.title },
          { Chave: 'Gerado em', Valor: reportData.generatedAt.toISOString() },
          { Chave: 'CNPJ', Valor: reportData.formRecord.data.cnpj || 'N/A' },
          { Chave: 'Razão Social', Valor: reportData.formRecord.data.razaoSocial || 'N/A' },
          { Chave: 'Tipo de Formulário', Valor: reportData.formRecord.formType },
        ];

        const ws = XLSX.utils.json_to_sheet(metadataData);
        this.formatSheet(ws, metadataData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Metadados', 0); // Insert at beginning
      }

      // Salvar arquivo
      const filename = options.filename || `relatorio-${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      throw new Error('Não foi possível gerar o arquivo Excel');
    }
  }

  /**
   * Gerar Excel e retornar como Blob
   */
  async generateExcelBlob(
    reportData: ReportData,
    options: ExcelExportOptions
  ): Promise<Blob> {
    const XLSX = await this.loadXLSX();
    const workbook = XLSX.utils.book_new();

    // Resumo
    if (options.template.includeSummary && reportData.summary) {
      const summaryData = [
        { Campo: 'Taxa de Preenchimento', Valor: `${reportData.summary.completionPercentage}%` },
        { Campo: 'Campos Preenchidos', Valor: reportData.summary.filledFields },
        { Campo: 'Total de Campos', Valor: reportData.summary.totalFields },
      ];

      const ws = XLSX.utils.json_to_sheet(summaryData);
      this.formatSheet(ws, summaryData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Resumo');
    }

    // Seções
    options.template.sections.forEach((section) => {
      const sectionData = reportData.sections[section.id];
      if (sectionData && Object.keys(sectionData).length > 0) {
        const data = Array.isArray(sectionData) ? sectionData : [sectionData];
        const ws = XLSX.utils.json_to_sheet(data);
        this.formatSheet(ws, data);
        XLSX.utils.book_append_sheet(workbook, ws, section.title);
      }
    });

    // Converter para Blob
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Gerar múltiplas abas de dados em um único Excel
   */
  async generateMultiSheetExcel(
    sheets: SheetData[],
    filename: string = `relatorio-${Date.now()}.xlsx`
  ): Promise<void> {
    const XLSX = await this.loadXLSX();
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const ws = XLSX.utils.json_to_sheet(sheet.data);

      if (sheet.columnWidths) {
        ws['!cols'] = sheet.columnWidths.map((width) => ({ wch: width }));
      }

      this.formatSheet(ws, sheet.data);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    XLSX.writeFile(workbook, filename);
  }

  /**
   * Exportar dados tabulares para Excel (formato simples)
   */
  async exportTable(
    data: Array<Record<string, any>>,
    filename: string = `tabela-${Date.now()}.xlsx`,
    sheetName: string = 'Dados'
  ): Promise<void> {
    const XLSX = await this.loadXLSX();
    const ws = XLSX.utils.json_to_sheet(data);
    this.formatSheet(ws, data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Formatação de células e worksheet
   */
  private formatSheet(ws: any, data: Array<Record<string, any>>) {
    if (!ws['!cols']) {
      ws['!cols'] = [];
    }

    // Calcular largura das colunas baseado no conteúdo
    const headers = Object.keys(data[0] || {});
    headers.forEach((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...data.map((row) => String(row[header] || '').length)
      );
      ws['!cols'][i] = { wch: Math.min(maxLength + 2, 50) };
    });

    // Adicionar filtro de cabeçalho
    if (data.length > 0) {
      ws['!autofilter'] = {
        ref: `A1:${String.fromCharCode(65 + headers.length - 1)}${data.length + 1}`,
      };
    }

    // Congelar primeira linha
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  }

  /**
   * Gerar relatório comparativo
   */
  async generateComparativeReport(
    previousReport: ReportData,
    currentReport: ReportData,
    filename: string = `comparativo-${Date.now()}.xlsx`
  ): Promise<void> {
    const XLSX = await this.loadXLSX();
    const workbook = XLSX.utils.book_new();

    // Comparação de resumos
    const comparisonData = [
      {
        'Campo': 'Taxa de Preenchimento',
        'Anterior': `${previousReport.summary?.completionPercentage || 0}%`,
        'Atual': `${currentReport.summary?.completionPercentage || 0}%`,
        'Variação': this.calculateVariation(
          previousReport.summary?.completionPercentage || 0,
          currentReport.summary?.completionPercentage || 0
        ),
      },
      {
        'Campo': 'Documentos Linkados',
        'Anterior': previousReport.summary?.linkedDocuments || 0,
        'Atual': currentReport.summary?.linkedDocuments || 0,
        'Variação': this.calculateVariation(
          previousReport.summary?.linkedDocuments || 0,
          currentReport.summary?.linkedDocuments || 0
        ),
      },
    ];

    const ws = XLSX.utils.json_to_sheet(comparisonData);
    this.formatSheet(ws, comparisonData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Comparativo');

    XLSX.writeFile(workbook, filename);
  }

  /**
   * Carregar XLSX dinamicamente
   */
  private async loadXLSX(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).XLSX) {
      return (window as any).XLSX;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js';
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        resolve((window as any).XLSX);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Calcular variação percentual
   */
  private calculateVariation(prev: number, current: number): string {
    if (prev === 0) return 'N/A';
    const variation = ((current - prev) / prev) * 100;
    const sign = variation > 0 ? '+' : '';
    return `${sign}${variation.toFixed(1)}%`;
  }

  /**
   * Exportar para CSV (compatível com Excel)
   */
  generateCSV(data: Array<Record<string, any>>): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.map((h) => `"${h}"`).join(',');

    const csvRows = data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        const stringValue = String(value || '');
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Fazer download de CSV
   */
  downloadCSV(
    data: Array<Record<string, any>>,
    filename: string = `dados-${Date.now()}.csv`
  ): void {
    const csv = this.generateCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default ExcelReporter.getInstance();
