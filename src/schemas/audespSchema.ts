// JSON Schema AUDESP v1.9 - Completo com todas as validações

export const AUDESP_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Audesp Prestação de Contas v1.9",
  type: "object",
  required: [
    "descritor",
    "contratos",
    "documentos_fiscais",
    "pagamentos"
  ],
  properties: {
    descritor: {
      type: "object",
      required: ["tipo_documento", "municipio", "entidade", "ano", "mes"],
      properties: {
        tipo_documento: {
          type: "string",
          enum: [
            "Prestação de Contas de Convênio",
            "Prestação de Contas de Contrato de Gestão",
            "Prestação de Contas de Termo de Parceria",
            "Prestação de Contas de Termo de Fomento",
            "Prestação de Contas de Termo de Colaboração",
            "Declaração Negativa"
          ],
          description: "Tipo de documento sendo prestado"
        },
        municipio: {
          type: "number",
          minimum: 1,
          maximum: 99999,
          description: "Código IBGE do município"
        },
        entidade: {
          type: "number",
          minimum: 1,
          description: "Código da entidade responsável"
        },
        ano: {
          type: "number",
          minimum: 2000,
          maximum: 2050,
          description: "Ano de exercício"
        },
        mes: {
          type: "number",
          minimum: 1,
          maximum: 12,
          description: "Mês de exercício"
        }
      }
    },

    contratos: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["numero", "objeto", "data_assinatura", "data_vigencia_inicio", "data_vigencia_fim", "valor_total"],
        properties: {
          numero: {
            type: "string",
            pattern: "^[0-9\\/-]*$",
            description: "Número do contrato"
          },
          objeto: {
            type: "string",
            minLength: 3,
            maxLength: 500,
            description: "Descrição do objeto do contrato"
          },
          data_assinatura: {
            type: "string",
            format: "date",
            description: "Data de assinatura (YYYY-MM-DD)"
          },
          data_vigencia_inicio: {
            type: "string",
            format: "date",
            description: "Início da vigência"
          },
          data_vigencia_fim: {
            type: "string",
            format: "date",
            description: "Fim da vigência"
          },
          valor_total: {
            type: "number",
            minimum: 0,
            description: "Valor total do contrato"
          },
          empenho: {
            type: "string",
            description: "Número de empenho"
          },
          observacoes: {
            type: "string",
            description: "Observações adicionais"
          }
        }
      }
    },

    documentos_fiscais: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["tipo", "numero", "data_emissao", "valor_bruto"],
        properties: {
          tipo: {
            type: "string",
            enum: ["Nota Fiscal", "Fatura", "Recibo", "Nota Fiscal Eletrônica", "RPA", "Outro"],
            description: "Tipo de documento fiscal"
          },
          numero: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            description: "Número do documento"
          },
          serie: {
            type: "string",
            description: "Série do documento"
          },
          data_emissao: {
            type: "string",
            format: "date",
            description: "Data de emissão"
          },
          data_vencimento: {
            type: "string",
            format: "date",
            description: "Data de vencimento"
          },
          fornecedor_cnpj: {
            type: "string",
            pattern: "^[0-9]{14}$",
            description: "CNPJ do fornecedor (14 dígitos)"
          },
          fornecedor_cpf: {
            type: "string",
            pattern: "^[0-9]{11}$",
            description: "CPF do fornecedor (11 dígitos)"
          },
          valor_bruto: {
            type: "number",
            minimum: 0.01,
            description: "Valor bruto do documento"
          },
          desconto: {
            type: "number",
            minimum: 0,
            default: 0,
            description: "Desconto aplicado"
          },
          retencao_ir: {
            type: "number",
            minimum: 0,
            default: 0,
            description: "Retenção de IR"
          },
          retencao_inss: {
            type: "number",
            minimum: 0,
            default: 0,
            description: "Retenção de INSS"
          },
          retencao_iss: {
            type: "number",
            minimum: 0,
            default: 0,
            description: "Retenção de ISS"
          },
          valor_liquido: {
            type: "number",
            minimum: 0,
            description: "Valor líquido (calculado automaticamente)"
          },
          classificacao: {
            type: "string",
            description: "Classificação contábil"
          },
          contrato_numero: {
            type: "string",
            description: "Número do contrato relacionado"
          },
          observacoes: {
            type: "string",
            description: "Observações"
          }
        }
      }
    },

    pagamentos: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["data_pagamento", "numero_documento", "valor_pago"],
        properties: {
          numero_documento: {
            type: "string",
            minLength: 1,
            description: "Número do documento fiscal relacionado"
          },
          data_pagamento: {
            type: "string",
            format: "date",
            description: "Data do pagamento"
          },
          valor_pago: {
            type: "number",
            minimum: 0.01,
            description: "Valor pago"
          },
          forma_pagamento: {
            type: "string",
            enum: ["Transferência Bancária", "Cheque", "Crédito em Conta", "Boleto", "Pix", "Dinheiro", "Outro"],
            description: "Forma de pagamento"
          },
          numero_nota_fiscal: {
            type: "string",
            description: "Número da nota fiscal"
          },
          banco: {
            type: "string",
            description: "Banco utilizador"
          },
          agencia: {
            type: "string",
            description: "Agência bancária"
          },
          conta: {
            type: "string",
            description: "Número da conta"
          },
          comprovante: {
            type: "string",
            description: "Número do comprovante"
          },
          observacoes: {
            type: "string",
            description: "Observações"
          }
        }
      }
    },

    bens_moveis: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["numero_patrimonio", "descricao"],
        properties: {
          numero_patrimonio: {
            type: "string",
            minLength: 1,
            description: "Número do patrimônio"
          },
          descricao: {
            type: "string",
            minLength: 3,
            description: "Descrição do bem"
          },
          data_aquisicao: {
            type: "string",
            format: "date",
            description: "Data de aquisição"
          },
          valor_aquisicao: {
            type: "number",
            minimum: 0,
            description: "Valor de aquisição"
          },
          data_cessao: {
            type: "string",
            format: "date",
            description: "Data de cessão"
          },
          valor_cessao: {
            type: "number",
            minimum: 0,
            description: "Valor de cessão"
          },
          data_baixa: {
            type: "string",
            format: "date",
            description: "Data de baixa/devolução"
          }
        }
      }
    },

    bens_imoveis: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["descricao"],
        properties: {
          descricao: {
            type: "string",
            minLength: 3,
            description: "Descrição do imóvel"
          },
          endereco: {
            type: "string",
            description: "Endereço completo"
          },
          data_aquisicao: {
            type: "string",
            format: "date",
            description: "Data de aquisição"
          },
          data_cessao: {
            type: "string",
            format: "date",
            description: "Data de cessão"
          },
          matricula: {
            type: "string",
            description: "Matrícula do imóvel"
          }
        }
      }
    },

    empregados: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        required: ["cpf", "data_admissao"],
        properties: {
          cpf: {
            type: "string",
            pattern: "^[0-9]{11}$",
            description: "CPF (11 dígitos)"
          },
          data_admissao: {
            type: "string",
            format: "date",
            description: "Data de admissão"
          },
          data_demissao: {
            type: "string",
            format: "date",
            description: "Data de demissão (opcional)"
          },
          nome: {
            type: "string",
            description: "Nome do empregado"
          },
          cargo: {
            type: "string",
            description: "Cargo/função"
          },
          cbo: {
            type: "string",
            description: "Classificação Brasileira de Ocupações"
          },
          cns: {
            type: "string",
            description: "Número CNS (saúde)"
          },
          salario_contratual: {
            type: "number",
            minimum: 0,
            description: "Salário contratual"
          }
        }
      }
    },

    resumo_executivo: {
      type: "object",
      properties: {
        total_documentos_fiscais: {
          type: "number",
          description: "Total de documentos fiscais"
        },
        valor_total_documentos: {
          type: "number",
          description: "Valor total dos documentos"
        },
        total_pagamentos: {
          type: "number",
          description: "Total de pagamentos realizados"
        },
        valor_total_pagamentos: {
          type: "number",
          description: "Valor total dos pagamentos"
        },
        saldo: {
          type: "number",
          description: "Saldo calculado"
        },
        observacoes: {
          type: "string",
          description: "Observações gerais"
        }
      }
    }
  }
};

