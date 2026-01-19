/**
 * EXEMPLO DE INTEGRAÇÃO - FormWithOCR
 * 
 * Este exemplo mostra como usar o novo componente integrado
 * que combina:
 * - PDF Viewer com zoom e seleção de texto
 * - Formulário dinâmico
 * - OCR para extração automática de campos
 * - JSON Preview com validação em tempo real
 * - Sugestões inteligentes
 */

import React from 'react';
import FormWithOCR from '../components/FormWithOCR';

// Definir os campos do formulário
const formFields = [
  {
    name: 'cpf',
    label: 'CPF',
    type: 'text' as const,
    required: true,
    placeholder: '000.000.000-00',
    format: 'cpf'
  },
  {
    name: 'nomeCompleto',
    label: 'Nome Completo',
    type: 'text' as const,
    required: true,
    placeholder: 'Seu nome completo'
  },
  {
    name: 'dataAtendimento',
    label: 'Data do Atendimento',
    type: 'date' as const,
    required: true
  },
  {
    name: 'descricao',
    label: 'Descrição',
    type: 'textarea' as const,
    required: true,
    placeholder: 'Descreva o atendimento ou prestação de contas'
  },
  {
    name: 'valor',
    label: 'Valor',
    type: 'currency' as const,
    required: false,
    placeholder: '0,00'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'completo', label: 'Completo' },
      { value: 'arquivado', label: 'Arquivado' }
    ]
  },
  {
    name: 'observacoes',
    label: 'Observações',
    type: 'textarea' as const,
    required: false,
    placeholder: 'Observações adicionais'
  }
];

// Definir o esquema de validação
const formSchema = {
  cpf: {
    type: 'string',
    required: true,
    format: 'cpf',
    description: 'CPF do responsável'
  },
  nomeCompleto: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 100,
    description: 'Nome completo do responsável'
  },
  dataAtendimento: {
    type: 'date',
    required: true,
    format: 'YYYY-MM-DD',
    description: 'Data do atendimento'
  },
  descricao: {
    type: 'string',
    required: true,
    minLength: 10,
    description: 'Descrição detalhada'
  },
  valor: {
    type: 'number',
    required: false,
    format: 'currency',
    min: 0,
    description: 'Valor em reais'
  },
  status: {
    type: 'string',
    required: true,
    enum: ['pendente', 'completo', 'arquivado'],
    description: 'Status do atendimento'
  },
  observacoes: {
    type: 'string',
    required: false,
    maxLength: 500,
    description: 'Observações adicionais'
  }
};

/**
 * EXEMPLO 1: Componente simples de uso
 */
export const ExemploBasico: React.FC = () => {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Dados enviados:', data);
    // Enviar para o backend
    alert('Formulário enviado com sucesso');
  };

  const handleCancel = () => {
    console.log('Formulário cancelado');
  };

  return (
    <FormWithOCR
      fields={formFields}
      schema={formSchema}
      title="Prestação de Contas com OCR"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

/**
 * EXEMPLO 2: Uso avançado com manipulação de dados
 */
export const ExemploAvancado: React.FC = () => {
  const [submittedData, setSubmittedData] = React.useState<Record<string, any> | null>(null);

  const handleAdvancedSubmit = async (data: Record<string, any>) => {
    console.log('Processando dados avançados:', data);

    // Fazer algum processamento
    const processedData = {
      ...data,
      processadoEm: new Date().toISOString(),
      origem: 'ocr-form-v3'
    };

    // Enviar para API
    try {
      const response = await fetch('/api/prestacao-contas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      });

      if (response.ok) {
        setSubmittedData(processedData);
        alert('Dados enviados com sucesso');
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      alert('Erro ao enviar dados');
    }
  };

  if (submittedData) {
    return (
      <div className="p-8 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-2xl font-bold text-green-900 mb-4">Sucesso!</h2>
        <p className="text-green-800 mb-4">Seus dados foram enviados com sucesso.</p>
        <pre className="bg-green-100 p-4 rounded text-sm text-green-900 overflow-auto">
          {JSON.stringify(submittedData, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <FormWithOCR
      fields={formFields}
      schema={formSchema}
      title="Prestação de Contas - Modo Avançado"
      onSubmit={handleAdvancedSubmit}
      onCancel={() => window.history.back()}
    />
  );
};

/**
 * EXEMPLO 3: Com suporte a múltiplos formulários
 */
export const ExemploMultiplosFormularios: React.FC = () => {
  const [currentForm, setCurrentForm] = React.useState<'contas' | 'atendimento'>('contas');

  const contasFields = formFields;
  const contasSchema = formSchema;

  const atendimentoFields = formFields.filter(f => 
    ['nomeCompleto', 'dataAtendimento', 'descricao', 'observacoes'].includes(f.name)
  );

  const atendimentoSchema = {
    nomeCompleto: contasSchema.nomeCompleto,
    dataAtendimento: contasSchema.dataAtendimento,
    descricao: contasSchema.descricao,
    observacoes: contasSchema.observacoes
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Seletor de formulários */}
      <div className="p-4 bg-slate-100 border-b border-slate-300 flex gap-4">
        <button
          onClick={() => setCurrentForm('contas')}
          className={`px-4 py-2 font-medium rounded transition ${
            currentForm === 'contas'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-300 text-slate-900 hover:bg-slate-400'
          }`}
        >
          Prestação de Contas
        </button>
        <button
          onClick={() => setCurrentForm('atendimento')}
          className={`px-4 py-2 font-medium rounded transition ${
            currentForm === 'atendimento'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-300 text-slate-900 hover:bg-slate-400'
          }`}
        >
          Registro de Atendimento
        </button>
      </div>

      {/* Renderizar formulário ativo */}
      <div className="flex-1 overflow-hidden">
        {currentForm === 'contas' ? (
          <FormWithOCR
            fields={contasFields}
            schema={contasSchema}
            title="Prestação de Contas com OCR"
            onSubmit={(data) => console.log('Contas enviadas:', data)}
            onCancel={() => setCurrentForm('atendimento')}
          />
        ) : (
          <FormWithOCR
            fields={atendimentoFields}
            schema={atendimentoSchema}
            title="Registro de Atendimento com OCR"
            onSubmit={(data) => console.log('Atendimento enviado:', data)}
            onCancel={() => setCurrentForm('contas')}
          />
        )}
      </div>
    </div>
  );
};

export default ExemploBasico;
