/**
 * Schema Mapping Service
 * Maps OCR extracted data and PDF data to the Prestação de Contas schema structure
 */

export interface SchemaMappingResult {
  success: boolean;
  data: any;
  missingFields: string[];
  warnings: string[];
}

// Prestação de Contas Schema Structure
const PRESTACAO_SCHEMA = {
  descritor: {
    tipo_documento: 'Prestação de Contas de Convênio',
    municipio: 'number',
    entidade: 'number',
    ano: 'number',
    mes: 'number',
  },
  codigo_ajuste: 'string',
  retificacao: 'boolean',
  relacao_empregados: 'array',
  relacao_bens: 'object',
  contratos: 'array',
  documentos_fiscais: 'array',
  pagamentos: 'array',
  disponibilidades: 'object',
  receitas: 'object',
  ajustes_saldo: 'object',
  servidores_cedidos: 'array',
  descontos: 'array',
  devolucoes: 'array',
  glosas: 'array',
  empenhos: 'array',
  repasses: 'array',
  relatorio_atividades: 'object',
  dados_gerais_entidade_beneficiaria: 'object',
  responsaveis_membros_orgao_concessor: 'object',
  declaracoes: 'object',
  relatorio_governamental_analise_execucao: 'object',
  demonstracoes_contabeis: 'object',
  publicacoes_parecer_ata: 'array',
  prestacao_contas_entidade_beneficiaria: 'object',
  parecer_conclusivo: 'object',
  transparencia: 'object',
};

export class SchemaMappingService {
  /**
   * Mapeia dados extraídos do PDF para a estrutura do schema
   */
  static mapPDFDataToSchema(extractedData: any, formData: any): SchemaMappingResult {
    const result: SchemaMappingResult = {
      success: true,
      data: {},
      missingFields: [],
      warnings: [],
    };

    try {
      // Mapear descritor
      result.data.descritor = this.mapDescritor(extractedData, formData);

      // Mapear campos obrigatórios
      result.data.codigo_ajuste = extractedData.codigo_ajuste || formData.codigo_ajuste || '';
      result.data.retificacao = extractedData.retificacao || formData.retificacao || false;

      // Mapear arrays e objetos
      result.data.relacao_empregados = this.mapRelacaoEmpregados(extractedData);
      result.data.relacao_bens = this.mapRelacaoBens(extractedData);
      result.data.contratos = this.mapContratos(extractedData);
      result.data.documentos_fiscais = this.mapDocumentosFiscais(extractedData);
      result.data.pagamentos = this.mapPagamentos(extractedData);
      result.data.disponibilidades = this.mapDisponibilidades(extractedData);
      result.data.receitas = this.mapReceitas(extractedData);
      result.data.ajustes_saldo = this.mapAjustesSaldo(extractedData);
      result.data.servidores_cedidos = this.mapServidoresCedidos(extractedData);
      result.data.descontos = this.mapDescontos(extractedData);
      result.data.devolucoes = this.mapDevolucoes(extractedData);
      result.data.glosas = this.mapGlosas(extractedData);
      result.data.empenhos = this.mapEmpenhos(extractedData);
      result.data.repasses = this.mapRepasses(extractedData);
      result.data.relatorio_atividades = this.mapRelatorioAtividades(extractedData);
      result.data.dados_gerais_entidade_beneficiaria = this.mapDadosEntidade(extractedData);
      result.data.responsaveis_membros_orgao_concessor = this.mapResponsaveis(extractedData);
      result.data.declaracoes = this.mapDeclaracoes(extractedData);
      result.data.relatorio_governamental_analise_execucao = this.mapRelatorioGovernamental(extractedData);
      result.data.demonstracoes_contabeis = this.mapDemonstracoes(extractedData);
      result.data.publicacoes_parecer_ata = this.mapPublicacoes(extractedData);
      result.data.prestacao_contas_entidade_beneficiaria = this.mapPrestacaoEntidade(extractedData);
      result.data.parecer_conclusivo = this.mapParecer(extractedData);
      result.data.transparencia = this.mapTransparencia(extractedData);

      // Verificar campos obrigatórios
      result.missingFields = this.validateRequiredFields(result.data);
      result.success = result.missingFields.length === 0;

    } catch (error) {
      result.success = false;
      result.warnings.push(`Erro ao mapear dados: ${error}`);
    }

    return result;
  }

