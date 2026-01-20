import React, { useState, useCallback } from 'react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { DocumentLink } from '../services/DocumentLinker';
import { FieldMapping } from '../services/FieldExtractor';

interface PDFReviewPanelProps {
  documentId: string;
  fileName: string;
  ocrConfidence: number;
  extractedFields: FieldMapping[];
  link?: DocumentLink;
  onApprove?: (updatedFields: Record<string, string>) => void;
  onReject?: () => void;
  onEdit?: (fieldName: string, newValue: string) => void;
}

interface EditingField {
  fieldName: string;
  originalValue: string;
  editedValue: string;
}

export const PDFReviewPanel: React.FC<PDFReviewPanelProps> = ({
  documentId,
  fileName,
  ocrConfidence,
  extractedFields,
  link,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 border-green-300 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  const getConfidenceIcon = (confidence: number): React.ReactNode => {
    if (confidence >= 0.9) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (confidence >= 0.7) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getQualityLabel = (confidence: number): string => {
    if (confidence >= 0.9) return 'Excelente';
    if (confidence >= 0.7) return 'Boa';
    if (confidence >= 0.5) return 'Razoável';
    return 'Baixa';
  };

  const handleEditStart = (fieldName: string, currentValue: string) => {
    setEditingField({
      fieldName,
      originalValue: currentValue,
      editedValue: editedFields[fieldName] || currentValue,
    });
  };

  const handleEditSave = () => {
    if (editingField) {
      setEditedFields({
        ...editedFields,
        [editingField.fieldName]: editingField.editedValue,
      });
      onEdit?.(editingField.fieldName, editingField.editedValue);
      setEditingField(null);
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
  };

  const handleApprove = () => {
    onApprove?.(editedFields);
  };

  const highConfidenceFields = extractedFields.filter((f) => f.matchConfidence >= 0.85);
  const mediumConfidenceFields = extractedFields.filter(
    (f) => f.matchConfidence >= 0.7 && f.matchConfidence < 0.85
  );
  const lowConfidenceFields = extractedFields.filter((f) => f.matchConfidence < 0.7);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3 flex-1">
          <FileText className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{fileName}</h3>
            <p className="text-sm text-gray-500">ID: {documentId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getConfidenceColor(ocrConfidence)}`}
          >
            {getConfidenceIcon(ocrConfidence)}
            <span className="text-sm font-medium">
              {getQualityLabel(ocrConfidence)} ({(ocrConfidence * 100).toFixed(0)}%)
            </span>
          </div>

          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {/* Link Info */}
          {link && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2">Informações de Link</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Seção Vinculada</p>
                  <p className="text-blue-600">{link.linkedFormSection}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Confiança de Link</p>
                  <p className="text-blue-600">{(link.linkStrength * 100).toFixed(0)}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-blue-700 font-medium mb-1">Campos Vinculados</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(link.linkedFields.entries()).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {link.notes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  {link.notes.map((note, i) => (
                    <p key={i} className="text-blue-600 text-sm">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* High Confidence Fields */}
          {highConfidenceFields.length > 0 && (
            <div className="p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Campos Confiáveis ({highConfidenceFields.length})
              </h4>
              <div className="space-y-2">
                {highConfidenceFields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{field.formField}</p>
                      {editingField?.fieldName === field.formField ? (
                        <input
                          type="text"
                          value={editingField.editedValue}
                          onChange={(e) =>
                            setEditingField({ ...editingField, editedValue: e.target.value })
                          }
                          className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-gray-600">{field.extractedField.value}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
                        {(field.matchConfidence * 100).toFixed(0)}%
                      </span>
                      {editingField?.fieldName === field.formField ? (
                        <>
                          <button
                            onClick={handleEditSave}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(field.formField, field.extractedField.value)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Confidence Fields */}
          {mediumConfidenceFields.length > 0 && (
            <div className="p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Campos para Verificar ({mediumConfidenceFields.length})
              </h4>
              <div className="space-y-2">
                {mediumConfidenceFields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{field.formField}</p>
                      {editingField?.fieldName === field.formField ? (
                        <input
                          type="text"
                          value={editingField.editedValue}
                          onChange={(e) =>
                            setEditingField({ ...editingField, editedValue: e.target.value })
                          }
                          className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">{field.extractedField.value}</p>
                          {field.suggestions.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              💡 Sugestões: {field.suggestions.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">
                        {(field.matchConfidence * 100).toFixed(0)}%
                      </span>
                      {editingField?.fieldName === field.formField ? (
                        <>
                          <button
                            onClick={handleEditSave}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(field.formField, field.extractedField.value)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Confidence Fields */}
          {lowConfidenceFields.length > 0 && (
            <div className="p-4 bg-red-50">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Campos com Baixa Confiança ({lowConfidenceFields.length})
              </h4>
              <div className="space-y-2">
                {lowConfidenceFields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{field.formField}</p>
                      {editingField?.fieldName === field.formField ? (
                        <input
                          type="text"
                          value={editingField.editedValue}
                          onChange={(e) =>
                            setEditingField({ ...editingField, editedValue: e.target.value })
                          }
                          className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">{field.extractedField.value}</p>
                          {field.suggestions.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              💡 Sugestões: {field.suggestions.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded">
                        {(field.matchConfidence * 100).toFixed(0)}%
                      </span>
                      {editingField?.fieldName === field.formField ? (
                        <>
                          <button
                            onClick={handleEditSave}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Salvar"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(field.formField, field.extractedField.value)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end">
            <button
              onClick={onReject}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Rejeitar
            </button>
            <button
              onClick={() => {
                /* Download document */
              }}
              className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Aprovar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFReviewPanel;
