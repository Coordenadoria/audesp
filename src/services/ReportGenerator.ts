import { FormRecord } from './DocumentLinker';

export interface ReportTemplate {
  name: string;
  title: string;
  description: string;
  sections: ReportSection[];
  format: 'html' | 'pdf' | 'xlsx' | 'xml';
  includeMetadata: boolean;
  includeSummary: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  includeChart?: boolean;
  chartType?: 'bar' | 'pie' | 'line' | 'table';
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  formRecord: FormRecord;
  sections: Record<string, any>;
  summary?: {
    totalFields: number;
    filledFields: number;
    completionPercentage: number;
    linkedDocuments: number;
    warnings: string[];
    errors: string[];
  };
}

export interface ReportGenerationOptions {
  template: ReportTemplate;
  includeDetails: boolean;
  includeCharts: boolean;
  companyBranding: boolean;
  language: 'pt-BR' | 'en-US';
}

export class ReportGenerator {
  private static instance: ReportGenerator;

  private defaultTemplates: Map<string, ReportTemplate> = new Map([
    [
      'audesp-completo',
      {
        name: 'audesp-completo',
        title: 'Relatório Completo AUDESP',
        description: 'Relatório completo com todas as informações da Prestação de Contas',
        sections: [
          {
            id: 'identificacao',
            title: 'Identificação',
            fields: ['cnpj', 'razaoSocial', 'periodo'],
          },
          {
            id: 'receitas',
            title: 'Receitas',
            fields: ['totalReceitas', 'receitasProprias', 'transferencias'],
            includeChart: true,
            chartType: 'bar',
          },
          {
            id: 'despesas',
            title: 'Despesas',
            fields: ['totalDespesas', 'pessoal', 'custeio', 'investimento'],
            includeChart: true,
            chartType: 'pie',
          },
          {
            id: 'comprovantes',
            title: 'Comprovantes',
            fields: ['documentosLinked', 'documentosVerificados', 'percentualVerificacao'],
            includeChart: true,
            chartType: 'table',
          },
        ],
        format: 'pdf',
        includeMetadata: true,
        includeSummary: true,
      },
    ],
    [
      'resumo-executivo',
      {
        name: 'resumo-executivo',
        title: 'Resumo Executivo',
        description: 'Resumo executivo com principais informações',
        sections: [
          {
            id: 'resumo',
            title: 'Resumo',
            fields: ['cnpj', 'razaoSocial', 'totalReceitas', 'totalDespesas'],
          },
          {
            id: 'destaques',
            title: 'Destaques',
            fields: ['principaisDespesas', 'principaisReceitas', 'indices'],
            includeChart: true,
            chartType: 'table',
          },
        ],
        format: 'pdf',
        includeMetadata: false,
        includeSummary: true,
      },
    ],
  ]);

  private constructor() {}

  static getInstance(): ReportGenerator {
    if (!this.instance) {
      this.instance = new ReportGenerator();
    }
    return this.instance;
  }

  /**
   * Gerar dados de relatório a partir de registro de formulário
   */
  generateReportData(
    formRecord: FormRecord,
    template: ReportTemplate
  ): ReportData {
    const sections: Record<string, any> = {};
    let filledFields = 0;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Processa cada seção do template
    template.sections.forEach((section) => {
      const sectionData: Record<string, any> = {};

      section.fields.forEach((field) => {
        const value = formRecord.data[field];
        if (value !== undefined && value !== null && value !== '') {
          sectionData[field] = value;
          filledFields++;
        } else {
          warnings.push(`Campo não preenchido na seção ${section.title}: ${field}`);
        }
      });

      sections[section.id] = sectionData;
    });

    const totalFields = template.sections.reduce((sum, s) => sum + s.fields.length, 0);
    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    // Validações
    if (completionPercentage < 50) {
      errors.push('Formulário com menos de 50% de preenchimento');
    }

    if (formRecord.linkedDocuments.some((d) => d.requiresReview)) {
      warnings.push('Alguns documentos linkedados requerem revisão');
    }

    return {
      title: template.title,
      generatedAt: new Date(),
      formRecord,
      sections,
      summary: {
        totalFields,
        filledFields,
        completionPercentage,
        linkedDocuments: formRecord.linkedDocuments.length,
        warnings,
        errors,
      },
    };
  }

  /**
   * Obter template pré-definido
   */
  getTemplate(templateName: string): ReportTemplate | undefined {
    return this.defaultTemplates.get(templateName);
  }

