/**
 * Serviço de JSON - Importação/Exportação de dados AUDESP
 * Bi-directional sync entre JSON e Formulário
 */

import { PrestacaoContasAudesp } from './audespSchemaTypes';

export interface JsonImportResult {
  success: boolean;
  data?: Partial<PrestacaoContasAudesp>;
  errors: string[];
  warnings: string[];
}

export interface JsonExportOptions {
  includeEmptyFields?: boolean;
  prettyPrint?: boolean;
  includeMeta?: boolean;
}

/**
 * Gerencia importação e exportação de JSON conforme especificação AUDESP
 */
export class AudespJsonService {
  /**
   * Importa JSON oficial AUDESP para objeto TypeScript
   */
  static importJson(jsonString: string): JsonImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let data: any = null;

    // Parse JSON
    try {
      data = JSON.parse(jsonString);
    } catch (error: any) {
      errors.push(`Erro ao fazer parse do JSON: ${error.message}`);
      return { success: false, errors, warnings };
    }

    // Validar estrutura mínima
    if (!data || typeof data !== 'object') {
      errors.push('JSON deve ser um objeto válido');
      return { success: false, errors, warnings };
    }

    // Validar campos obrigatórios
    if (!data.descritor) {
      errors.push('Campo obrigatório ausente: descritor');
    }

    if (!data.municipio && !data.descritor?.municipio) {
      errors.push('Campo obrigatório ausente: municipio');
    }

    if (!data.receitas) {
      warnings.push('Campo recomendado ausente: receitas');
    }

    if (!data.pagamentos) {
      warnings.push('Campo recomendado ausente: pagamentos');
    }

