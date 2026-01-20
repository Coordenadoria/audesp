import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  mask?: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'none';
  hint?: string;
  disabled?: boolean;
  maxLength?: number;
}

const MASKS = {
  cpf: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  },
  cnpj: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  },
  phone: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  },
  cep: (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, '$1-$2');
  },
  none: (value: string) => value,
};

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  mask = 'none',
  hint,
  disabled,
  maxLength,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const maskFn = MASKS[mask];
      const maskedValue = maskFn(newValue);
      onChange(maskedValue);
    },
    [mask, onChange]
  );

  const isValid = !error && value.length > 0;

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

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-lg font-mono text-sm transition-colors ${
          error
            ? 'border-red-500 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        } focus:outline-none focus:ring-2`}
      />

      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default TextInput;
