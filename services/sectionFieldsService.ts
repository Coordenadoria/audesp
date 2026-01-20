// Definição dos campos para cada seção
export const sectionFields = {
  descritor: [
    { name: 'numero_prestacao', label: 'Número da Prestação', type: 'text', required: true },
    { name: 'orgao_gestor', label: 'Órgão Gestor', type: 'text', required: true },
    { name: 'data_inicio', label: 'Data Início', type: 'date', required: true },
    { name: 'data_fim', label: 'Data Fim', type: 'date', required: true },
  ],
  
  prestacao_benef: [
    { name: 'nome_entidade', label: 'Nome da Entidade', type: 'text', required: true },
    { name: 'cnpj', label: 'CNPJ', type: 'text', placeholder: 'XX.XXX.XXX/XXXX-XX', required: true },
    { name: 'endereco', label: 'Endereço', type: 'text' },
    { name: 'representante', label: 'Representante Legal', type: 'text' },
  ],

  responsaveis: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'cpf', label: 'CPF', type: 'text', placeholder: 'XXX.XXX.XXX-XX', required: true },
    { name: 'cargo', label: 'Cargo', type: 'text', required: true },
    { name: 'data_assinatura', label: 'Data Assinatura', type: 'date' },
  ],

  contratos: [
    { name: 'numero_contrato', label: 'Número', type: 'text', required: true },
    { name: 'contratada', label: 'Contratada', type: 'text', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_inicio', label: 'Data Início', type: 'date', required: true },
    { name: 'data_fim', label: 'Data Fim', type: 'date' },
    { name: 'objeto', label: 'Objeto', type: 'textarea' },
  ],

  documentos_fiscais: [
    { name: 'numero_nf', label: 'Número NF', type: 'text', required: true },
    { name: 'fornecedor', label: 'Fornecedor', type: 'text', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_emissao', label: 'Data Emissão', type: 'date', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
  ],

  pagamentos: [
    { name: 'numero_pagamento', label: 'Número Pagamento', type: 'text', required: true },
    { name: 'beneficiario', label: 'Beneficiário', type: 'text', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_pagamento', label: 'Data Pagamento', type: 'date', required: true },
    { name: 'banco', label: 'Banco', type: 'text' },
    { name: 'conta', label: 'Conta', type: 'text' },
  ],

  repasses: [
    { name: 'numero_repasse', label: 'Número Repasse', type: 'text', required: true },
    { name: 'destinatario', label: 'Destinatário', type: 'text', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_repasse', label: 'Data Repasse', type: 'date', required: true },
    { name: 'justificativa', label: 'Justificativa', type: 'textarea' },
  ],

  relacao_empregados: [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'cpf', label: 'CPF', type: 'text', placeholder: 'XXX.XXX.XXX-XX', required: true },
    { name: 'cargo', label: 'Cargo', type: 'text', required: true },
    { name: 'salario', label: 'Salário', type: 'currency', required: true },
    { name: 'data_admissao', label: 'Data Admissão', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
      { value: 'licenca', label: 'Licença' }
    ]},
  ],

  relacao_bens: [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
    { name: 'valor_unitario', label: 'Valor Unitário', type: 'currency', required: true },
    { name: 'data_aquisicao', label: 'Data Aquisição', type: 'date' },
    { name: 'localizacao', label: 'Localização', type: 'text' },
    { name: 'estado', label: 'Estado', type: 'select', options: [
      { value: 'novo', label: 'Novo' },
      { value: 'bom', label: 'Bom' },
      { value: 'regular', label: 'Regular' },
      { value: 'ruim', label: 'Ruim' }
    ]},
  ],

  devolucoes: [
    { name: 'numero_devolucao', label: 'Número Devolução', type: 'text', required: true },
    { name: 'motivo', label: 'Motivo', type: 'textarea', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_devolucao', label: 'Data Devolução', type: 'date', required: true },
  ],

  glosas: [
    { name: 'numero_glosa', label: 'Número Glosa', type: 'text', required: true },
    { name: 'motivo', label: 'Motivo', type: 'textarea', required: true },
    { name: 'valor', label: 'Valor', type: 'currency', required: true },
    { name: 'data_glosa', label: 'Data Glosa', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'resolvida', label: 'Resolvida' },
      { value: 'contestada', label: 'Contestada' }
    ]},
  ],
};

export type SectionKey = keyof typeof sectionFields;

export const getSectionFields = (sectionId: string) => {
  return sectionFields[sectionId as SectionKey] || [];
};

export const getSectionLabel = (sectionId: string): string => {
  const labels: Record<string, string> = {
    descritor: 'Descritor',
    prestacao_benef: 'Entidade Beneficiária',
    responsaveis: 'Responsáveis',
    contratos: 'Contratos',
    documentos_fiscais: 'Documentos Fiscais',
    pagamentos: 'Pagamentos',
    repasses: 'Repasses',
    relacao_empregados: 'Empregados',
    relacao_bens: 'Bens e Equipamentos',
    devolucoes: 'Devoluções',
    glosas: 'Glosas/Ajustes',
  };
  return labels[sectionId] || sectionId;
};
