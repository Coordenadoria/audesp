/**
 * Schema Mapper Service
 * Mapeia dados extraídos de PDFs para o schema de Prestação de Contas v1.9
 * Inteligência para detectar seções e preencher automaticamente
 */

export interface PrestacaoContasSchema {
  descritor: {
    tipo_documento: string;
    municipio: number;
    entidade: number;
    ano: number;
    mes: number;
  };
  codigo_ajuste: string;
  retificacao: boolean;
  relacao_empregados: any[];
  relacao_bens: any;
  contratos: any[];
  documentos_fiscais: any[];
  pagamentos: any[];
  disponibilidades: any;
  receitas: any;
  ajustes_saldo: any;
  servidores_cedidos: any[];
  descontos: any[];
  devolucoes: any[];
  glosas: any[];
  empenhos: any[];
  repasses: any[];
  relatorio_atividades: any;
  dados_gerais_entidade_beneficiaria: any;
  responsaveis_membros_orgao_concessor: any;
  declaracoes: any;
  relatorio_governamental_analise_execucao: any;
  demonstracoes_contabeis: any;
  publicacoes_parecer_ata: any[];
  prestacao_contas_entidade_beneficiaria: any;
  parecer_conclusivo: any;
  transparencia: any;
}

export interface ExtractedPDFData {
  fullText: string;
  tables: any[];
  metadata: {
    filename: string;
    extractedAt: string;
    pageCount?: number;
  };
}

