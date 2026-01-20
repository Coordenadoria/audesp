import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date';
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  mask?: 'cpf' | 'cnpj' | 'date' | 'currency' | 'phone' | 'cep';
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  options?: Array<{ label: string; value: any }>;
}

export default function FormField({
  label,
  type,
  value,
  onChange,
  error,
  required,
  mask,
  placeholder,
  disabled,
  description,
  options,
}: FormFieldProps) {

  const applyMask = useCallback(
    (val: string): string => {
      if (!mask) return val;

      const cleaned = val.replace(/\D/g, '');

      switch (mask) {
        case 'cpf':
          return cleaned
            .slice(0, 11)
            .replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, a, b, c, d) =>
              [a, b, c, d].filter(Boolean).join('.')
            )
            .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        case 'cnpj':
          return cleaned
            .slice(0, 14)
            .replace(/(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/, (_, a, b, c, d, e) => {
              const parts = [a, b, c, d, e].filter(Boolean);
              return parts.join('');
            })
            .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
        case 'date':
          return cleaned
            .slice(0, 8)
            .replace(/(\d{4})(\d{0,2})(\d{0,2})/, '$1-$2-$3');
        case 'phone':
          return cleaned
            .slice(0, 11)
            .replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, a, b, c) => {
              const parts = [a, b, c].filter(Boolean);
              if (parts[0]?.length === 2 && parts[1]) {
                return `(${parts[0]}) ${parts[1]}${parts[2] ? '-' + parts[2] : ''}`;
              }
              return val;
            });
        case 'cep':
          return cleaned
            .slice(0, 8)
            .replace(/(\d{5})(\d{0,3})/, '$1-$2');
        case 'currency':
          const num = parseFloat(cleaned) / 100 || 0;
          return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        default:
          return val;
      }
    },
    [mask]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let val = e.target.value;

      if (type === 'number' || type === 'integer') {
        const numVal = parseFloat(val) || 0;
        onChange(type === 'integer' ? Math.floor(numVal) : numVal);
      } else if (type === 'boolean') {
        onChange((e.target as HTMLInputElement).checked);
      } else if (mask && (type === 'string' || type === 'date')) {
        val = applyMask(val);
        onChange(val);
      } else {
        onChange(val);
      }
    },
    [type, onChange, mask, applyMask]
  );

  const renderInput = () => {
    switch (type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={handleChange}
            disabled={disabled}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        );

      case 'integer':
        return (
          <input
            type="number"
            step="1"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={
              mask === 'cpf'
                ? 14
                : mask === 'cnpj'
                ? 18
                : mask === 'phone'
                ? 15
                : mask === 'cep'
                ? 9
                : undefined
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}

      {type === 'boolean' ? (
        <div className="flex items-center gap-2">
          {renderInput()}
          <span className="text-sm text-gray-600">
            {value ? 'Sim' : 'Não'}
          </span>
        </div>
      ) : (
        renderInput()
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </div>
  );
}
