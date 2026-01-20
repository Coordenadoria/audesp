import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  currency?: 'BRL' | 'USD';
}

const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL'): string => {
  const formatter = new Intl.NumberFormat(
    currency === 'BRL' ? 'pt-BR' : 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
  return formatter.format(value);
};

const parseMoneyInput = (value: string): number => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) / 100 : 0;
};

export const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  hint,
  disabled,
  min = 0,
  max = 999999999.99,
  currency = 'BRL',
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseMoneyInput(e.target.value);
      const clamped = Math.min(Math.max(parsed, min), max);
      onChange(clamped);
    },
    [min, max, onChange]
  );

  const isValid = !error && value > 0;
  const displayValue = value > 0 ? formatCurrency(value, currency) : '';

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        {required && <span className="text-red-500">*</span>}
        {isValid && !error && <CheckCircle size={16} className="text-green-500" />}
        {error && <AlertCircle size={16} className="text-red-500" />}
      </div>

      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-600 font-semibold">
          {currency === 'BRL' ? 'R$' : '$'}
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder || 'R$ 0,00'}
          disabled={disabled}
          className={`w-full pl-10 pr-3 py-2 border rounded-lg font-mono text-sm transition-colors ${
            error
              ? 'border-red-500 bg-red-50 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2`}
        />
      </div>

      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {value > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Valor: {formatCurrency(value, currency)}
        </p>
      )}
    </div>
  );
};

export default MoneyInput;