  /**
   * Mapeia dados do descritor
   */
  private static mapDescritor(extractedData: any, formData: any) {
    return {
      tipo_documento: 'Prestação de Contas de Convênio',
      municipio: this.extractNumber(extractedData.municipio || formData.municipio),
      entidade: this.extractNumber(extractedData.entidade || formData.entidade),
      ano: new Date().getFullYear(),
      mes: 12,
    };
  }

  /**
   * Mapeia relação de empregados
   */
  private static mapRelacaoEmpregados(extractedData: any) {
    if (!Array.isArray(extractedData.relacao_empregados)) {
      return [];
    }

    return extractedData.relacao_empregados.map((emp: any) => ({
      cpf: this.normalizeCPF(emp.cpf || ''),
      data_admissao: emp.data_admissao || '',
      data_demissao: emp.data_demissao || null,
      cbo: emp.cbo || '',
      cns: emp.cns || '',
      salario_contratual: this.extractNumber(emp.salario_contratual),
      periodos_remuneracao: emp.periodos_remuneracao || [],
    }));
  }

  /**
   * Mapeia relação de bens
   */
  private static mapRelacaoBens(extractedData: any) {
    return {
      relacao_bens_moveis_adquiridos: extractedData.relacao_bens_moveis_adquiridos || [],
      relacao_bens_moveis_cedidos: extractedData.relacao_bens_moveis_cedidos || [],
      relacao_bens_moveis_baixados_devolvidos: extractedData.relacao_bens_moveis_baixados_devolvidos || [],
      relacao_bens_imoveis_adquiridos: extractedData.relacao_bens_imoveis_adquiridos || [],
      relacao_bens_imoveis_cedidos: extractedData.relacao_bens_imoveis_cedidos || [],
      relacao_bens_imoveis_baixados_devolvidos: extractedData.relacao_bens_imoveis_baixados_devolvidos || [],
    };
  }

  /**
   * Mapeia contratos
   */
  private static mapContratos(extractedData: any) {
    if (!Array.isArray(extractedData.contratos)) {
      return [];
    }

    return extractedData.contratos.map((contrato: any) => ({
      numero: contrato.numero || '',
      credor: contrato.credor || { documento_tipo: 1, documento_numero: '', nome: '' },
      data_assinatura: contrato.data_assinatura || '',
      vigencia_tipo: contrato.vigencia_tipo || 1,
      vigencia_data_inicial: contrato.vigencia_data_inicial || '',
      vigencia_data_final: contrato.vigencia_data_final || '',
      objeto: contrato.objeto || '',
      natureza_contratacao: contrato.natureza_contratacao || [],
      criterio_selecao: contrato.criterio_selecao || 1,
      valor_montante: this.extractNumber(contrato.valor_montante),
      valor_tipo: contrato.valor_tipo || 1,
    }));
  }

  /**
   * Mapeia documentos fiscais
   */
  private static mapDocumentosFiscais(extractedData: any) {
    if (!Array.isArray(extractedData.documentos_fiscais)) {
      return [];
    }

    return extractedData.documentos_fiscais.map((doc: any) => ({
      numero: doc.numero || '',
      credor: doc.credor || { documento_tipo: 1, documento_numero: '', nome: '' },
      descricao: doc.descricao || '',
      data_emissao: doc.data_emissao || '',
      valor_bruto: this.extractNumber(doc.valor_bruto),
      valor_encargos: this.extractNumber(doc.valor_encargos),
      categoria_despesas_tipo: doc.categoria_despesas_tipo || 1,
      rateio_proveniente_tipo: doc.rateio_proveniente_tipo || 1,
    }));
  }