  /**
   * Listar todos os templates disponíveis
   */
  listTemplates(): ReportTemplate[] {
    return Array.from(this.defaultTemplates.values());
  }

  /**
   * Criar template customizado
   */
  createCustomTemplate(
    name: string,
    title: string,
    sections: ReportSection[]
  ): ReportTemplate {
    const template: ReportTemplate = {
      name,
      title,
      description: `Template customizado: ${title}`,
      sections,
      format: 'pdf',
      includeMetadata: true,
      includeSummary: true,
    };

    this.defaultTemplates.set(name, template);
    return template;
  }

  /**
   * Gerar HTML do relatório
   */
  generateHTML(reportData: ReportData, options: ReportGenerationOptions): string {
    let html = `<!DOCTYPE html>
<html lang="${options.language === 'pt-BR' ? 'pt' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportData.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    .header {
      border-bottom: 2px solid #1f2937;
      margin-bottom: 30px;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .metadata {
      font-size: 12px;
      color: #666;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #1f2937;
      font-size: 18px;
      margin-bottom: 15px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }
    .summary {
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 10px;
    }
    .summary-item {
      background: white;
      padding: 10px;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
    .summary-item strong {
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      color: #1f2937;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      padding: 10px;
      margin-bottom: 5px;
      border-radius: 4px;
    }
    .error {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-left: 4px solid #ef4444;
      padding: 10px;
      margin-bottom: 5px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { background: white; }
      .container { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportData.title}</h1>
      <div class="metadata">
        <p>Gerado em: ${reportData.generatedAt.toLocaleDateString(
          options.language === 'pt-BR' ? 'pt-BR' : 'en-US'
        )} ${reportData.generatedAt.toLocaleTimeString(
          options.language === 'pt-BR' ? 'pt-BR' : 'en-US'
        )}</p>
      </div>
    </div>`;

    // Resumo
    if (options.template.includeSummary && reportData.summary) {
      html += `
    <div class="section">
      <div class="summary">
        <h2>📊 Resumo Executivo</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>Taxa de Preenchimento:</strong><br/>
            ${reportData.summary.completionPercentage}% (${reportData.summary.filledFields}/${reportData.summary.totalFields})
          </div>
          <div class="summary-item">
            <strong>Documentos Linkados:</strong><br/>
            ${reportData.summary.linkedDocuments}
          </div>
        </div>
      </div>
    </div>`;

      // Advertências
      if (reportData.summary.warnings.length > 0) {
        html += '<div class="section"><h2>⚠️ Advertências</h2>';
        reportData.summary.warnings.forEach((w) => {
          html += `<div class="warning">${w}</div>`;
        });
        html += '</div>';
      }

      // Erros
      if (reportData.summary.errors.length > 0) {
        html += '<div class="section"><h2>❌ Erros</h2>';
        reportData.summary.errors.forEach((e) => {
          html += `<div class="error">${e}</div>`;
        });
        html += '</div>';
      }
    }

    // Seções
    options.template.sections.forEach((section) => {
      const sectionData = reportData.sections[section.id];
      if (sectionData && Object.keys(sectionData).length > 0) {
        html += `
    <div class="section">
      <h2>${section.title}</h2>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>`;

        Object.entries(sectionData).forEach(([key, value]) => {
          html += `
          <tr>
            <td>${key}</td>
            <td>${JSON.stringify(value).substring(0, 100)}</td>
          </tr>`;
        });

        html += `
        </tbody>
      </table>
    </div>`;
      }
    });

    html += `
    <div class="footer">
      <p>Relatório gerado automaticamente pelo sistema AUDESP</p>
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Gerar JSON exportável
   */
  generateJSON(reportData: ReportData): string {
    return JSON.stringify(
      {
        report: {
          title: reportData.title,
          generatedAt: reportData.generatedAt.toISOString(),
          formRecord: reportData.formRecord,
          sections: reportData.sections,
          summary: reportData.summary,
        },
      },
      null,
      2
    );
  }

  /**
   * Validar dados antes de gerar relatório
   */
  validateReportData(reportData: ReportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reportData.title) {
      errors.push('Título do relatório não definido');
    }

    if (!reportData.formRecord) {
      errors.push('Registro de formulário não encontrado');
    }

    if (reportData.sections && Object.keys(reportData.sections).length === 0) {
      errors.push('Nenhuma seção de dados foi preenchida');
    }

    if (
      reportData.summary &&
      reportData.summary.completionPercentage < 50
    ) {
      errors.push('Formulário com menos de 50% de preenchimento');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ReportGenerator.getInstance();
