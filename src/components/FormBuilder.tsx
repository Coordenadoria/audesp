import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, Plus, Trash2, EyeOff, Copy } from 'lucide-react';
import { SECTION_STRUCTURE } from '../schemas/audespSchema';
import { validateField } from '../services/validationService';

interface FormData {
  [key: string]: any;
}

interface ValidationError {
  path: string;
  message: string;
  value?: any;
  expected?: any;
}

const FormBuilder: React.FC<{ data: FormData; onChange: (data: FormData) => void }> = ({ data, onChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['descritor']));
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showJsonPanel, setShowJsonPanel] = useState(true);

  const toggleSection = useCallback((sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  }, [expandedSections]);

  const handleFieldChange = useCallback((path: string, value: any) => {
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onChange(newData);

    // Validar campo
    const error = validateField(path, value);
    setErrors(errors.filter(e => e.path !== path));
    if (error) {
      setErrors([...errors, { path, message: error }]);
    }
  }, [data, onChange, errors]);

  const renderField = useCallback((field: any, path: string) => {
    const value = data[path.split('.').pop()] || '';
    const error = errors.find(e => e.path === path);

    const fieldClass = `w-full px-3 py-2 border rounded-lg ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
    } focus:outline-none focus:ring-2 ${
      error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              placeholder={field.placeholder || ''}
              className={fieldClass}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value ? parseFloat(e.target.value) : '')}
              className={fieldClass}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      case 'currency':
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={typeof value === 'number' ? value.toFixed(2) : value}
              onChange={(e) => handleFieldChange(path, e.target.value ? parseFloat(e.target.value.replace(/[^\d.]/g, '')) : '')}
              placeholder="0.00"
              className={fieldClass}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              className={fieldClass}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      case 'select':
        const options = field.options || [];
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecione...</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={path} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(path, e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
          </div>
        );

      default:
        return null;
    }
  }, [data, errors, handleFieldChange]);

  const renderSection = useCallback((section: any) => {
    const isExpanded = expandedSections.has(section.id);
    const sectionData = data[section.id] || {};

    if (section.subsections) {
      const items = Array.isArray(sectionData) ? sectionData : [];
      return (
        <div key={section.id} className="mb-4 border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              {section.title}
            </span>
            <span className="text-sm bg-blue-800 px-2 py-1 rounded">{items.length}</span>
          </button>

          {isExpanded && (
            <div className="p-4 bg-white">
              {items.map((item, idx) => (
                <div key={idx} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">
                      {section.subsections[0].title} #{idx + 1}
                    </h4>
                    <button
                      onClick={() => {
                        const newItems = items.filter((_, i) => i !== idx);
                        onChange({ ...data, [section.id]: newItems });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {section.subsections[0].fields.map(field => 
                    renderField(field, `${section.id}[${idx}].${field.name}`)
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const newItems = [...items, {}];
                  onChange({ ...data, [section.id]: newItems });
                }}
                className="w-full py-2 px-4 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Adicionar {section.subsections[0].title}
              </button>
            </div>
          )}
        </div>
      );
    } else {
      // Simple section
      return (
        <div key={section.id} className="mb-4 border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium hover:from-gray-700 hover:to-gray-800 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              {section.title}
            </span>
          </button>

          {isExpanded && (
            <div className="p-4 bg-white">
              {section.fields.map(field => 
                renderField(field, `${section.id}.${field.name}`)
              )}
            </div>
          )}
        </div>
      );
    }
  }, [expandedSections, data, onChange, renderField, toggleSection]);

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Panel - Form */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Prestação de Contas AUDESP</h1>
          {SECTION_STRUCTURE.map(section => renderSection(section))}
        </div>
      </div>

      {/* Right Panel - JSON */}
      {showJsonPanel && (
        <div className="w-96 border border-gray-300 rounded-lg bg-white flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">JSON Preview</h2>
            <button
              onClick={() => setShowJsonPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <EyeOff size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <pre className="text-xs bg-gray-100 p-3 rounded border border-gray-200 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
              }}
              className="w-full mt-3 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Copy size={16} /> Copiar JSON
            </button>
          </div>

          {errors.length > 0 && (
            <div className="border-t border-gray-200 p-4 max-h-32 overflow-auto">
              <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle size={16} /> Erros ({errors.length})
              </h3>
              {errors.map((err, idx) => (
                <div key={idx} className="text-xs text-red-600 mb-1">
                  <strong>{err.path}</strong>: {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