  /**
   * Mapeia pagamentos
   */
  private static mapPagamentos(extractedData: any) {
    if (!Array.isArray(extractedData.pagamentos)) {
      return [];
    }

    return extractedData.pagamentos.map((pag: any) => ({
      pagamento_data: pag.pagamento_data || '',
      pagamento_valor: this.extractNumber(pag.pagamento_valor),
      fonte_recurso_tipo: pag.fonte_recurso_tipo || 1,
      meio_pagamento_tipo: pag.meio_pagamento_tipo || 1,
      banco: pag.banco || null,
      agencia: pag.agencia || null,
    }));
  }

  /**
   * Mapeia disponibilidades
   */
  private static mapDisponibilidades(extractedData: any) {
    return {
      saldos: Array.isArray(extractedData.saldos) ? extractedData.saldos : [],
      saldo_fundo_fixo: this.extractNumber(extractedData.saldo_fundo_fixo),
    };
  }

  /**
   * Mapeia receitas
   */
  private static mapReceitas(extractedData: any) {
    return {
      receitas_aplic_financ_repasses_publicos_municipais: this.extractNumber(
        extractedData.receitas_aplic_financ_repasses_publicos_municipais
      ),
      receitas_aplic_financ_repasses_publicos_estaduais: this.extractNumber(
        extractedData.receitas_aplic_financ_repasses_publicos_estaduais
      ),
      receitas_aplic_financ_repasses_publicos_federais: this.extractNumber(
        extractedData.receitas_aplic_financ_repasses_publicos_federais
      ),
      repasses_recebidos: Array.isArray(extractedData.repasses_recebidos) ? extractedData.repasses_recebidos : [],
      outras_receitas: Array.isArray(extractedData.outras_receitas) ? extractedData.outras_receitas : [],
      recursos_proprios: Array.isArray(extractedData.recursos_proprios) ? extractedData.recursos_proprios : [],
    };
  }

  /**
   * Mapeia ajustes de saldo
   */
  private static mapAjustesSaldo(extractedData: any) {
    return {
      retificacao_repasses: Array.isArray(extractedData.retificacao_repasses) ? extractedData.retificacao_repasses : [],
      inclusao_repasses: Array.isArray(extractedData.inclusao_repasses) ? extractedData.inclusao_repasses : [],
      retificacao_pagamentos: Array.isArray(extractedData.retificacao_pagamentos)
        ? extractedData.retificacao_pagamentos
        : [],
      inclusao_pagamentos: Array.isArray(extractedData.inclusao_pagamentos) ? extractedData.inclusao_pagamentos : [],
    };
  }

  /**
   * Mapeia servidores cedidos
   */
  private static mapServidoresCedidos(extractedData: any) {
    if (!Array.isArray(extractedData.servidores_cedidos)) {
      return [];
    }

    return extractedData.servidores_cedidos.map((servidor: any) => ({
      cpf: this.normalizeCPF(servidor.cpf || ''),
      data_inicial_cessao: servidor.data_inicial_cessao || '',
      data_final_cessao: servidor.data_final_cessao || '',
      cargo_publico_ocupado: servidor.cargo_publico_ocupado || '',
      funcao_desempenhada_entidade_beneficiaria: servidor.funcao_desempenhada_entidade_beneficiaria || '',
      onus_pagamento: servidor.onus_pagamento || 1,
      periodos_cessao: servidor.periodos_cessao || [],
    }));
  }

  /**
   * Mapeia descontos
   */
  private static mapDescontos(extractedData: any) {
    if (!Array.isArray(extractedData.descontos)) {
      return [];
    }

    return extractedData.descontos.map((desc: any) => ({
      data: desc.data || '',
      descricao: desc.descricao || '',
      valor: this.extractNumber(desc.valor),
    }));
  }