export const SECTION_STRUCTURE = [
  {
    id: "descritor",
    title: "Descritor",
    icon: "FileText",
    fields: [
      { name: "tipo_documento", label: "Tipo de Documento", type: "select", required: true },
      { name: "municipio", label: "Município", type: "number", required: true },
      { name: "entidade", label: "Entidade", type: "number", required: true },
      { name: "ano", label: "Ano", type: "number", required: true },
      { name: "mes", label: "Mês", type: "number", required: true }
    ]
  },
  {
    id: "contratos",
    title: "Contratos",
    icon: "FileCheck",
    subsections: [
      {
        id: "contrato",
        title: "Contrato",
        fields: [
          { name: "numero", label: "Número do Contrato", type: "text", required: true },
          { name: "objeto", label: "Objeto", type: "textarea", required: true },
          { name: "data_assinatura", label: "Data de Assinatura", type: "date", required: true },
          { name: "data_vigencia_inicio", label: "Vigência Início", type: "date", required: true },
          { name: "data_vigencia_fim", label: "Vigência Fim", type: "date", required: true },
          { name: "valor_total", label: "Valor Total", type: "currency", required: true },
          { name: "empenho", label: "Empenho", type: "text", required: false },
          { name: "observacoes", label: "Observações", type: "textarea", required: false }
        ]
      }
    ]
  },
  {
    id: "documentos_fiscais",
    title: "Documentos Fiscais",
    icon: "FileText",
    subsections: [
      {
        id: "documento_fiscal",
        title: "Documento Fiscal",
        fields: [
          { name: "tipo", label: "Tipo", type: "select", required: true },
          { name: "numero", label: "Número", type: "text", required: true },
          { name: "serie", label: "Série", type: "text", required: false },
          { name: "data_emissao", label: "Data de Emissão", type: "date", required: true },
          { name: "data_vencimento", label: "Data de Vencimento", type: "date", required: false },
          { name: "fornecedor_cnpj", label: "CNPJ Fornecedor", type: "text", mask: "cnpj", required: false },
          { name: "fornecedor_cpf", label: "CPF Fornecedor", type: "text", mask: "cpf", required: false },
          { name: "valor_bruto", label: "Valor Bruto", type: "currency", required: true },
          { name: "desconto", label: "Desconto", type: "currency", required: false },
          { name: "retencao_ir", label: "Retenção IR", type: "currency", required: false },
          { name: "retencao_inss", label: "Retenção INSS", type: "currency", required: false },
          { name: "retencao_iss", label: "Retenção ISS", type: "currency", required: false },
          { name: "valor_liquido", label: "Valor Líquido", type: "currency", required: false },
          { name: "classificacao", label: "Classificação", type: "text", required: false },
          { name: "contrato_numero", label: "Contrato Relacionado", type: "text", required: false },
          { name: "observacoes", label: "Observações", type: "textarea", required: false }
        ]
      }
    ]
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    icon: "CreditCard",
    subsections: [
      {
        id: "pagamento",
        title: "Pagamento",
        fields: [
          { name: "numero_documento", label: "Número do Documento", type: "text", required: true },
          { name: "data_pagamento", label: "Data de Pagamento", type: "date", required: true },
          { name: "valor_pago", label: "Valor Pago", type: "currency", required: true },
          { name: "forma_pagamento", label: "Forma de Pagamento", type: "select", required: true },
          { name: "numero_nota_fiscal", label: "NF Relacionada", type: "text", required: false },
          { name: "banco", label: "Banco", type: "text", required: false },
          { name: "agencia", label: "Agência", type: "text", required: false },
          { name: "conta", label: "Conta", type: "text", required: false },
          { name: "comprovante", label: "Comprovante", type: "text", required: false },
          { name: "observacoes", label: "Observações", type: "textarea", required: false }
        ]
      }
    ]
  },
  {
    id: "bens_moveis",
    title: "Bens Móveis",
    icon: "Package",
    subsections: [
      {
        id: "bem_movel",
        title: "Bem Móvel",
        fields: [
          { name: "numero_patrimonio", label: "Patrimônio", type: "text", required: true },
          { name: "descricao", label: "Descrição", type: "textarea", required: true },
          { name: "data_aquisicao", label: "Data Aquisição", type: "date", required: false },
          { name: "valor_aquisicao", label: "Valor Aquisição", type: "currency", required: false },
          { name: "data_cessao", label: "Data Cessão", type: "date", required: false },
          { name: "valor_cessao", label: "Valor Cessão", type: "currency", required: false },
          { name: "data_baixa", label: "Data Baixa", type: "date", required: false }
        ]
      }
    ]
  },
  {
    id: "bens_imoveis",
    title: "Bens Imóveis",
    icon: "Building",
    subsections: [
      {
        id: "bem_imovel",
        title: "Bem Imóvel",
        fields: [
          { name: "descricao", label: "Descrição", type: "textarea", required: true },
          { name: "endereco", label: "Endereço", type: "textarea", required: false },
          { name: "data_aquisicao", label: "Data Aquisição", type: "date", required: false },
          { name: "data_cessao", label: "Data Cessão", type: "date", required: false },
          { name: "matricula", label: "Matrícula", type: "text", required: false }
        ]
      }
    ]
  },
  {
    id: "empregados",
    title: "Empregados",
    icon: "Users",
    subsections: [
      {
        id: "empregado",
        title: "Empregado",
        fields: [
          { name: "cpf", label: "CPF", type: "text", mask: "cpf", required: true },
          { name: "nome", label: "Nome", type: "text", required: false },
          { name: "cargo", label: "Cargo", type: "text", required: false },
          { name: "data_admissao", label: "Data Admissão", type: "date", required: true },
          { name: "data_demissao", label: "Data Demissão", type: "date", required: false },
          { name: "cbo", label: "CBO", type: "text", required: false },
          { name: "cns", label: "CNS", type: "text", required: false },
          { name: "salario_contratual", label: "Salário", type: "currency", required: false }
        ]
      }
    ]
  }
];
