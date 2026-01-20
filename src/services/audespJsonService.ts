import type { PrestacaoConta } from './audespSchemaTypes';
import { AUDESP_DEFAULT_TEMPLATE } from './audespSchemaTypes';

class AudespJsonService {
  /**
   * Importa dados de um arquivo JSON e valida a estrutura
   */
  importFromJSON(jsonString: string): Partial<PrestacaoConta> {
    try {
      const data = JSON.parse(jsonString);
      return this.mergeWithTemplate(data);
    } catch (error) {
      throw new Error('Erro ao fazer parse do JSON');
    }
  }

  /**
   * Exporta dados em formato JSON
   */
  exportToJSON(data: Partial<PrestacaoConta>): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Sincroniza dados com o template padrão
   * Adiciona campos faltantes com valores padrão
   */
  syncWithTemplate(data: Partial<PrestacaoConta>): PrestacaoConta {
    return this.mergeWithTemplate(data) as PrestacaoConta;
  }

  /**
   * Merge dados com template
   */
  private mergeWithTemplate(data: any): Partial<PrestacaoConta> {
    return {
      ...AUDESP_DEFAULT_TEMPLATE,
      ...data,
      entidade: {
        ...AUDESP_DEFAULT_TEMPLATE.entidade,
        ...(data?.entidade || {}),
      },
      responsavel: {
        ...AUDESP_DEFAULT_TEMPLATE.responsavel,
        ...(data?.responsavel || {}),
      },
      endereco: {
        ...AUDESP_DEFAULT_TEMPLATE.endereco,
        ...(data?.endereco || {}),
      },
      financeiro: {
        ...AUDESP_DEFAULT_TEMPLATE.financeiro,
        ...(data?.financeiro || {}),
      },
      patrimonio: {
        ...AUDESP_DEFAULT_TEMPLATE.patrimonio,
        ...(data?.patrimonio || {}),
      },
      conformidade: {
        ...AUDESP_DEFAULT_TEMPLATE.conformidade,
        ...(data?.conformidade || {}),
      },
      passivos: data?.passivos || [],
      contasBancarias: data?.contasBancarias || [],
      projetos: data?.projetos || [],
      atividades: data?.atividades || [],
      recursosHumanos: data?.recursosHumanos || [],
      parcerias: data?.parcerias || [],
      doacoes: data?.doacoes || [],
    };
  }

  /**
   * Obtém o template padrão
   */
  getTemplate(): PrestacaoConta {
    return structuredClone(AUDESP_DEFAULT_TEMPLATE);
  }

  /**
   * Valida se os dados têm a estrutura mínima
   */
  hasMinimalStructure(data: any): boolean {
    return !!(
      data?.entidade?.cnpj &&
      data?.responsavel?.cpf &&
      data?.financeiro?.receitaTotal !== undefined
    );
  }

  /**
   * Calcula valores derivados (resultado, saldo, etc)
   */
  calculateDerivedValues(data: Partial<PrestacaoConta>): Partial<PrestacaoConta> {
    if (data.financeiro) {
      const receitaTotal = data.financeiro.receitaTotal || 0;
      const despesaTotal = data.financeiro.despesaTotal || 0;

      return {
        ...data,
        financeiro: {
          ...data.financeiro,
          resultadoExercicio: receitaTotal - despesaTotal,
          saldo: (data.financeiro.saldo || 0) + (receitaTotal - despesaTotal),
        },
      };
    }
    return data;
  }

  /**
   * Gera sumário dos dados
   */
  generateSummary(data: Partial<PrestacaoConta>): {
    [key: string]: any;
  } {
    return {
      entidade: data.entidade?.nome || 'N/A',
      cnpj: data.entidade?.cnpj || 'N/A',
      responsavel: data.responsavel?.nome || 'N/A',
      exercicio: data.exercicio || 'N/A',
      receitaTotal: data.financeiro?.receitaTotal || 0,
      despesaTotal: data.financeiro?.despesaTotal || 0,
      resultado: (data.financeiro?.receitaTotal || 0) - (data.financeiro?.despesaTotal || 0),
      projetos: data.projetos?.length || 0,
      atividades: data.atividades?.length || 0,
      recursoHumano: data.recursosHumanos?.length || 0,
      parcerias: data.parcerias?.length || 0,
      doacoes: data.doacoes?.length || 0,
      dataUltimaAtualizacao: data.dataUltimaAtualizacao || new Date().toISOString(),
    };
  }

  /**
   * Valida campos obrigatórios
   */
  validateRequiredFields(
    data: Partial<PrestacaoConta>
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!data.entidade?.cnpj) missingFields.push('entidade.cnpj');
    if (!data.responsavel?.cpf) missingFields.push('responsavel.cpf');
    if (!data.responsavel?.email) missingFields.push('responsavel.email');
    if (!data.endereco?.cep) missingFields.push('endereco.cep');
    if (!data.financeiro?.receitaTotal) missingFields.push('financeiro.receitaTotal');

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }
}

export const audespJsonService = new AudespJsonService();