class SchemaMapperService {
  private regexPatterns = {
    dataRelatorio: /data\s*(?:de\s+)?(?:conclusão|emissão|relatório)[\s:]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})/gi,
    municipioCode: /municipio\s*(?:código)?[\s:]*(\d{1,5})/gi,
    entidadeCode: /entidade\s*(?:código)?[\s:]*(\d{1,5})/gi,
    anoReferencia: /ano\s+(?:de\s+)?referência[\s:]*(\d{4})/gi,
    mesReferencia: /mês\s+(?:de\s+)?referência[\s:]*(\d{1,2})/gi,
    codigoAjuste: /código\s+(?:do\s+)?ajuste[\s:]*(\d{15,19})/gi,
    tabelas: /(?:tabela|quadro|relação)[\s:]*([^.]*?)(?=tabela|quadro|relação|$)/gi,
    valores: /(?:valor|total|saldo)[\s:]*(?:de\s+)?(?:r\$\s*)?(\d+[.,]\d{2})/gi,
    cpf: /\d{3}[.,]\d{3}[.,]\d{3}[.,]\d{2}/g,
    cnpj: /\d{2}[.,]\d{3}[.,]\d{3}[.,]\d{4}[.,]\d{2}/g,
    data: /\d{1,2}[/\-]\d{1,2}[/\-]\d{4}/g,
  };

  /**
   * Extrai informações de descritor do texto do PDF
   */
  private extrairDescritor(text: string): Partial<PrestacaoContasSchema['descritor']> {
    const descritor: Partial<PrestacaoContasSchema['descritor']> = {
      tipo_documento: 'Prestação de Contas de Convênio',
    };

    // Municipio
    const municipioMatch = text.match(this.regexPatterns.municipioCode);
    if (municipioMatch) {
      descritor.municipio = parseInt(municipioMatch[0].match(/\d+/)?.[0] || '0');
    }

    // Entidade
    const entidadeMatch = text.match(this.regexPatterns.entidadeCode);
    if (entidadeMatch) {
      descritor.entidade = parseInt(entidadeMatch[0].match(/\d+/)?.[0] || '0');
    }

    // Ano
    const anoMatch = text.match(this.regexPatterns.anoReferencia);
    if (anoMatch) {
      descritor.ano = parseInt(anoMatch[0].match(/\d{4}/)?.[0] || new Date().getFullYear().toString());
    } else {
      descritor.ano = new Date().getFullYear();
    }

    // Mês
    const mesMatch = text.match(this.regexPatterns.mesReferencia);
    if (mesMatch) {
      descritor.mes = parseInt(mesMatch[0].match(/\d{1,2}/)?.[0] || '12');
    } else {
      descritor.mes = new Date().getMonth() + 1;
    }

    return descritor;
  }

  /**
   * Extrai código do ajuste do texto
   */
  private extrairCodigoAjuste(text: string): string {
    const match = text.match(this.regexPatterns.codigoAjuste);
    if (match) {
      const codigo = match[0].match(/\d{15,19}/)?.[0];
      return codigo || '';
    }
    return '';
  }

  /**
   * Detecta seções/tabelas no PDF
   */
  private detectarSecoes(text: string): Record<string, string[]> {
    const secoes: Record<string, string[]> = {};
    
    // Mapeamento de palavras-chave para seções
    const mapeamento = {
      'relacao_empregados': ['empregado', 'servidor', 'pessoal', 'recursos humanos', 'rh'],
      'relacao_bens': ['bem', 'móvel', 'imóvel', 'patrimônio', 'ativo fixo'],
      'contratos': ['contrato', 'fornecedor', 'prestador'],
      'documentos_fiscais': ['nota fiscal', 'nf', 'documento fiscal', 'recibo'],
      'pagamentos': ['pagamento', 'desembolso', 'saída', 'comprovante pagto'],
      'disponibilidades': ['saldo', 'disponibilidade', 'caixa', 'fundo fixo'],
      'receitas': ['receita', 'entrada', 'arrecadação', 'repasse'],
      'glosas': ['glosa', 'desconto', 'impugnação'],
      'empenhos': ['empenho', 'compromisso'],
    };

    // Extrair linhas do texto
    const linhas = text.split('\n');
    let secaoAtual: string | null = null;

    for (const linha of linhas) {
      const linhaLower = linha.toLowerCase();
      
      // Detectar mudança de seção
      for (const [secao, palavrasChave] of Object.entries(mapeamento)) {
        if (palavrasChave.some(palavra => linhaLower.includes(palavra))) {
          secaoAtual = secao;
          if (!secoes[secao]) {
            secoes[secao] = [];
          }
          break;
        }
      }

      // Adicionar linha à seção atual
      if (secaoAtual) {
        secoes[secaoAtual].push(linha);
      }
    }

    return secoes;
  }

  /**
   * Extrai tabelas estruturadas do PDF
   */
  private extrairTabelas(text: string): any[] {
    const tabelas: any[] = [];
    const tabelasMatch = text.match(this.regexPatterns.tabelas);

    if (tabelasMatch) {
      for (const tabelaText of tabelasMatch) {
        const linhas = tabelaText.split('\n').filter(l => l.trim());
        
        if (linhas.length > 1) {
          const headers = linhas[0].split(/\s{2,}|\t/).filter(h => h.trim());
          const rows: any[] = [];

          for (let i = 1; i < linhas.length; i++) {
            const cells = linhas[i].split(/\s{2,}|\t/).filter(c => c.trim());
            if (cells.length > 0) {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header.toLowerCase().replace(/\s+/g, '_')] = cells[index] || '';
              });
              rows.push(row);
            }
          }

          if (rows.length > 0) {
            tabelas.push({
              headers,
              rows,
              rowCount: rows.length,
            });
          }
        }
      }
    }

    return tabelas;
  }

  /**
   * Extrai valores monetários
   */
  private extrairValores(text: string): number[] {
    const valores: number[] = [];
    const matches = text.match(this.regexPatterns.valores);

    if (matches) {
      for (const match of matches) {
        const valorStr = match.replace(/[^\d.,]/g, '').replace(',', '.');
        const valor = parseFloat(valorStr);
        if (!isNaN(valor)) {
          valores.push(valor);
        }
      }
    }

    return valores;
  }

  /**
   * Extrai CPFs do texto
   */
  private extrairCPFs(text: string): string[] {
    return text.match(this.regexPatterns.cpf) || [];
  }

  /**
   * Extrai CNPJs do texto
   */
  private extrairCNPJs(text: string): string[] {
    return text.match(this.regexPatterns.cnpj) || [];
  }

  /**
   * Extrai datas do texto
   */
  private extrairDatas(text: string): string[] {
    return text.match(this.regexPatterns.data) || [];
  }

  /**
   * Mapeia dados extraídos para o schema completo
   */
  public mapearParaSchema(pdfData: ExtractedPDFData): Partial<PrestacaoContasSchema> {
    const text = pdfData.fullText.toLowerCase();

    const schema: Partial<PrestacaoContasSchema> = {
      descritor: this.extrairDescritor(text) as any,
      codigo_ajuste: this.extrairCodigoAjuste(text),
      retificacao: text.includes('retificação') || text.includes('retificacao'),
      relacao_empregados: [],
      relacao_bens: {
        relacao_bens_moveis_adquiridos: [],
        relacao_bens_moveis_cedidos: [],
        relacao_bens_moveis_baixados_devolvidos: [],
        relacao_bens_imoveis_adquiridos: [],
        relacao_bens_imoveis_cedidos: [],
        relacao_bens_imoveis_baixados_devolvidos: [],
      },
      contratos: [],
      documentos_fiscais: [],
      pagamentos: [],
      disponibilidades: {
        saldos: [],
        saldo_fundo_fixo: 0,
      },
      receitas: {
        receitas_aplic_financ_repasses_publicos_municipais: 0,
        receitas_aplic_financ_repasses_publicos_estaduais: 0,
        receitas_aplic_financ_repasses_publicos_federais: 0,
        repasses_recebidos: [],
        outras_receitas: [],
        recursos_proprios: [],
      },
      ajustes_saldo: {
        retificacao_repasses: [],
        inclusao_repasses: [],
        retificacao_pagamentos: [],
        inclusao_pagamentos: [],
      },
      servidores_cedidos: [],
      descontos: [],
      devolucoes: [],
      glosas: [],
      empenhos: [],
      repasses: [],
      relatorio_atividades: {
        programas: [],
      },
      dados_gerais_entidade_beneficiaria: {
        identificacao_certidao_dados_gerais: '',
        identificacao_certidao_corpo_diretivo: '',
        identificacao_certidao_membros_conselho: '',
      },
      responsaveis_membros_orgao_concessor: {
        identificacao_certidao_responsaveis: '',
        identificacao_certidao_membros_comissao_avaliacao: '',
        identificacao_certidao_membros_controle_interno: '',
        identificacao_certidao_responsaveis_fiscalizacao_execucao: '',
      },
      declaracoes: {
        houve_contratacao_empresas_pertencentes: false,
        empresas_pertencentes: [],
        houve_participacao_quadro_diretivo_administrativo: false,
        participacoes_quadro_diretivo_administrativo: [],
      },
      relatorio_governamental_analise_execucao: {
        houve_emissao_relatorio_final: false,
        conclusao_relatorio: 0,
        justificativa: '',
      },
      demonstracoes_contabeis: {
        publicacoes: [],
        responsavel: {},
      },
      publicacoes_parecer_ata: [],
      prestacao_contas_entidade_beneficiaria: {
        data_prestacao: new Date().toISOString().split('T')[0],
        periodo_referencia_data_inicial: `${(this.extrairDescritor(text) as any).ano}-01-01`,
        periodo_referencia_data_final: `${(this.extrairDescritor(text) as any).ano}-12-31`,
      },
      parecer_conclusivo: {
        identificacao_parecer: '',
        conclusao_parecer: 0,
        consideracoes_parecer: '',
        declaracoes: [],
      },
      transparencia: {
        entidade_beneficiaria_mantem_sitio_internet: false,
        sitios_internet: [],
      },
    };

    // Detectar seções e extrair dados específicos
    const secoes = this.detectarSecoes(pdfData.fullText);
    const tabelas = this.extrairTabelas(pdfData.fullText);
    const cpfs = this.extrairCPFs(pdfData.fullText);
    const cnpjs = this.extrairCNPJs(pdfData.fullText);
    const valores = this.extrairValores(pdfData.fullText);
    const datas = this.extrairDatas(pdfData.fullText);

    // Preencher informações adicionais
    if (cpfs.length > 0 && schema.dados_gerais_entidade_beneficiaria) {
      schema.dados_gerais_entidade_beneficiaria.identificacao_certidao_dados_gerais = cpfs[0];
    }

    if (cnpjs.length > 0 && schema.receitas) {
      schema.receitas.recursos_proprios = [{ cnpj: cnpjs[0], valor: valores[0] || 0 }];
    }

    if (datas.length > 0 && schema.prestacao_contas_entidade_beneficiaria) {
      schema.prestacao_contas_entidade_beneficiaria.data_prestacao = datas[0];
    }

    // Adicionar metadados úteis
    return {
      ...schema,
      _metadata: {
        secoes_detectadas: Object.keys(secoes),
        tabelas_encontradas: tabelas.length,
        cpfs_extraidos: cpfs.length,
        cnpjs_extraidos: cnpjs.length,
        valores_extraidos: valores.length,
        datas_extraidas: datas.length,
      },
    } as any;
  }

  /**
   * Valida dados contra o schema
   */
  public validarContraSchema(dados: Partial<PrestacaoContasSchema>): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Validar campos obrigatórios
    const camposObrigatorios = [
      'descritor',
      'codigo_ajuste',
      'relacao_empregados',
      'relacao_bens',
      'contratos',
      'documentos_fiscais',
      'pagamentos',
      'disponibilidades',
      'receitas',
      'ajustes_saldo',
      'servidores_cedidos',
      'descontos',
      'devolucoes',
      'glosas',
      'empenhos',
      'repasses',
    ];

    for (const campo of camposObrigatorios) {
      if (!dados[campo as keyof PrestacaoContasSchema]) {
        erros.push(`Campo obrigatório faltando: ${campo}`);
      }
    }

    // Validar descritor
    if (dados.descritor) {
      if (!dados.descritor.tipo_documento) erros.push('Descritor: tipo_documento é obrigatório');
      if (!dados.descritor.municipio || dados.descritor.municipio <= 0) erros.push('Descritor: municipio inválido');
      if (!dados.descritor.entidade || dados.descritor.entidade <= 0) erros.push('Descritor: entidade inválida');
      if (!dados.descritor.ano || dados.descritor.ano < 2000) erros.push('Descritor: ano inválido');
      if (!dados.descritor.mes || dados.descritor.mes < 1 || dados.descritor.mes > 12) erros.push('Descritor: mês inválido');
    }

    // Validar código ajuste (15-19 dígitos)
    if (dados.codigo_ajuste && !/^\d{15,19}$/.test(dados.codigo_ajuste)) {
      erros.push('Código de ajuste deve ter 15-19 dígitos');
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  }

  /**
   * Sugere preenchimento automático baseado em padrões
   */
  public sugerirPreenchimento(pdfData: ExtractedPDFData): Record<string, any> {
    const sugestoes: Record<string, any> = {};
    const text = pdfData.fullText.toLowerCase();

    // Sugerir retificação
    if (text.includes('retificação') || text.includes('retificacao')) {
      sugestoes.retificacao = true;
    }

    // Sugerir presença de tabelas
    if (text.includes('tabela') || text.includes('quadro')) {
      sugestoes.temTabelas = true;
    }

    // Sugerir presença de documentação
    if (text.includes('documento') || text.includes('anexo')) {
      sugestoes.temDocumentacao = true;
    }

    // Sugerir presença de responsáveis
    if (text.includes('responsável') || text.includes('assinatura')) {
      sugestoes.temResponsaveis = true;
    }

    return sugestoes;
  }
}

export default new SchemaMapperService();
