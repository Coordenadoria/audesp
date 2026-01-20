import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface InsertModalProps {
  isOpen: boolean;
  sectionName: string;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'currency' | 'textarea' | 'select';
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
  }>;
}

export const InsertModal: React.FC<InsertModalProps> = ({
  isOpen,
  sectionName,
  onClose,
  onSubmit,
  fields
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Limpar erro ao começar a digitar
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} é obrigatório`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      setFormData({});
      onClose();
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];

    const baseClasses = `
      w-full px-3 py-2 border rounded-lg font-medium text-sm
      ${hasError ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'}
      focus:outline-none focus:ring-2 focus:ring-blue-500
    `;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} resize-none h-24`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseClasses}
          >
            <option value="">Selecione...</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            step={field.type === 'currency' ? '0.01' : '1'}
            className={baseClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseClasses}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={20} />
            Inserir {sectionName}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-1 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.name] && (
                  <p className="text-xs text-red-600 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Inserir
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertModal;
