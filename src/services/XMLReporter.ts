import { ReportData } from './ReportGenerator';
import { FormRecord, DocumentLink } from './DocumentLinker';

/**
 * XMLReporter - Gera XML no formato AUDESP para transmissão
 */

export interface XMLExportOptions {
  version?: string;
  includeDigitalSignature?: boolean;
  compressFile?: boolean;
}

export class XMLReporter {
  private static instance: XMLReporter;
  private readonly AUDESP_VERSION = '1.2';

  private constructor() {}

  static getInstance(): XMLReporter {
    if (!this.instance) {
      this.instance = new XMLReporter();
    }
    return this.instance;
  }

  /**
   * Gerar XML AUDESP completo
   */
  generateAUDESPXML(reportData: ReportData, options: XMLExportOptions = {}): string {
    const version = options.version || this.AUDESP_VERSION;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<audesp version="${version}" xmlns="http://www.prefeitura.gov.br/audesp">\n`;

    // Cabeçalho
    xml += this.generateHeader(reportData, version);

    // Identificação
    xml += this.generateIdentificacao(reportData.formRecord);

    // Receitas
    xml += this.generateReceitas(reportData);

    // Despesas
    xml += this.generateDespesas(reportData);

    // Documentos
    xml += this.generateDocumentos(reportData);

    // Resumo
    xml += this.generateResumo(reportData);

    // Assinatura Digital
    if (options.includeDigitalSignature) {
      xml += this.generateSignature();
    }

    xml += `</audesp>\n`;

    return xml;
  }

  /**
   * Gerar cabeçalho XML
   */
  private generateHeader(reportData: ReportData, version: string): string {
    const now = new Date();
    return `  <header>
    <dataGeracao>${now.toISOString()}</dataGeracao>
    <titulo>${this.escapeXML(reportData.title)}</titulo>
    <versaoSchema>${version}</versaoSchema>
    <usuario>AUDESP_SYSTEM</usuario>
  </header>\n`;
  }

  /**
   * Gerar seção de identificação
   */
  private generateIdentificacao(formRecord: FormRecord): string {
    const data = formRecord.data;
    let xml = `  <identificacao>\n`;

    if (data.cnpj) {
      xml += `    <cnpj>${this.escapeXML(data.cnpj)}</cnpj>\n`;
    }
    if (data.razaoSocial) {
      xml += `    <razaoSocial>${this.escapeXML(data.razaoSocial)}</razaoSocial>\n`;
    }
    if (data.periodo) {
      xml += `    <periodo>${this.escapeXML(data.periodo)}</periodo>\n`;
    }
    if (data.municipio) {
      xml += `    <municipio>${this.escapeXML(data.municipio)}</municipio>\n`;
    }
    if (data.estado) {
      xml += `    <estado>${this.escapeXML(data.estado)}</estado>\n`;
    }

    xml += `  </identificacao>\n`;
    return xml;
  }

  /**
   * Gerar seção de receitas
   */
  private generateReceitas(reportData: ReportData): string {
    const data = reportData.formRecord.data;
    let xml = `  <receitas>\n`;

    if (data.totalReceitas) {
      xml += `    <total>${this.formatCurrency(data.totalReceitas)}</total>\n`;
    }
    if (data.receitasProprias) {
      xml += `    <receitasProprias>${this.formatCurrency(data.receitasProprias)}</receitasProprias>\n`;
    }
    if (data.transferencias) {
      xml += `    <transferencias>${this.formatCurrency(data.transferencias)}</transferencias>\n`;
    }
    if (data.outrasReceitas) {
      xml += `    <outras>${this.formatCurrency(data.outrasReceitas)}</outras>\n`;
    }

    xml += `  </receitas>\n`;
    return xml;
  }

  /**
   * Gerar seção de despesas
   */
  private generateDespesas(reportData: ReportData): string {
    const data = reportData.formRecord.data;
    let xml = `  <despesas>\n`;

    if (data.totalDespesas) {
      xml += `    <total>${this.formatCurrency(data.totalDespesas)}</total>\n`;
    }

    // Detalhamento por categoria
    const categorias = ['pessoal', 'custeio', 'investimento', 'transferencias', 'servicoDividaInterna'];

    categorias.forEach((categoria) => {
      if (data[categoria]) {
        xml += `    <${categoria}>${this.formatCurrency(data[categoria])}</${categoria}>\n`;
      }
    });

    xml += `  </despesas>\n`;
    return xml;
  }

  /**
   * Gerar seção de documentos
   */
  private generateDocumentos(reportData: ReportData): string {
    let xml = `  <documentos>\n`;
    xml += `    <total>${reportData.formRecord.linkedDocuments.length}</total>\n`;

    reportData.formRecord.linkedDocuments.forEach((doc, i) => {
      xml += this.generateDocumento(doc, i + 1);
    });

    xml += `  </documentos>\n`;
    return xml;
  }

  /**
   * Gerar documento individual
   */
  private generateDocumento(link: DocumentLink, numero: number): string {
    let xml = `    <documento numero="${numero}">\n`;
    xml += `      <id>${this.escapeXML(link.documentId)}</id>\n`;
    xml += `      <tipo>${this.escapeXML(link.linkedFormSection)}</tipo>\n`;
    xml += `      <confianca>${(link.linkStrength * 100).toFixed(0)}</confianca>\n`;
    xml += `      <requerRevisao>${link.requiresReview ? 'sim' : 'nao'}</requerRevisao>\n`;

    if (link.linkedFields.size > 0) {
      xml += `      <campos>\n`;
      link.linkedFields.forEach((valor, campo) => {
        xml += `        <campo nome="${this.escapeXML(campo)}">${this.escapeXML(valor)}</campo>\n`;
      });
      xml += `      </campos>\n`;
    }

    if (link.notes.length > 0) {
      xml += `      <notas>\n`;
      link.notes.forEach((note) => {
        xml += `        <nota>${this.escapeXML(note)}</nota>\n`;
      });
      xml += `      </notas>\n`;
    }

    xml += `    </documento>\n`;
    return xml;
  }

  /**
   * Gerar resumo
   */
  private generateResumo(reportData: ReportData): string {
    const summary = reportData.summary;
    if (!summary) return '';

    let xml = `  <resumo>\n`;
    xml += `    <taxaPreenchimento>${summary.completionPercentage}</taxaPreenchimento>\n`;
    xml += `    <camposPreenchidos>${summary.filledFields}</camposPreenchidos>\n`;
    xml += `    <totalCampos>${summary.totalFields}</totalCampos>\n`;
    xml += `    <documentosLinkados>${summary.linkedDocuments}</documentosLinkados>\n`;

    if (summary.warnings.length > 0) {
      xml += `    <advertencias>\n`;
      summary.warnings.forEach((w) => {
        xml += `      <advertencia>${this.escapeXML(w)}</advertencia>\n`;
      });
      xml += `    </advertencias>\n`;
    }

    if (summary.errors.length > 0) {
      xml += `    <erros>\n`;
      summary.errors.forEach((e) => {
        xml += `      <erro>${this.escapeXML(e)}</erro>\n`;
      });
      xml += `    </erros>\n`;
    }

    xml += `  </resumo>\n`;
    return xml;
  }

  /**
   * Gerar assinatura digital
   */
  private generateSignature(): string {
    const timestamp = new Date().toISOString();
    return `  <assinatura>
    <timestamp>${timestamp}</timestamp>
    <hash>SHA256</hash>
    <certificado>PENDENTE</certificado>
  </assinatura>\n`;
  }

  /**
   * Fazer download de arquivo XML
   */
  downloadXML(xmlContent: string, filename: string = `audesp-${Date.now()}.xml`): void {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Validar XML contra schema (simulado)
   */
  validateXML(xmlContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações básicas
    if (!xmlContent.includes('<?xml version="1.0"')) {
      errors.push('Declaração XML não encontrada');
    }

    if (!xmlContent.includes('<audesp')) {
      errors.push('Elemento raiz <audesp> não encontrado');
    }

    if (!xmlContent.includes('</audesp>')) {
      errors.push('Elemento raiz <audesp> não fechado');
    }

    // Validar tags obrigatórias
    const requiredTags = ['header', 'identificacao'];
    requiredTags.forEach((tag) => {
      if (!xmlContent.includes(`<${tag}`) || !xmlContent.includes(`</${tag}>`)) {
        errors.push(`Tag obrigatória não encontrada: <${tag}>`);
      }
    });

    // Validar CNPJ na identificação
    if (!xmlContent.match(/<cnpj>[0-9]{14}<\/cnpj>/)) {
      errors.push('CNPJ inválido ou não encontrado');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converter XML para JSON
   */
  xmlToJSON(xmlContent: string): Record<string, any> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Erro ao fazer parse do XML');
      }

      return this.xmlNodeToJSON(xmlDoc.documentElement);
    } catch (error) {
      console.error('Erro ao converter XML para JSON:', error);
      return {};
    }
  }

  /**
   * Converter nó XML para JSON recursivamente
   */
  private xmlNodeToJSON(node: Element): Record<string, any> {
    const result: Record<string, any> = {};

    // Processar atributos
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result[`@${attr.name}`] = attr.value;
      }
    }

    // Processar filhos
    if (node.childNodes.length > 0) {
      const children: Record<string, any> = {};

      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];

        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = (child as Element).tagName;
          const childData = this.xmlNodeToJSON(child as Element);

          if (children[tagName]) {
            if (!Array.isArray(children[tagName])) {
              children[tagName] = [children[tagName]];
            }
            children[tagName].push(childData);
          } else {
            children[tagName] = childData;
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim();
          if (text) {
            result['#text'] = text;
          }
        }
      }

      Object.assign(result, children);
    }

    return result;
  }

  /**
   * Escapar caracteres XML especiais
   */
  private escapeXML(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Formatar valor monetário para XML
   */
  private formatCurrency(value: any): string {
    if (typeof value === 'string') {
      return value.replace(/[^\d,.-]/g, '').replace(',', '.');
    }
    return String(Number(value).toFixed(2));
  }

  /**
   * Gerar assinado digitalmente (requer backend)
   */
  async generateSignedXML(
    xmlContent: string,
    certificatePath?: string
  ): Promise<string> {
    // Nota: Assinatura digital requer integração com backend
    // Este é um placeholder
    console.log('Assinatura digital requer integração com backend');
    return xmlContent;
  }

  /**
   * Comprimir XML para transmissão
   */
  async compressXML(xmlContent: string): Promise<Blob> {
    // Requer importação de biblioteca de compressão
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    return blob;
  }
}

export default XMLReporter.getInstance();
