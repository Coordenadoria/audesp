import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';

interface SectionStatus {
  completed: boolean;
  touched: boolean;
  warnings: string[];
}

interface FormState {
  // 1. Descritor
  descritor?: {
    exercicio?: string;
    orgao?: string;
    tipoAjuste?: string;
    periodo?: string;
  };
  // 2. Código de Ajuste
  codigoAjuste?: string;
  // 3. Retificação
  retificacao?: boolean;
  // 4. Relação de Empregados
  relacaoEmpregados?: Array<{
    nome?: string;
    cpf?: string;
    cargo?: string;
    dataAdmissao?: string;
  }>;
  // 5. Relação de Bens
  relacaoBens?: {
    bensMoveis?: Array<{
      descricao?: string;
      valor?: number;
      dataAquisicao?: string;
    }>;
    bensImoveis?: Array<{
      descricao?: string;
      valor?: number;
      localizacao?: string;
    }>;
  };
  // 6. Contratos
  contratos?: Array<{
    numero?: string;
    contratada?: string;
    valor?: number;
    dataInicio?: string;
    dataFim?: string;
  }>;
  // 7. Documentos Fiscais
  documentosFiscais?: Array<{
    numero?: string;
    fornecedor?: string;
    valor?: number;
    dataEmissao?: string;
    descricao?: string;
  }>;
  // 8. Pagamentos
  pagamentos?: Array<{
    descricao?: string;
    valor?: number;
    dataPagamento?: string;
    beneficiario?: string;
  }>;
  // 9. Disponibilidades
  disponibilidades?: {
    saldoBancario?: number;
    aplicacoes?: number;
    contaBancaria?: string;
  };
  // 10. Receitas
  receitas?: {
    repasses?: number;
    rendimentos?: number;
    contrapartidas?: number;
  };
  // 11. Ajustes de Saldo
  ajustesSaldo?: {
    diferencas?: number;
    correcoes?: number;
    conciliacoes?: string;
  };
  // 12. Servidores Cedidos
  servidoresCedidos?: Array<{
    nome?: string;
    cpf?: string;
    orgaoOrigem?: string;
    dataInicio?: string;
  }>;
  // 13. Descontos
  descontos?: Array<{
    tipo?: string;
    valor?: number;
    motivo?: string;
    data?: string;
  }>;
  // 14. Devoluções
  devolucoes?: Array<{
    descricao?: string;
    valor?: number;
    data?: string;
    justificativa?: string;
  }>;
  // 15. Glosas
  glosas?: Array<{
    descricao?: string;
    valor?: number;
    motivo?: string;
    data?: string;
  }>;
  // 16. Empenhos
  empenhos?: Array<{
    numero?: string;
    descricao?: string;
    valor?: number;
    dataEmpenho?: string;
  }>;
  // 17. Repasses
  repasses?: Array<{
    descricao?: string;
    valor?: number;
    data?: string;
    beneficiario?: string;
  }>;
  // 18. Relatório de Atividades
  relatorioAtividades?: {
    resumoExecutivo?: string;
    resultadosFisicos?: string;
    impactos?: string;
  };
  // 19. Dados Gerais Entidade Beneficiária
  dadosGeraiseEntidadeBeneficiaria?: {
    razaoSocial?: string;
    cnpj?: string;
    endereco?: string;
    responsavel?: string;
  };
  // 20. Responsáveis e Membros Órgão Concedente
  responsaveisMembrosOrgaoConcedente?: {
    nomes?: string[];
    assinantes?: string[];
    data?: string;
  };
  // 21. Declarações
  declaracoes?: {
    declaracaoCompletude?: boolean;
    declaracaoLegalidade?: boolean;
    declaracaoRegularidade?: boolean;
    observacoes?: string;
  };
  // 22. Relatório Governamental
  relatorioGovernamentalAnaliseExecucao?: {
    analiseFinanceira?: string;
    analiseOperacional?: string;
    recomendacoes?: string;
  };
  // 23. Demonstrações Contábeis
  demonstracoesContabeis?: {
    balancePatrimonial?: string;
    demonstracaoResultado?: string;
    fluxoCaixa?: string;
  };
  // 24. Publicações, Parecer e Ata
  publicacoesParecerAta?: Array<{
    tipo?: string;
    data?: string;
    referencia?: string;
    link?: string;
  }>;
  // 25. Prestação Contas Entidade Beneficiária
  prestacaoContasEntidadeBeneficiaria?: {
    consolidacao?: string;
    observacoes?: string;
  };
  // 26. Parecer Conclusivo
  parecerConclusivo?: {
    parecer?: string;
    conclusao?: string;
    data?: string;
  };
  // 27. Transparência
  transparencia?: {
    links?: string[];
    portais?: string[];
    dataPublicacao?: string;
  };
}

