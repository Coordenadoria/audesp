import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface ConditionalFieldProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza campos condicionalmente
 * Ex: Mostrar campo "Data de Demissão" somente se "Ativo" for false
 */
export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  condition,
  children,
  fallback,
}) => {
  return condition ? <>{children}</> : fallback ? <>{fallback}</> : null;
};

/**
 * Wrapper que mostra uma mensagem informativa quando o campo está oculto
 */
export const ConditionalFieldWrapper: React.FC<{
  condition: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ condition, children, message }) => {
  if (!condition) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          {message || 'Este campo está oculto baseado em outras respostas'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Exemplos de condições comuns:
 *
 * // Mostrar campo de demissão se empregado não estiver ativo
 * <ConditionalField condition={!ativo}>
 *   <DateInput label="Data de Demissão" ... />
 * </ConditionalField>
 *
 * // Mostrar desconto apenas se houver desconto
 * <ConditionalField condition={temDesconto}>
 *   <MoneyInput label="Valor Desconto" ... />
 * </ConditionalField>
 *
 * // Com mensagem personalizada
 * <ConditionalFieldWrapper
 *   condition={tipoDocumento === "nf"}
 *   message="Este campo é específico para Notas Fiscais"
 * >
 *   <TextInput label="CFOP" ... />
 * </ConditionalFieldWrapper>
 */

export default ConditionalField;
