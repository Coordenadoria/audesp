import React, { useMemo } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import SectionManager, { SectionConfig } from './SectionManager';
import ErrorPanel from './ErrorPanel';
import JSONViewer from './JSONViewer';
import {
  TextInput,
  MoneyInput,
  DateInput,
  SelectInput,
  ArrayInput,
  ConditionalFieldWrapper,
} from './fields';

interface AdvancedFormProps {
  initialData?: any;
  onSubmit?: (data: any) => void;
  onValidationChange?: (isValid: boolean) => void;
  showJSONViewer?: boolean;
  showErrorPanel?: boolean;
}

export const AdvancedFormBuilder: React.FC<AdvancedFormProps> = ({
  initialData = {},
  onSubmit,
  onValidationChange,
  showJSONViewer = true,
  showErrorPanel = true,
}) => {
  const form = useFormValidation(initialData);

  // Notificar pai quando validação muda
  React.useEffect(() => {
    onValidationChange?.(form.validationResult.isValid);
  }, [form.validationResult.isValid, onValidationChange]);

  // Erros por seção
  const errorsBySection = useMemo(() => {
    const map: Record<number, number> = {};
    form.validationResult.errors.forEach((err) => {
      if (err.path.includes('descritor')) map[1] = (map[1] || 0) + 1;
      if (err.path.includes('empregados')) map[4] = (map[4] || 0) + 1;
      if (err.path.includes('bens')) map[5] = (map[5] || 0) + 1;
      if (err.path.includes('contratos')) map[6] = (map[6] || 0) + 1;
      if (err.path.includes('documentosFiscais')) map[7] = (map[7] || 0) + 1;
      if (err.path.includes('pagamentos')) map[8] = (map[8] || 0) + 1;
    });
    return map;
  }, [form.validationResult.errors]);

  // Sections Configuration
  const sections: SectionConfig[] = [
    {
      id: 1,
      title: '1. Descritor',
      description: 'Informações básicas da prestação',
      errors: errorsBySection[1] || 0,
      completed: form.formData.descritor?.exercicio !== undefined,
      children: (
        <div className="space-y-4">
          <TextInput
            label="Exercício"
            value={form.formData.descritor?.exercicio || ''}
            onChange={(val) => form.handleFieldChange('descritor.exercicio', val)}
            placeholder="YYYY"
            hint="Ano de exercício (ex: 2024)"
            error={form.getErrorsForPath('/descritor/exercicio')[0]?.message}
            required
          />

          <TextInput
            label="Órgão"
            value={form.formData.descritor?.orgao || ''}
            onChange={(val) => form.handleFieldChange('descritor.orgao', val)}
            placeholder="000000"
            hint="Código do órgão"
            error={form.getErrorsForPath('/descritor/orgao')[0]?.message}
            required
          />

          <TextInput
            label="Município (IBGE)"
            value={form.formData.descritor?.municipio || ''}
            onChange={(val) => form.handleFieldChange('descritor.municipio', val)}
            placeholder="0000000"
            hint="Código IBGE do município"
            error={form.getErrorsForPath('/descritor/municipio')[0]?.message}
            required
          />

          <SelectInput
            label="Tipo de Documento"
            value={form.formData.descritor?.tipoDocumento || ''}
            onChange={(val) => form.handleFieldChange('descritor.tipoDocumento', val)}
            options={[
              { value: '1', label: 'Prestação de Contas' },
              { value: '2', label: 'Complementação' },
              { value: '3', label: 'Retificação' },
            ]}
            required
          />

          <DateInput
            label="Data de Elaboração"
            value={form.formData.descritor?.dataElaboracao || ''}
            onChange={(val) => form.handleFieldChange('descritor.dataElaboracao', val)}
            error={form.getErrorsForPath('/descritor/dataElaboracao')[0]?.message}
          />
        </div>
      ),
    },

    {
      id: 7,
      title: '7. Documentos Fiscais',
      description: 'Notas Fiscais e Recibos',
      errors: errorsBySection[7] || 0,
      completed: (form.formData.documentosFiscais?.length || 0) > 0,
      children: (
        <ArrayInput
          label="Documentos Fiscais"
          items={form.formData.documentosFiscais || []}
          onAddItem={() =>
            form.addArrayItem('documentosFiscais', {
              tipo: '1',
              numero: '',
              dataEmissao: '',
              valor: 0,
              valorLiquido: 0,
            })
          }
          onRemoveItem={(idx) => form.removeArrayItem('documentosFiscais', idx)}
          required
          minItems={1}
          itemTemplate={(item, idx) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Número"
                  value={item.numero || ''}
                  onChange={(val) =>
                    form.handleFieldChange(`documentosFiscais.${idx}.numero`, val)
                  }
                />
                <DateInput
                  label="Emissão"
                  value={item.dataEmissao || ''}
                  onChange={(val) =>
                    form.handleFieldChange(`documentosFiscais.${idx}.dataEmissao`, val)
                  }
                />
              </div>
              <MoneyInput
                label="Valor Líquido"
                value={item.valorLiquido || 0}
                onChange={(val) =>
                  form.handleFieldChange(`documentosFiscais.${idx}.valorLiquido`, val)
                }
              />
            </div>
          )}
        />
      ),
    },

    {
      id: 8,
      title: '8. Pagamentos',
      description: 'Registros de pagamentos efetuados',
      errors: errorsBySection[8] || 0,
      completed: (form.formData.pagamentos?.length || 0) > 0,
      children: (
        <ArrayInput
          label="Pagamentos"
          items={form.formData.pagamentos || []}
          onAddItem={() =>
            form.addArrayItem('pagamentos', {
              numero: '',
              dataPagamento: '',
              valor: 0,
              descricao: '',
            })
          }
          onRemoveItem={(idx) => form.removeArrayItem('pagamentos', idx)}
          required
          minItems={1}
          itemTemplate={(item, idx) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Número"
                  value={item.numero || ''}
                  onChange={(val) =>
                    form.handleFieldChange(`pagamentos.${idx}.numero`, val)
                  }
                />
                <DateInput
                  label="Data"
                  value={item.dataPagamento || ''}
                  onChange={(val) =>
                    form.handleFieldChange(`pagamentos.${idx}.dataPagamento`, val)
                  }
                />
              </div>
              <MoneyInput
                label="Valor"
                value={item.valor || 0}
                onChange={(val) =>
                  form.handleFieldChange(`pagamentos.${idx}.valor`, val)
                }
              />
            </div>
          )}
        />
      ),
    },
  ];

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Main Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Prestação de Contas
          </h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <SectionManager sections={sections} />
          </div>

          <button
            onClick={() => onSubmit?.(form.formData)}
            disabled={!form.validationResult.isValid}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              form.validationResult.isValid
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 cursor-not-allowed text-gray-600'
            }`}
          >
            {form.validationResult.isValid
              ? '✓ Validar e Enviar'
              : '❌ Corrija os erros antes de enviar'}
          </button>
        </div>
      </div>

      {/* Sidebar - Error Panel & JSON Viewer */}
      <div className="w-96 bg-white border-l border-gray-300 flex flex-col overflow-hidden">
        {showErrorPanel && (
          <div className="flex-1 overflow-y-auto border-b border-gray-300">
            <ErrorPanel
              errors={form.validationResult.errors}
              warnings={form.validationResult.warnings}
              completionPercentage={
                form.validationResult.summary.completionPercentage
              }
              isOpen={true}
            />
          </div>
        )}

        {showJSONViewer && (
          <div className="flex-1 overflow-y-auto">
            <JSONViewer
              data={form.formData}
              errors={form.validationResult.errors}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFormBuilder;