export const PrestacaoContasForm: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({});
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true, // Descritor aberto por padrão
  });
  const [sectionStatus, setSectionStatus] = useState<Record<number, SectionStatus>>({});

  const toggleSection = useCallback((sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const handleFieldChange = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      let current = prev as any;
      let parent = null;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        parent = current;
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;

      return { ...prev };
    });
  }, []);

  const renderInputField = (label: string, path: string, type: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' = 'text', required = false) => {
    const value = path.split('.').reduce((acc: any, key) => acc?.[key], formData) || '';

    const baseClasses = 'w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

    if (type === 'checkbox') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={path}
            checked={value || false}
            onChange={(e) => handleFieldChange(path, e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <label htmlFor={path} className="text-sm font-medium text-slate-900">
            {label}
            {required && <span className="text-red-600">*</span>}
          </label>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            {label}
            {required && <span className="text-red-600">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(path, e.target.value)}
            className={`${baseClasses} resize-none h-24`}
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-1">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          className={baseClasses}
        />
      </div>
    );
  };

  const renderSection = (sectionId: number, title: string, description: string, required: boolean, children: React.ReactNode) => {
    const isExpanded = expandedSections[sectionId];
    const status = sectionStatus[sectionId];

    return (
      <div key={sectionId} className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-4">
        {/* Header */}
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-3 flex-1 text-left">
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                {sectionId}. {title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">{description}</p>
            </div>
            {required && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Obrigatório
              </span>
            )}
          </div>
          {status?.completed && (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
          )}
          {status?.warnings && status.warnings.length > 0 && (
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 ml-2" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="px-4 py-4 border-t border-slate-200 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-600">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Prestação de Contas</h1>
        <p className="text-slate-600">Preencha todos os campos obrigatórios marcados com *</p>
      </div>

      {/* Form Sections */}
      <div className="space-y-4">
        {/* 1. Descritor */}
        {renderSection(
          1,
          'Descritor',
          'Identificação geral da prestação de contas (exercício, órgão, tipo de ajuste, período, etc.)',
          true,
          <div className="grid grid-cols-2 gap-4">
            {renderInputField('Exercício', 'descritor.exercicio', 'text', true)}
            {renderInputField('Órgão', 'descritor.orgao', 'text', true)}
            {renderInputField('Tipo de Ajuste', 'descritor.tipoAjuste', 'text', true)}
            {renderInputField('Período', 'descritor.periodo', 'text', true)}
          </div>
        )}

        {/* 2. Código de Ajuste */}
        {renderSection(
          2,
          'Código do Ajuste',
          'Código identificador do convênio/ajuste conforme AUDESP',
          true,
          <div className="grid grid-cols-1 gap-4">
            {renderInputField('Código', 'codigoAjuste', 'text', true)}
          </div>
        )}

        {/* 3. Retificação */}
        {renderSection(
          3,
          'Retificação',
          'Indica se a prestação é original (false) ou retificadora (true)',
          false,
          <div className="grid grid-cols-1 gap-4">
            {renderInputField('Retificadora', 'retificacao', 'checkbox', false)}
          </div>
        )}

        {/* 4. Relação de Empregados */}
        {renderSection(
          4,
          'Relação de Empregados',
          'Lista de empregados vinculados à execução do convênio',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de empregados</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Empregado
            </button>
          </div>
        )}

        {/* 5. Relação de Bens */}
        {renderSection(
          5,
          'Relação de Bens',
          'Bens adquiridos com recursos do convênio (móveis e imóveis)',
          false,
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Bens Móveis</h4>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                + Adicionar Bem Móvel
              </button>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-medium text-slate-900 mb-3">Bens Imóveis</h4>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                + Adicionar Bem Imóvel
              </button>
            </div>
          </div>
        )}

        {/* 6. Contratos */}
        {renderSection(
          6,
          'Contratos',
          'Contratos firmados para execução do objeto',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de contratos</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Contrato
            </button>
          </div>
        )}

        {/* 7. Documentos Fiscais */}
        {renderSection(
          7,
          'Documentos Fiscais',
          'Notas fiscais, faturas e documentos equivalentes',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de documentos</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Documento Fiscal
            </button>
          </div>
        )}

        {/* 8. Pagamentos */}
        {renderSection(
          8,
          'Pagamentos',
          'Pagamentos efetuados no âmbito do convênio',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de pagamentos</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Pagamento
            </button>
          </div>
        )}

        {/* 9. Disponibilidades */}
        {renderSection(
          9,
          'Disponibilidades',
          'Saldos financeiros, aplicações e conta bancária do convênio',
          false,
          <div className="grid grid-cols-3 gap-4">
            {renderInputField('Saldo Bancário', 'disponibilidades.saldoBancario', 'number')}
            {renderInputField('Aplicações', 'disponibilidades.aplicacoes', 'number')}
            {renderInputField('Conta Bancária', 'disponibilidades.contaBancaria', 'text')}
          </div>
        )}

        {/* 10. Receitas */}
        {renderSection(
          10,
          'Receitas',
          'Receitas do convênio (repasses, rendimentos, contrapartidas)',
          false,
          <div className="grid grid-cols-3 gap-4">
            {renderInputField('Repasses', 'receitas.repasses', 'number')}
            {renderInputField('Rendimentos', 'receitas.rendimentos', 'number')}
            {renderInputField('Contrapartidas', 'receitas.contrapartidas', 'number')}
          </div>
        )}

        {/* 11. Ajustes de Saldo */}
        {renderSection(
          11,
          'Ajustes de Saldo',
          'Ajustes contábeis de saldo (diferenças, correções, conciliações)',
          false,
          <div className="grid grid-cols-2 gap-4">
            {renderInputField('Diferenças', 'ajustesSaldo.diferencas', 'number')}
            {renderInputField('Correções', 'ajustesSaldo.correcoes', 'number')}
            {renderInputField('Conciliações', 'ajustesSaldo.conciliacoes', 'textarea')}
          </div>
        )}

        {/* 12. Servidores Cedidos */}
        {renderSection(
          12,
          'Servidores Cedidos',
          'Servidores públicos cedidos para execução do convênio',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de servidores</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Servidor
            </button>
          </div>
        )}

        {/* 13. Descontos */}
        {renderSection(
          13,
          'Descontos',
          'Descontos aplicados (retenções, encargos, abatimentos)',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de descontos</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Desconto
            </button>
          </div>
        )}

        {/* 14. Devoluções */}
        {renderSection(
          14,
          'Devoluções',
          'Valores devolvidos ao concedente',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de devoluções</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Devolução
            </button>
          </div>
        )}

        {/* 15. Glosas */}
        {renderSection(
          15,
          'Glosas',
          'Despesas glosadas (não reconhecidas)',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de glosas</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Glosa
            </button>
          </div>
        )}

        {/* 16. Empenhos */}
        {renderSection(
          16,
          'Empenhos',
          'Empenhos relacionados ao convênio',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de empenhos</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Empenho
            </button>
          </div>
        )}

        {/* 17. Repasses */}
        {renderSection(
          17,
          'Repasses',
          'Repasses financeiros realizados pelo concedente',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de repasses</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Repasse
            </button>
          </div>
        )}

        {/* 18. Relatório de Atividades */}
        {renderSection(
          18,
          'Relatório de Atividades',
          'Relatório de execução física das atividades',
          false,
          <div className="space-y-4">
            {renderInputField('Resumo Executivo', 'relatorioAtividades.resumoExecutivo', 'textarea')}
            {renderInputField('Resultados Físicos', 'relatorioAtividades.resultadosFisicos', 'textarea')}
            {renderInputField('Impactos', 'relatorioAtividades.impactos', 'textarea')}
          </div>
        )}

        {/* 19. Dados Gerais Entidade Beneficiária */}
        {renderSection(
          19,
          'Dados Gerais Entidade Beneficiária',
          'Dados cadastrais da entidade beneficiária',
          false,
          <div className="grid grid-cols-2 gap-4">
            {renderInputField('Razão Social', 'dadosGeraiseEntidadeBeneficiaria.razaoSocial', 'text')}
            {renderInputField('CNPJ', 'dadosGeraiseEntidadeBeneficiaria.cnpj', 'text')}
            {renderInputField('Endereço', 'dadosGeraiseEntidadeBeneficiaria.endereco', 'text')}
            {renderInputField('Responsável', 'dadosGeraiseEntidadeBeneficiaria.responsavel', 'text')}
          </div>
        )}

        {/* 20. Responsáveis e Membros Órgão Concedente */}
        {renderSection(
          20,
          'Responsáveis e Membros Órgão Concedente',
          'Responsáveis e membros do órgão concedente',
          false,
          <div className="space-y-4">
            {renderInputField('Nomes', 'responsaveisMembrosOrgaoConcedente.nomes', 'textarea')}
            {renderInputField('Assinantes', 'responsaveisMembrosOrgaoConcedente.assinantes', 'textarea')}
            {renderInputField('Data', 'responsaveisMembrosOrgaoConcedente.data', 'date')}
          </div>
        )}

        {/* 21. Declarações */}
        {renderSection(
          21,
          'Declarações',
          'Declarações formais exigidas pelo TCE/AUDESP',
          false,
          <div className="space-y-4">
            {renderInputField('Declaração de Completude', 'declaracoes.declaracaoCompletude', 'checkbox')}
            {renderInputField('Declaração de Legalidade', 'declaracoes.declaracaoLegalidade', 'checkbox')}
            {renderInputField('Declaração de Regularidade', 'declaracoes.declaracaoRegularidade', 'checkbox')}
            {renderInputField('Observações', 'declaracoes.observacoes', 'textarea')}
          </div>
        )}

        {/* 22. Relatório Governamental */}
        {renderSection(
          22,
          'Relatório Governamental de Análise da Execução',
          'Relatório governamental de análise da execução (preenchido pelo órgão concedente)',
          false,
          <div className="space-y-4">
            {renderInputField('Análise Financeira', 'relatorioGovernamentalAnaliseExecucao.analiseFinanceira', 'textarea')}
            {renderInputField('Análise Operacional', 'relatorioGovernamentalAnaliseExecucao.analiseOperacional', 'textarea')}
            {renderInputField('Recomendações', 'relatorioGovernamentalAnaliseExecucao.recomendacoes', 'textarea')}
          </div>
        )}

        {/* 23. Demonstrações Contábeis */}
        {renderSection(
          23,
          'Demonstrações Contábeis',
          'Demonstrativos contábeis da execução financeira',
          false,
          <div className="space-y-4">
            {renderInputField('Balanço Patrimonial', 'demonstracoesContabeis.balancePatrimonial', 'textarea')}
            {renderInputField('Demonstração de Resultado', 'demonstracoesContabeis.demonstracaoResultado', 'textarea')}
            {renderInputField('Fluxo de Caixa', 'demonstracoesContabeis.fluxoCaixa', 'textarea')}
          </div>
        )}

        {/* 24. Publicações, Parecer e Ata */}
        {renderSection(
          24,
          'Publicações, Parecer e Ata',
          'Publicações oficiais, atas e pareceres',
          false,
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Funcionalidade de array - adição dinâmica de publicações</p>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Adicionar Publicação
            </button>
          </div>
        )}

        {/* 25. Prestação Contas Entidade Beneficiária */}
        {renderSection(
          25,
          'Prestação de Contas Entidade Beneficiária',
          'Consolidação da prestação apresentada pela entidade',
          false,
          <div className="space-y-4">
            {renderInputField('Consolidação', 'prestacaoContasEntidadeBeneficiaria.consolidacao', 'textarea')}
            {renderInputField('Observações', 'prestacaoContasEntidadeBeneficiaria.observacoes', 'textarea')}
          </div>
        )}

        {/* 26. Parecer Conclusivo */}
        {renderSection(
          26,
          'Parecer Conclusivo',
          'Parecer conclusivo do órgão concedente',
          false,
          <div className="space-y-4">
            {renderInputField('Parecer', 'parecerConclusivo.parecer', 'textarea')}
            {renderInputField('Conclusão', 'parecerConclusivo.conclusao', 'textarea')}
            {renderInputField('Data', 'parecerConclusivo.data', 'date')}
          </div>
        )}

        {/* 27. Transparência */}
        {renderSection(
          27,
          'Transparência',
          'Informações de transparência pública (links, portais)',
          false,
          <div className="space-y-4">
            {renderInputField('Links', 'transparencia.links', 'textarea')}
            {renderInputField('Portais', 'transparencia.portais', 'textarea')}
            {renderInputField('Data de Publicação', 'transparencia.dataPublicacao', 'date')}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 mt-8 px-4 py-4 flex gap-4 rounded-lg shadow-lg">
        <button className="flex-1 px-4 py-3 text-sm bg-slate-300 text-slate-900 rounded hover:bg-slate-400 transition font-medium">
          Cancelar
        </button>
        <button className="flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
          Enviar Prestação de Contas
        </button>
      </div>

      {/* JSON Preview (Debug) */}
      <div className="mt-8 p-4 bg-slate-800 text-slate-100 rounded-lg font-mono text-xs overflow-auto max-h-64">
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PrestacaoContasForm;
