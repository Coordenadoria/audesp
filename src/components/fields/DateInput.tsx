import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle, Calendar } from 'lucide-react';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const formatDate = (value: string): string => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR');
};

const parseDate = (value: string): string => {
  // Aceita: DD/MM/YYYY ou YYYY-MM-DD
  if (!value) return '';

  if (value.includes('-')) {
    // Formato YYYY-MM-DD
    return value;
  }

  // Formato DD/MM/YYYY
  const parts = value.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return '';
};

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  required,
  error,
  hint,
  disabled,
  min,
  max,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;
      
      // Remove caracteres não-numéricos
      const digits = input.replace(/\D/g, '');
      
      if (digits.length <= 2) {
        input = digits;
      } else if (digits.length <= 4) {
        input = digits.slice(0, 2) + '/' + digits.slice(2);
      } else {
        input = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
      }

      if (input.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parsed = parseDate(input);
        if (parsed) {
          onChange(parsed);
        }
      }
    },
    [onChange]
  );

  const isValid = !error && value && value.length > 0;
  const displayValue = value ? formatDate(value) : '';

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

      <div className="flex gap-2">
        {/* Input com calendário HTML5 */}
        <input
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          min={min}
          max={max}
          className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
            error
              ? 'border-red-500 bg-red-50 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2`}
        />

        {/* Ícone de calendário */}
        <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <Calendar size={18} className="text-gray-500" />
        </div>
      </div>

      {displayValue && (
        <p className="text-xs text-gray-600 mt-1">
          📅 {displayValue}
        </p>
      )}

      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default DateInput;
