import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Copy } from 'lucide-react';

interface JSONEditorProps {
  data: any;
  onChange: (data: any) => void;
  errors?: Array<{ path: string; message: string }>;
  onError?: (error: string | null) => void;
}

export const JSONEditor: React.FC<JSONEditorProps> = ({
  data,
  onChange,
  errors,
  onError,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sincronizar quando data props mudam
  useEffect(() => {
    setJsonText(JSON.stringify(data, null, 2));
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);

    try {
      const parsed = JSON.parse(text);
      setIsValid(true);
      setValidationError(null);
      onError?.(null);
      onChange(parsed);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'JSON inválido';
      setIsValid(false);
      setValidationError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setIsValid(true);
      setValidationError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'JSON inválido';
      setValidationError(errorMsg);
    }
  };

  const highlightErrors = () => {
    if (!errors || errors.length === 0) return jsonText;

    let highlighted = jsonText;
    errors.forEach((err) => {
      const path = err.path.replace(/\//g, '.');
      const regex = new RegExp(`"${path}"`, 'g');
      highlighted = highlighted.replace(regex, `"${path}"/* ERROR */`);
    });

    return highlighted;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 flex items-center justify-between border-b border-slate-600">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Editor JSON</h3>
          {isValid ? (
            <CheckCircle size={18} className="text-green-400" />
          ) : (
            <AlertCircle size={18} className="text-red-400" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`p-2 rounded transition-all ${
              copied
                ? 'bg-green-600'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            title="Copiar"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2">
        <button
          onClick={handleFormat}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Formatar
        </button>
        <button
          onClick={() => setJsonText('{}' )}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
        >
          Limpar
        </button>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={jsonText}
        onChange={handleChange}
        className={`flex-1 p-4 font-mono text-sm resize-none focus:outline-none ${
          isValid
            ? 'bg-white text-gray-800'
            : 'bg-red-50 text-red-900'
        }`}
        spellCheck="false"
      />

      {/* Error Messages */}
      {validationError && (
        <div className="bg-red-50 border-t border-red-200 p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Erro JSON:</p>
            <p className="text-xs mt-1 font-mono">{validationError}</p>
          </div>
        </div>
      )}

      {/* Info */}
      {isValid && (
        <div className="bg-green-50 border-t border-green-200 p-2 text-xs text-green-700">
          ✓ JSON válido - {jsonText.length.toLocaleString()} caracteres
        </div>
      )}
    </div>
  );
};

export default JSONEditor;