  /**
   * Mapeia devoluções
   */
  private static mapDevolucoes(extractedData: any) {
    if (!Array.isArray(extractedData.devolucoes)) {
      return [];
    }

    return extractedData.devolucoes.map((dev: any) => ({
      data: dev.data || '',
      natureza_devolucao_tipo: dev.natureza_devolucao_tipo || 1,
      valor: this.extractNumber(dev.valor),
    }));
  }

  /**
   * Mapeia glosas
   */
  private static mapGlosas(extractedData: any) {
    if (!Array.isArray(extractedData.glosas)) {
      return [];
    }

    return extractedData.glosas.map((glosa: any) => ({
      resultado_analise: glosa.resultado_analise || 1,
      valor_glosa: this.extractNumber(glosa.valor_glosa),
    }));
  }

  /**
   * Mapeia empenhos
   */
  private static mapEmpenhos(extractedData: any) {
    if (!Array.isArray(extractedData.empenhos)) {
      return [];
    }

    return extractedData.empenhos.map((emp: any) => ({
      numero: emp.numero || '',
      data_emissao: emp.data_emissao || '',
      classificacao_economica_tipo: emp.classificacao_economica_tipo || '',
      fonte_recurso_tipo: emp.fonte_recurso_tipo || 1,
      valor: this.extractNumber(emp.valor),
      historico: emp.historico || '',
      cpf_ordenador_despesa: this.normalizeCPF(emp.cpf_ordenador_despesa || ''),
    }));
  }

  /**
   * Mapeia repasses
   */
  private static mapRepasses(extractedData: any) {
    if (!Array.isArray(extractedData.repasses)) {
      return [];
    }

    return extractedData.repasses.map((rep: any) => ({
      data_repasse: rep.data_repasse || '',
      valor_repasse: this.extractNumber(rep.valor_repasse),
      tipo_documento_bancario: rep.tipo_documento_bancario || 1,
      numero_documento: rep.numero_documento || '',
      banco: rep.banco || 1,
      agencia: rep.agencia || '',
      conta: rep.conta || '',
    }));
  }

  /**
   * Mapeia relatório de atividades
   */
  private static mapRelatorioAtividades(extractedData: any) {
    return {
      programas: Array.isArray(extractedData.programas) ? extractedData.programas : [],
    };
  }

  /**
   * Mapeia dados da entidade beneficiária
   */
  private static mapDadosEntidade(extractedData: any) {
    return {
      identificacao_certidao_dados_gerais: extractedData.identificacao_certidao_dados_gerais || '',
      identificacao_certidao_corpo_diretivo: extractedData.identificacao_certidao_corpo_diretivo || '',
      identificacao_certidao_membros_conselho: extractedData.identificacao_certidao_membros_conselho || '',
    };
  }

  /**
   * Mapeia responsáveis
   */
  private static mapResponsaveis(extractedData: any) {
    return {
      identificacao_certidao_responsaveis: extractedData.identificacao_certidao_responsaveis || '',
      identificacao_certidao_membros_comissao_avaliacao: extractedData.identificacao_certidao_membros_comissao_avaliacao || '',
      identificacao_certidao_membros_controle_interno: extractedData.identificacao_certidao_membros_controle_interno || '',
    };
  }

  /**
   * Mapeia declarações
   */
  private static mapDeclaracoes(extractedData: any) {
    return {
      houve_contratacao_empresas_pertencentes: extractedData.houve_contratacao_empresas_pertencentes || false,
      empresas_pertencentes: Array.isArray(extractedData.empresas_pertencentes) ? extractedData.empresas_pertencentes : [],
      houve_participacao_quadro_diretivo_administrativo:
        extractedData.houve_participacao_quadro_diretivo_administrativo || false,
      participacoes_quadro_diretivo_administrativo: Array.isArray(
        extractedData.participacoes_quadro_diretivo_administrativo
      )
        ? extractedData.participacoes_quadro_diretivo_administrativo
        : [],
    };
  }

