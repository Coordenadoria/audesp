import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ArrayTableProps {
  title: string;
  description?: string;
  items: any[];
  onAdd?: () => void;
  onEdit?: (index: number, item: any) => void;
  onDelete?: (index: number) => void;
  columns: Array<{
    key: string;
    label: string;
    type?: string;
  }>;
  rowErrors?: Record<number, string[]>;
  isValid?: boolean;
}

export default function ArrayTable({
  title,
  description,
  items,
  onAdd,
  onEdit,
  onDelete,
  columns,
  rowErrors,
  isValid,
}: ArrayTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRowExpand = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`p-4 border-b border-gray-200 flex items-center justify-between ${
          isValid === false ? 'bg-red-50' : isValid === true ? 'bg-green-50' : 'bg-blue-50'
        }`}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <Plus size={18} />
            Adicionar
          </button>
        )}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Nenhum registro adicionado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10"></th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="w-24 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      rowErrors?.[index] ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRowExpand(index)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {expandedRows.includes(index) ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </td>

                    {columns.map((col) => (
                      <td
                        key={`${index}-${col.key}`}
                        className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                      >
                        {String(item[col.key] || '')}
                      </td>
                    ))}

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rowErrors?.[index] && (
                          <AlertCircle size={18} className="text-red-600" />
                        )}
                        {!rowErrors?.[index] && isValid !== false && (
                          <CheckCircle size={18} className="text-green-600" />
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(index, item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedRows.includes(index) && rowErrors?.[index] && (
                    <tr className="bg-red-50">
                      <td colSpan={columns.length + 2} className="px-4 py-3">
                        <div className="space-y-1">
                          {rowErrors[index].map((error, errIdx) => (
                            <div key={errIdx} className="flex items-start gap-2">
                              <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-1" />
                              <span className="text-sm text-red-700">{error}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
