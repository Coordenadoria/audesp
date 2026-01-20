import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import schemaOficial from '../schemas/audesp-schema-oficial.json';

export interface ValidationError {
  campo: string;
  mensagem: string;
  tipo: 'erro' | 'alerta' | 'info';
  caminho_json: string;
  valor_atual?: any;
}

export interface ValidationResult {
  valido: boolean;
  erros: ValidationError[];
  alertas: ValidationError[];
  info: ValidationError[];
  resumo: string;
  percentual_preenchimento: number;
}

class AudespecValidator {
  private ajv: Ajv;
  private validate: ValidateFunction;
  private statusPorSecao: Map<string, 'preenchido' | 'incompleto' | 'erro'> = new Map();

  // Regras de negócio customizadas (auditoria)
  private regrasAuditoria = {
    // Página 1: Validações de data
    datas_inversas: (data_inicio: string, data_fim: string) => {
      if (!data_inicio || !data_fim) return { valido: true };
      return {
        valido: new Date(data_inicio) <= new Date(data_fim),
        mensagem: 'Data de início não pode ser posterior à data de fim'
      };
    },

    // Página 2: Documentos não podem ter valor maior que contrato
    documento_maior_que_contrato: (
      valor_doc: number,
      contratos: any[]
    ) => {
      if (!contratos || contratos.length === 0) {
        return { valido: true };
      }
      const valor_total_contratos = contratos.reduce((acc, c) => acc + (c.valor_total || 0), 0);
      return {
        valido: valor_doc <= valor_total_contratos,
        mensagem: `Valor do documento (R$ ${valor_doc.toFixed(2)}) não pode ser maior que soma dos contratos (R$ ${valor_total_contratos.toFixed(2)})`
      };
    },

    // Página 3: Pagamento sem documento fiscal
    pagamento_sem_documento: (numero_doc: string) => {
      return {
        valido: !!numero_doc,
        mensagem: 'Pagamento deve estar associado a um documento fiscal'
      };
    },

    // Página 4: Soma de pagamentos diferente da soma de documentos
    soma_pagamentos_diferente: (
      total_pagamentos: number,
      total_documentos: number
    ) => {
      const diferenca = Math.abs(total_pagamentos - total_documentos);
      return {
        valido: diferenca < 0.01, // Tolerância de R$ 0.01 por arredondamento
        mensagem: `Soma dos pagamentos (R$ ${total_pagamentos.toFixed(2)}) diferente da soma dos documentos (R$ ${total_documentos.toFixed(2)}). Diferença: R$ ${diferenca.toFixed(2)}`,
        tipo: diferenca > 0 ? 'erro' : 'alerta'
      };
    },

    // Página 5: Vigência fora do intervalo de documentos
    vigencia_fora_intervalo: (
      data_inicio_vigencia: string,
      data_fim_vigencia: string,
      data_primeiro_doc: string,
      data_ultimo_doc: string
    ) => {
      const erros = [];

      if (data_primeiro_doc && new Date(data_primeiro_doc) < new Date(data_inicio_vigencia)) {
        erros.push('Documento emitido antes do início da vigência');
      }

      if (data_ultimo_doc && new Date(data_ultimo_doc) > new Date(data_fim_vigencia)) {
        erros.push('Documento emitido após o fim da vigência');
      }

      return {
        valido: erros.length === 0,
        mensagem: erros.join('. '),
        tipo: 'alerta'
      };
    },

    // Página 6: CPF inválido
    cpf_invalido: (cpf: string) => {
      if (!cpf || cpf.length !== 11) return { valido: false, mensagem: 'CPF deve ter 11 dígitos' };
      if (!/^\d+$/.test(cpf)) return { valido: false, mensagem: 'CPF deve conter apenas dígitos' };

      // Algoritmo de validação de CPF
      let soma = 0;
      let resto;

      for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      }

      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.substring(9, 10))) {
        return { valido: false, mensagem: 'CPF inválido (falha na validação de dígito)' };
      }

      soma = 0;
      for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      }

      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.substring(10, 11))) {
        return { valido: false, mensagem: 'CPF inválido (falha na validação de dígito)' };
      }

      return { valido: true };
    },

    // Página 7: CNPJ inválido
    cnpj_invalido: (cnpj: string) => {
      if (!cnpj || cnpj.length !== 14) return { valido: false, mensagem: 'CNPJ deve ter 14 dígitos' };
      if (!/^\d+$/.test(cnpj)) return { valido: false, mensagem: 'CNPJ deve conter apenas dígitos' };

      let soma = 0;
      let resto;

      const tamanho = cnpj.length - 2;
      let numeros = cnpj.substring(0, tamanho);
      const digitos = cnpj.substring(tamanho);
      let adicional = 5;

      for (let i = 0; i < tamanho; i++) {
        soma += numeros.charAt(i) * adicional;
        adicional--;
        if (adicional < 2) {
          adicional = 9;
        }
      }

      resto = soma % 11 < 2 ? 0 : 11 - (soma % 11);
      if (resto !== parseInt(digitos.charAt(0))) {
        return { valido: false, mensagem: 'CNPJ inválido (falha na validação de dígito)' };
      }

      soma = 0;
      numeros = cnpj.substring(0, tamanho + 1);
      adicional = 6;

      for (let i = 0; i < tamanho + 1; i++) {
        soma += numeros.charAt(i) * adicional;
        adicional--;
        if (adicional < 2) {
          adicional = 9;
        }
      }

      resto = soma % 11 < 2 ? 0 : 11 - (soma % 11);
      if (resto !== parseInt(digitos.charAt(1))) {
        return { valido: false, mensagem: 'CNPJ inválido (falha na validação de dígito)' };
      }

      return { valido: true };
    },

    // Página 8: Data de nascimento futura
    data_futura: (data: string) => {
      const hoje = new Date();
      const dataVerificar = new Date(data);
      return {
        valido: dataVerificar <= hoje,
        mensagem: 'Data não pode ser no futuro'
      };
    }
  };

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      messages: true
    });

    addFormats(this.ajv);

    // Registrar schemas customizados
    this.ajv.addSchema(schemaOficial);

    this.validate = this.ajv.compile(schemaOficial);
  }

  /**
   * Validar dados completos contra schema e regras de negócio
   */
  validarPrestacao(dados: any): ValidationResult {
    const erros: ValidationError[] = [];
    const alertas: ValidationError[] = [];
    const info: ValidationError[] = [];

    // 1. Validar contra schema JSON
    const schemaValido = this.validate(dados);

    if (!schemaValido && this.validate.errors) {
      for (const erro of this.validate.errors) {
        const validationError: ValidationError = {
          campo: erro.instancePath || 'root',
          mensagem: this.obterMensagemErro(erro),
          tipo: 'erro',
          caminho_json: erro.instancePath || 'root'
        };
        erros.push(validationError);
      }
    }

    // 2. Validações de negócio (auditoria)
    this.executarValidacoesNegocio(dados, erros, alertas);

    // 3. Calcular status por seção
    this.calcularStatusSecoes(dados, erros, alertas);

    // 4. Calcular percentual de preenchimento
    const percentual = this.calcularPercentualPreenchimento(dados);

    // 5. Gerar resumo
    const resumo = this.gerarResumo(erros, alertas, percentual);

    return {
      valido: erros.length === 0,
      erros,
      alertas,
      info,
      resumo,
      percentual_preenchimento: percentual
    };
  }

  /**
   * Validar campo individual
   */
  validarCampo(caminho: string, valor: any, dadosCompletos?: any): ValidationError[] {
    const erros: ValidationError[] = [];

    // Validar estrutura JSON
    const schemaParcial = this.obterSchemaParcial(caminho);
    if (schemaParcial) {
      const validateParcial = this.ajv.compile(schemaParcial);
      if (!validateParcial(valor) && validateParcial.errors) {
        for (const erro of validateParcial.errors) {
          erros.push({
            campo: caminho,
            mensagem: this.obterMensagemErro(erro),
            tipo: 'erro',
            caminho_json: caminho,
            valor_atual: valor
          });
        }
      }
    }

    return erros;
  }

  /**
   * Obter status visual de cada seção
   */
  obterStatusSecoes(): { secao: string; status: 'preenchido' | 'incompleto' | 'erro' }[] {
    return Array.from(this.statusPorSecao.entries()).map(([secao, status]) => ({
      secao,
      status
    }));
  }

  /**
   * Métodos privados
   */

  private executarValidacoesNegocio(dados: any, erros: ValidationError[], alertas: ValidationError[]) {
    // Validar CPF dos responsáveis
    if (dados.responsaveis && Array.isArray(dados.responsaveis)) {
      dados.responsaveis.forEach((resp: any, idx: number) => {
        const validacaoCpf = this.regrasAuditoria.cpf_invalido(resp.cpf);
        if (!validacaoCpf.valido) {
          erros.push({
            campo: `responsaveis[${idx}].cpf`,
            mensagem: validacaoCpf.mensagem,
            tipo: 'erro',
            caminho_json: `$.responsaveis[${idx}].cpf`,
            valor_atual: resp.cpf
          });
        }
      });
    }

    // Validar CNPJ da entidade
    if (dados.entidade_beneficiaria?.cnpj) {
      const validacaoCnpj = this.regrasAuditoria.cnpj_invalido(
        dados.entidade_beneficiaria.cnpj
      );
      if (!validacaoCnpj.valido) {
        erros.push({
          campo: 'entidade_beneficiaria.cnpj',
          mensagem: validacaoCnpj.mensagem,
          tipo: 'erro',
          caminho_json: '$.entidade_beneficiaria.cnpj',
          valor_atual: dados.entidade_beneficiaria.cnpj
        });
      }
    }

    // Validar datas
    if (dados.vigencia?.data_inicio && dados.vigencia?.data_fim) {
      const validacaoDatas = this.regrasAuditoria.datas_inversas(
        dados.vigencia.data_inicio,
        dados.vigencia.data_fim
      );
      if (!validacaoDatas.valido) {
        alertas.push({
          campo: 'vigencia',
          mensagem: validacaoDatas.mensagem,
          tipo: 'alerta',
          caminho_json: '$.vigencia'
        });
      }
    }

    // Validar soma pagamentos vs documentos
    if (dados.pagamentos && dados.documentos_fiscais) {
      const totalPagamentos = dados.pagamentos.reduce(
        (acc: number, p: any) => acc + (p.valor || 0),
        0
      );
      const totalDocumentos = dados.documentos_fiscais.reduce(
        (acc: number, d: any) => acc + (d.valor_liquido || d.valor_bruto || 0),
        0
      );

      const validacao = this.regrasAuditoria.soma_pagamentos_diferente(totalPagamentos, totalDocumentos);
      if (!validacao.valido) {
        (validacao.tipo === 'alerta' ? alertas : erros).push({
          campo: 'pagamentos / documentos_fiscais',
          mensagem: validacao.mensagem,
          tipo: validacao.tipo as 'erro' | 'alerta',
          caminho_json: '$.pagamentos / $.documentos_fiscais'
        });
      }
    }

    // Validar fornecedores nos documentos
    if (dados.documentos_fiscais && Array.isArray(dados.documentos_fiscais)) {
      dados.documentos_fiscais.forEach((doc: any, idx: number) => {
        if (doc.fornecedor_cnpj) {
          const validacaoCnpj = this.regrasAuditoria.cnpj_invalido(doc.fornecedor_cnpj);
          if (!validacaoCnpj.valido) {
            erros.push({
              campo: `documentos_fiscais[${idx}].fornecedor_cnpj`,
              mensagem: validacaoCnpj.mensagem,
              tipo: 'erro',
              caminho_json: `$.documentos_fiscais[${idx}].fornecedor_cnpj`,
              valor_atual: doc.fornecedor_cnpj
            });
          }
        }
      });
    }
  }

  private calcularStatusSecoes(dados: any, erros: ValidationError[], alertas: ValidationError[]) {
    const secoes = [
      'descricao',
      'entidade_beneficiaria',
      'vigencia',
      'responsaveis',
      'contratos',
      'documentos_fiscais',
      'pagamentos',
      'repasses',
      'empregados',
      'bens',
      'devolucoes',
      'glosas',
      'declaracoes',
      'relatorios',
      'parecer_conclusivo',
      'transparencia'
    ];

    for (const secao of secoes) {
      const errosSecao = erros.filter(e => e.caminho_json.startsWith(`$.${secao}`));
      const alertasSecao = alertas.filter(a => a.caminho_json.startsWith(`$.${secao}`));

      let status: 'preenchido' | 'incompleto' | 'erro' = 'incompleto';

      if (errosSecao.length > 0) {
        status = 'erro';
      } else if (dados[secao] && Object.keys(dados[secao]).length > 0) {
        status = alertasSecao.length > 0 ? 'incompleto' : 'preenchido';
      }

      this.statusPorSecao.set(secao, status);
    }
  }

  private calcularPercentualPreenchimento(dados: any): number {
    const secoes = [
      'descricao',
      'entidade_beneficiaria',
      'vigencia',
      'responsaveis',
      'contratos',
      'documentos_fiscais',
      'pagamentos'
    ];

    let preenchidas = 0;

    for (const secao of secoes) {
      if (dados[secao] && Object.keys(dados[secao]).length > 0) {
        preenchidas++;
      }
    }

    return Math.round((preenchidas / secoes.length) * 100);
  }

  private gerarResumo(erros: ValidationError[], alertas: ValidationError[], percentual: number): string {
    if (erros.length === 0 && alertas.length === 0) {
      return `✅ Dados válidos! Preenchimento: ${percentual}%`;
    }

    const linhas = [];
    if (erros.length > 0) {
      linhas.push(`❌ ${erros.length} erro(s) encontrado(s)`);
    }
    if (alertas.length > 0) {
      linhas.push(`⚠️ ${alertas.length} alerta(s)`);
    }
    linhas.push(`📊 Preenchimento: ${percentual}%`);

    return linhas.join(' | ');
  }

  private obterMensagemErro(erro: any): string {
    if (erro.keyword === 'required') {
      return `Campo obrigatório: ${erro.params.missingProperty}`;
    }
    if (erro.keyword === 'type') {
      return `Tipo inválido. Esperado: ${erro.params.type}`;
    }
    if (erro.keyword === 'pattern') {
      return `Formato inválido`;
    }
    if (erro.keyword === 'minLength') {
      return `Mínimo de ${erro.params.limit} caracteres`;
    }
    if (erro.keyword === 'maxLength') {
      return `Máximo de ${erro.params.limit} caracteres`;
    }
    if (erro.keyword === 'enum') {
      return `Valor inválido. Opções: ${erro.params.allowedValues.join(', ')}`;
    }
    if (erro.keyword === 'format') {
      return `Formato inválido: ${erro.params.format}`;
    }
    return erro.message || 'Erro na validação';
  }

  private obterSchemaParcial(caminho: string): any {
    const partes = caminho.split('.');
    let schema = schemaOficial;

    for (const parte of partes) {
      if (schema.properties && schema.properties[parte]) {
        schema = schema.properties[parte];
      }
    }

    return schema;
  }
}

export default new AudespecValidator();