  /**
   * Mapeia relatório governamental
   */
  private static mapRelatorioGovernamental(extractedData: any) {
    return {
      houve_emissao_relatorio_final: extractedData.houve_emissao_relatorio_final || false,
      conclusao_relatorio: extractedData.conclusao_relatorio || 1,
      justificativa: extractedData.justificativa || '',
    };
  }

  /**
   * Mapeia demonstrações contábeis
   */
  private static mapDemonstracoes(extractedData: any) {
    return {
      publicacoes: Array.isArray(extractedData.publicacoes) ? extractedData.publicacoes : [],
      responsavel: extractedData.responsavel || {},
    };
  }

  /**
   * Mapeia publicações
   */
  private static mapPublicacoes(extractedData: any) {
    if (!Array.isArray(extractedData.publicacoes_parecer_ata)) {
      return [];
    }

    return extractedData.publicacoes_parecer_ata.map((pub: any) => ({
      tipo_parecer_ata: pub.tipo_parecer_ata || 1,
      houve_publicacao: pub.houve_publicacao || false,
      publicacoes: Array.isArray(pub.publicacoes) ? pub.publicacoes : [],
      conclusao_parecer: pub.conclusao_parecer || 1,
    }));
  }

  /**
   * Mapeia prestação da entidade
   */
  private static mapPrestacaoEntidade(extractedData: any) {
    return {
      data_prestacao: extractedData.data_prestacao || new Date().toISOString().split('T')[0],
      periodo_referencia_data_inicial: extractedData.periodo_referencia_data_inicial || '',
      periodo_referencia_data_final: extractedData.periodo_referencia_data_final || '',
    };
  }

  /**
   * Mapeia parecer
   */
  private static mapParecer(extractedData: any) {
    return {
      identificacao_parecer: extractedData.identificacao_parecer || '',
      conclusao_parecer: extractedData.conclusao_parecer || 1,
      consideracoes_parecer: extractedData.consideracoes_parecer || '',
      declaracoes: Array.isArray(extractedData.parecer_declaracoes) ? extractedData.parecer_declaracoes : [],
    };
  }

  /**
   * Mapeia transparência
   */
  private static mapTransparencia(extractedData: any) {
    return {
      entidade_beneficiaria_mantem_sitio_internet: extractedData.entidade_beneficiaria_mantem_sitio_internet || false,
      sitios_internet: Array.isArray(extractedData.sitios_internet) ? extractedData.sitios_internet : [],
      requisitos_artigos_7o_8o_paragrafo_1o: Array.isArray(extractedData.requisitos_artigos_7o_8o_paragrafo_1o)
        ? extractedData.requisitos_artigos_7o_8o_paragrafo_1o
        : [],
      requisitos_sitio_artigo_8o_paragrafo_3o: Array.isArray(extractedData.requisitos_sitio_artigo_8o_paragrafo_3o)
        ? extractedData.requisitos_sitio_artigo_8o_paragrafo_3o
        : [],
      requisitos_divulgacao_informacoes: Array.isArray(extractedData.requisitos_divulgacao_informacoes)
        ? extractedData.requisitos_divulgacao_informacoes
        : [],
    };
  }

  /**
   * Valida campos obrigatórios
   */
  private static validateRequiredFields(data: any): string[] {
    const missingFields: string[] = [];
    const requiredFields = [
      'descritor',
      'codigo_ajuste',
      'relacao_empregados',
      'relacao_bens',
      'contratos',
      'documentos_fiscais',
      'pagamentos',
      'disponibilidades',
      'receitas',
    ];

    requiredFields.forEach((field) => {
      if (!data[field]) {
        missingFields.push(field);
      }
    });

    return missingFields;
  }

  /**
   * Utilidades de conversão
   */
  private static extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private static normalizeCPF(cpf: string): string {
    return cpf.replace(/\D/g, '').padStart(11, '0').slice(0, 11);
  }
}

export default SchemaMappingService;
