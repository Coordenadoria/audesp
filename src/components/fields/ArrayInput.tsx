import React, { useCallback } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface ArrayInputProps {
  label: string;
  items: any[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange?: (index: number, item: any) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  itemTemplate?: (item: any, index: number) => React.ReactNode;
  minItems?: number;
  maxItems?: number;
}

export const ArrayInput: React.FC<ArrayInputProps> = ({
  label,
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
  required,
  error,
  hint,
  disabled,
  itemTemplate,
  minItems = 0,
  maxItems = 100,
}) => {
  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  const handleAddClick = useCallback(() => {
    if (canAdd && !disabled) {
      onAddItem();
    }
  }, [canAdd, disabled, onAddItem]);

  const handleRemoveClick = useCallback(
    (index: number) => {
      if (canRemove && !disabled) {
        onRemoveItem(index);
      }
    },
    [canRemove, disabled, onRemoveItem]
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {label}
        </h3>
        {required && <span className="text-red-500">*</span>}
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {items.length} de {maxItems}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                {itemTemplate ? (
                  itemTemplate(item, index)
                ) : (
                  <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveClick(index)}
                disabled={!canRemove || disabled}
                className={`flex-shrink-0 p-2 rounded transition-colors ${
                  canRemove && !disabled
                    ? 'hover:bg-red-100 text-red-600 hover:text-red-700'
                    : 'opacity-50 cursor-not-allowed text-gray-400'
                }`}
                title="Remover item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="p-6 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
            <AlertCircle size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Nenhum item adicionado</p>
            <p className="text-xs text-gray-400 mt-1">
              Clique em "Adicionar" para começar
            </p>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={handleAddClick}
        disabled={!canAdd || disabled}
        className={`w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
          canAdd && !disabled
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 cursor-not-allowed text-gray-500'
        }`}
      >
        <Plus size={18} />
        Adicionar {label.toLowerCase()}
      </button>

      {/* Info Messages */}
      {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {items.length >= maxItems && (
        <p className="text-xs text-yellow-600 mt-2">
          ⚠️ Limite máximo de {maxItems} itens atingido
        </p>
      )}

      {items.length < minItems && minItems > 0 && (
        <p className="text-xs text-red-600 mt-2">
          ❌ Mínimo de {minItems} item(ns) necessário(s)
        </p>
      )}
    </div>
  );
};

export default ArrayInput;