    // Normalizar dados
    const normalized = this.normalizeData(data);

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    return {
      success: true,
      data: normalized,
      errors,
      warnings
    };
  }

  /**
   * Exporta dados do formulário como JSON AUDESP
   */
  static exportJson(
    data: Partial<PrestacaoContasAudesp>,
    options: JsonExportOptions = {}
  ): string {
    const {
      includeEmptyFields = false,
      prettyPrint = true,
      includeMeta = true
    } = options;

    // Limpar dados vazios se configurado
    let exportData = data;
    if (!includeEmptyFields) {
      exportData = this.removeEmptyFields(data);
    }

    // Adicionar metadados
    if (includeMeta) {
      (exportData as any)._meta = {
        exportedAt: new Date().toISOString(),
        version: '1.9',
        generator: 'AUDESP Form System'
      };
    }

    return JSON.stringify(exportData, null, prettyPrint ? 2 : 0);
  }

  /**
   * Valida se o JSON contém campos não permitidos
   * "Nenhum campo fora do JSON é permitido"
   */
  static hasUnknownFields(data: any): string[] {
    const allowedFields = new Set([
      'descritor',
      'codigo_ajuste',
      'relacao_empregados',
      'relacao_bens',
      'contratos',
      'documentos_fiscais',
      'pagamentos',
      'disponibilidades',
      'receitas',
      'servidores_cedidos',
      'descontos',
      'devolucoes',
      'glosas',
      'empenhos',
      'repasses',
      'declaracoes',
      'transparencia',
      'relatorio_atividades',
      'relatorio_governamental',
      'demonstracoes_contabeis',
      'publicacoes_parecer_ata',
      'parecer_conclusivo',
      'dados_gerais_entidade',
      'responsaveis_membros_orgao_concessor',
      '_meta'
    ]);

    const unknownFields: string[] = [];
    for (const key of Object.keys(data)) {
      if (!allowedFields.has(key)) {
        unknownFields.push(key);
      }
    }

    return unknownFields;
  }

  /**
   * Normaliza dados importados para o formato correto
   */
  private static normalizeData(data: any): Partial<PrestacaoContasAudesp> {
    const normalized: any = {};

    // Descritor
    if (data.descritor) {
      normalized.descritor = {
        municipio: data.descritor.municipio,
        entidade: data.descritor.entidade,
        ano: parseInt(String(data.descritor.ano), 10),
        mes: parseInt(String(data.descritor.mes), 10)
      };
    }

    // Empregados
    if (Array.isArray(data.relacao_empregados)) {
      normalized.relacao_empregados = data.relacao_empregados.map((emp: any) => ({
        cpf: emp.cpf?.replace(/\D/g, ''),
        cbo: emp.cbo,
        nome: emp.nome,
        salario_contratual: parseFloat(emp.salario_contratual),
        periodos_remuneracao: Array.isArray(emp.periodos_remuneracao) ? emp.periodos_remuneracao : []
      }));
    }

    // Bens
    if (data.relacao_bens) {
      normalized.relacao_bens = {
        relacao_bens_moveis_adquiridos: Array.isArray(data.relacao_bens.relacao_bens_moveis_adquiridos)
          ? data.relacao_bens.relacao_bens_moveis_adquiridos
          : [],
        relacao_bens_imoveis: Array.isArray(data.relacao_bens.relacao_bens_imoveis)
          ? data.relacao_bens.relacao_bens_imoveis
          : []
      };
    }

    // Contratos
    if (Array.isArray(data.contratos)) {
      normalized.contratos = data.contratos.map((c: any) => ({
        numero: c.numero,
        valor_montante: parseFloat(c.valor_montante),
        data_assinatura: c.data_assinatura,
        credor: c.credor,
        natureza_contratacao: c.natureza_contratacao
      }));
    }

    // Documentos Fiscais
    if (Array.isArray(data.documentos_fiscais)) {
      normalized.documentos_fiscais = data.documentos_fiscais.map((d: any) => ({
        numero: d.numero,
        valor_bruto: parseFloat(d.valor_bruto),
        valor_liquido: parseFloat(d.valor_liquido),
        encargos: parseFloat(d.encargos)
      }));
    }

    // Pagamentos
    if (Array.isArray(data.pagamentos)) {
      normalized.pagamentos = data.pagamentos.map((p: any) => ({
        pagamento_data: p.pagamento_data,
        pagamento_valor: parseFloat(p.pagamento_valor),
        numero_empenho: p.numero_empenho,
        numero_nota_fiscal: p.numero_nota_fiscal
      }));
    }

    // Disponibilidades
    if (data.disponibilidades) {
      normalized.disponibilidades = {
        saldos: data.disponibilidades.saldos || []
      };
    }

    // Receitas
    if (data.receitas) {
      normalized.receitas = {
        repasses: data.receitas.repasses || [],
        outras_receitas: data.receitas.outras_receitas || []
      };
    }

    // Copiar outros campos como estão
    const otherFields = [
      'codigo_ajuste',
      'servidores_cedidos',
      'descontos',
      'devolucoes',
      'glosas',
      'empenhos',
      'repasses',
      'declaracoes',
      'transparencia',
      'relatorio_atividades',
      'relatorio_governamental',
      'demonstracoes_contabeis',
      'publicacoes_parecer_ata',
      'parecer_conclusivo',
      'dados_gerais_entidade',
      'responsaveis_membros_orgao_concessor'
    ];

    for (const field of otherFields) {
      if (data[field] !== undefined && data[field] !== null) {
        normalized[field] = data[field];
      }
    }

    return normalized;
  }

  /**
   * Remove campos vazios do objeto
   */
  private static removeEmptyFields(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyFields(item)).filter(Boolean);
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (Array.isArray(value) && value.length === 0) continue;
        if (value === null || value === undefined || value === '') continue;
        result[key] = this.removeEmptyFields(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Gera template vazio baseado no schema
   */
  static generateEmptyTemplate(): Partial<PrestacaoContasAudesp> {
    return {
      descritor: {
        municipio: '',
        entidade: '',
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1
      },
      relacao_empregados: [],
      relacao_bens: {
        relacao_bens_moveis_adquiridos: [],
        relacao_bens_imoveis: []
      },
      contratos: [],
      documentos_fiscais: [],
      pagamentos: [],
      disponibilidades: {
        saldos: []
      },
      receitas: {
        repasses: [],
        outras_receitas: []
      },
      servidores_cedidos: [],
      descontos: [],
      devolucoes: [],
      glosas: [],
      empenhos: [],
      repasses: [],
      declaracoes: {},
      transparencia: {
        sitios_internet: []
      }
    };
  }

  /**
   * Compara dois JSONs e retorna diferenças
   */
  static diff(data1: any, data2: any, path = ''): Array<{ path: string; from: any; to: any }> {
    const differences: Array<{ path: string; from: any; to: any }> = [];

    const keys = new Set([...Object.keys(data1 || {}), ...Object.keys(data2 || {})]);

    for (const key of keys) {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = data1?.[key];
      const val2 = data2?.[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
          differences.push(...this.diff(val1, val2, currentPath));
        } else {
          differences.push({ path: currentPath, from: val1, to: val2 });
        }
      }
    }

    return differences;
  }
}
