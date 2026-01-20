import React, { useMemo, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  options,
  required,
  error,
  hint,
  disabled,
  placeholder = 'Selecione uma opção...',
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  const selectedLabel = useMemo(
    () => options.find((opt) => opt.value === value)?.label || placeholder,
    [options, value, placeholder]
  );

  const isValid = !error && value.length > 0;

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onChange]
  );

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        {required && <span className="text-red-500">*</span>}
        {isValid && !error && <CheckCircle size={16} className="text-green-500" />}
        {error && <AlertCircle size={16} className="text-red-500" />}
      </div>

      {/* Select Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-colors ${
          error
            ? 'border-red-500 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
        } focus:outline-none focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
          onBlur={() => setIsOpen(false)}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    value === option.value
                      ? 'bg-blue-100 text-blue-900 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>
      )}

      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default SelectInput;
