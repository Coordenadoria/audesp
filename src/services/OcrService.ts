import Tesseract from 'tesseract.js';

export interface ExtracaoPDF {
  numero_documento?: string;
  datas?: string[];
  valores?: number[];
  cpf_cnpj?: string[];
  tipo_documento?: string;
  texto_completo: string;
}

class OcrService {
  private trabalhador: Tesseract.Worker | null = null;

  async inicializar(): Promise<void> {
    try {
      this.trabalhador = await Tesseract.createWorker({
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        logger: (m) => console.log('OCR Progress:', m)
      });
      await this.trabalhador.loadLanguage('por');
      await this.trabalhador.initialize('por');
    } catch (error) {
      console.error('Erro ao inicializar OCR:', error);
      throw error;
    }
  }

  async finalizarOCR(): Promise<void> {
    if (this.trabalhador) {
      await this.trabalhador.terminate();
      this.trabalhador = null;
    }
  }

  /**
   * Realizar OCR em arquivo PDF/Imagem
   */
  async processarDocumento(arquivo: File): Promise<ExtracaoPDF> {
    if (!this.trabalhador) {
      await this.inicializar();
    }

    try {
      // Converter arquivo para formato processável
      const arrayBuffer = await arquivo.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Processar com Tesseract.js
      const resultado = await this.trabalhador!.recognize(uint8Array, 'por');
      const textoCompleto = resultado.data.text;

      // Extrair dados inteligentemente
      const extracao: ExtracaoPDF = {
        texto_completo: textoCompleto,
        datas: this.extrairDatas(textoCompleto),
        valores: this.extrairValores(textoCompleto),
        cpf_cnpj: this.extrairCpfCnpj(textoCompleto),
        numero_documento: this.extrairNumeroDocumento(textoCompleto),
        tipo_documento: this.classificarDocumento(textoCompleto)
      };

      return extracao;
    } catch (error) {
      throw new Error(`Erro ao processar OCR: ${error}`);
    }
  }

  /**
   * Extrair datas (DD/MM/YYYY ou DD-MM-YYYY)
   */
  private extrairDatas(texto: string): string[] {
    const regexData = /(\d{2}[\/-]\d{2}[\/-]\d{4})/g;
    const datas = texto.match(regexData) || [];
    return [...new Set(datas)]; // Remove duplicatas
  }

  /**
   * Extrair valores monetários (R$ XXX,XX)
   */
  private extrairValores(texto: string): number[] {
    const regexValor = /R\$\s*([\d.,]+)|(\d+[.,]\d{2})/g;
    const valores: number[] = [];
    let match;

    while ((match = regexValor.exec(texto)) !== null) {
      const valor = (match[1] || match[2]).replace('.', '').replace(',', '.');
      valores.push(parseFloat(valor));
    }

    return [...new Set(valores)]; // Remove duplicatas
  }

  /**
   * Extrair CPF/CNPJ
   */
  private extrairCpfCnpj(texto: string): string[] {
    const regexCpf = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g;
    const regexCnpj = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/g;

    const cpfs = (texto.match(regexCpf) || []).map(c => c.replace(/[^\d]/g, ''));
    const cnpjs = (texto.match(regexCnpj) || []).map(c => c.replace(/[^\d]/g, ''));

    return [...new Set([...cpfs, ...cnpjs])];
  }

  /**
   * Extrair número de documento (NF, RPS, Cheque, etc)
   */
  private extrairNumeroDocumento(texto: string): string | undefined {
    // Nota Fiscal
    let match = texto.match(/[Nn]ota\s+[Ff]iscal\s+(?:(?:[Ee]letr|no\.?|n°?|#)\s+)?([0-9]+)/);
    if (match) return match[1];

    // Recibo/RPS
    match = texto.match(/[Rr]ecibo|[Rr][Pp][Ss].*?([0-9]+)/);
    if (match) return match[1];

    // Número genérico (procurar números significativos)
    const numeros = texto.match(/\b\d{6,12}\b/);
    return numeros ? numeros[0] : undefined;
  }

  /**
   * Classificar tipo de documento
   */
  private classificarDocumento(texto: string): string {
    const texto_lower = texto.toLowerCase();

    if (texto_lower.includes('nota fiscal')) return 'Nota Fiscal';
    if (texto_lower.includes('nf-e') || texto_lower.includes('nfe')) return 'Nota Fiscal Eletrônica';
    if (texto_lower.includes('rps')) return 'RPS';
    if (texto_lower.includes('cupom fiscal')) return 'Cupom Fiscal';
    if (texto_lower.includes('recibo')) return 'Recibo';
    if (texto_lower.includes('contrato')) return 'Contrato';
    if (texto_lower.includes('cheque')) return 'Cheque';
    if (texto_lower.includes('comprovante')) return 'Comprovante';
    if (texto_lower.includes('recebimento')) return 'Comprovante de Recebimento';
    if (texto_lower.includes('pagamento')) return 'Comprovante de Pagamento';

    return 'Documento Desconhecido';
  }

  /**
   * Processar múltiplos documentos (ZIP, pastas)
   */
  async processarMultiplos(arquivos: File[]): Promise<ExtracaoPDF[]> {
    const resultados: ExtracaoPDF[] = [];

    for (const arquivo of arquivos) {
      try {
        const resultado = await this.processarDocumento(arquivo);
        resultados.push(resultado);
      } catch (error) {
        console.error(`Erro ao processar ${arquivo.name}:`, error);
      }
    }

    return resultados;
  }

  /**
   * Associar documento extraído com contrato/pagamento
   */
  associarComContrato(
    extracao: ExtracaoPDF,
    contratos: any[]
  ): { contrato?: any; confianca: number } {
    let melhorMatch = { contrato: undefined, confianca: 0 };

    if (!extracao.cpf_cnpj || extracao.cpf_cnpj.length === 0) {
      return melhorMatch;
    }

    const cnpjExtraido = extracao.cpf_cnpj[0];

    for (const contrato of contratos) {
      const cnpjContrato = contrato.fornecedor_cnpj?.replace(/[^\d]/g, '');

      if (cnpjContrato === cnpjExtraido) {
        // Verificar se há correspondência de valor também
        if (extracao.valores && extracao.valores.length > 0) {
          const valorDifere = Math.abs(extracao.valores[0] - (contrato.valor_total || 0)) < 100;
          const confianca = valorDifere ? 0.95 : 0.80;
          return { contrato, confianca };
        }
        return { contrato, confianca: 0.85 };
      }
    }

    return melhorMatch;
  }
}

export default new OcrService();
