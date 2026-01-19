import React, { useState, useRef, useCallback, useMemo } from 'react';
import PDFViewer from './PDFViewer';
import JSONPreview from './JSONPreview';
import { OCRService } from '../services/advancedOCRService';
import { JSONValidator } from '../services/jsonValidationService';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'currency' | 'select' | 'textarea';
  required?: boolean;
  format?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FormSchemaProps {
  fields: FormField[];
  schema: Record<string, any>;
  title?: string;
  onSubmit?: (data: Record<string, any>) => void;
  onCancel?: () => void;
}

export const FormWithOCR: React.FC<FormSchemaProps> = ({
  fields,
  schema,
  title = 'Preenchimento com OCR',
  onSubmit,
  onCancel
}) => {
  // Estado dos formulários
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrRunning, setOcrRunning] = useState<boolean>(false);
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(true);
  const [layout, setLayout] = useState<'split' | 'stacked'>('split');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfViewerRef = useRef<any>(null);

  // Carregar PDF
  const handlePdfUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  }, []);

  // Processar OCR
  const handleProcessOCR = useCallback(async () => {
    if (!pdfFile) return;

    setOcrRunning(true);
    setOcrProgress(0);

    try {
      const extracted = await OCRService.processPDF(pdfFile, {
        onProgress: (page, total) => {
          setOcrProgress(Math.round((page / total) * 100));
        }
      });

      // Detectar campos automaticamente
      const detected = OCRService.suggestMapping(extracted, schema);

      setExtractedFields(detected);
      setFormData(prev => ({
        ...prev,
        ...detected
      }));
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      alert('Erro ao processar PDF. Tente novamente.');
    } finally {
      setOcrRunning(false);
      setOcrProgress(0);
    }
  }, [pdfFile, schema]);

  // Atualizar campo do formulário
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Aplicar sugestão automática
  const handleApplySuggestion = useCallback((field: string, suggestedValue: string) => {
    handleFieldChange(field, suggestedValue);
  }, [handleFieldChange]);

  // Copiar para área de transferência
  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    alert('JSON copiado para a área de transferência');
  }, [formData]);

  // Renderizar campo do formulário
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    const baseClasses = 'w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} resize-none h-20`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
          >
            <option value="">Selecionar...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        );
    }
  };

  // Layout de split (Desktop)
  const renderSplitLayout = () => (
    <div className="flex h-screen bg-slate-100">
      {/* PDF Panel */}
      <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Documento PDF</h3>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              Carregar PDF
            </button>
            {pdfFile && (
              <button
                onClick={handleProcessOCR}
                disabled={ocrRunning}
                className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-400 transition font-medium"
              >
                {ocrRunning ? `OCR ${ocrProgress}%` : 'Processar OCR'}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
        </div>

        {pdfFile && (
          <div className="flex-1 overflow-hidden">
            <PDFViewer
              file={pdfFile}
              onTextSelected={(text) => {
                console.log('Texto selecionado:', text);
              }}
            />
          </div>
        )}

        {!pdfFile && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p className="text-sm">Nenhum PDF carregado</p>
          </div>
        )}
      </div>

      {/* Form Panel */}
      <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Formulário</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form className="p-4 space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-600">*</span>}
                </label>
                {renderField(field)}
                {extractedFields[field.name] && extractedFields[field.name] !== formData[field.name] && (
                  <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">Sugestão: {extractedFields[field.name]}</p>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(field.name, extractedFields[field.name])}
                      className="mt-1 text-xs text-yellow-700 hover:text-yellow-900 font-medium"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </form>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm bg-slate-300 text-slate-900 rounded hover:bg-slate-400 transition font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit?.(formData)}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* JSON Preview Panel */}
      <div className="w-1/3 flex flex-col overflow-hidden">
        <JSONPreview
          data={formData}
          schema={schema}
          onChange={setFormData}
          showValidation={true}
          showSuggestions={true}
        />
      </div>
    </div>
  );

  // Layout empilhado (Mobile)
  const renderStackedLayout = () => (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            Carregar PDF
          </button>
          {pdfFile && (
            <button
              onClick={handleProcessOCR}
              disabled={ocrRunning}
              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-400 transition font-medium"
            >
              {ocrRunning ? `OCR ${ocrProgress}%` : 'OCR'}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          className="hidden"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setShowJsonPanel(false)}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            !showJsonPanel
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Formulário
        </button>
        <button
          onClick={() => setShowJsonPanel(true)}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            showJsonPanel
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!showJsonPanel ? (
          // Form
          <div className="h-full overflow-y-auto">
            <form className="p-4 space-y-4 pb-20">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-600">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </form>
          </div>
        ) : (
          // JSON Preview
          <JSONPreview
            data={formData}
            schema={schema}
            onChange={setFormData}
            showValidation={true}
            showSuggestions={true}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm bg-slate-300 text-slate-900 rounded hover:bg-slate-400 transition font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSubmit?.(formData)}
          className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
        >
          Enviar
        </button>
      </div>
    </div>
  );

  // Detectar tamanho da tela
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div className="w-full h-full bg-slate-100">
      {isDesktop ? renderSplitLayout() : renderStackedLayout()}
    </div>
  );
};

export default FormWithOCR;
