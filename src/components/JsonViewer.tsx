import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  validationErrors?: Record<string, any>;
}

export default function JsonViewer({ data, validationErrors }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (key: string, value: any, path: string = ''): React.ReactNode => {
    const currentPath = path ? `${path}.${key}` : key;
    const hasError = validationErrors?.[currentPath];

    const className = `${
      hasError ? 'bg-red-50 border-l-4 border-l-red-500' : 'border-l-4 border-l-gray-200'
    } pl-3 py-1`;

    if (value === null || value === undefined) {
      return (
        <div key={key} className={className}>
          <span className="text-gray-600">{key}:</span>
          <span className="text-gray-400 ml-2">null</span>
        </div>
      );
    }

    if (typeof value === 'object' && Array.isArray(value)) {
      return (
        <div key={key} className={className}>
          <details>
            <summary className="cursor-pointer font-medium">
              <span className="text-blue-600">{key}</span>
              <span className="text-gray-500 ml-2">[{value.length} items]</span>
            </summary>
            <div className="ml-4 mt-2 space-y-2">
              {value.map((item, idx) => (
                <div key={idx} className="border-l border-gray-200 pl-3 py-1">
                  {typeof item === 'object' && item !== null ? (
                    <details>
                      <summary className="cursor-pointer">[{idx}]</summary>
                      <div className="ml-4 mt-1 space-y-1">
                        {Object.entries(item).map(([k, v]) => renderValue(k, v, `${currentPath}[${idx}]`))}
                      </div>
                    </details>
                  ) : (
                    <span className="text-gray-700">
                      [{idx}]: <span className="text-green-600">{String(item)}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div key={key} className={className}>
          <details>
            <summary className="cursor-pointer font-medium">
              <span className="text-blue-600">{key}</span>
            </summary>
            <div className="ml-4 mt-2 space-y-2">
              {Object.entries(value).map(([k, v]) => renderValue(k, v, currentPath))}
            </div>
          </details>
        </div>
      );
    }

    if (typeof value === 'string') {
      return (
        <div key={key} className={className}>
          <span className="text-gray-600">{key}:</span>
          <span className="text-green-600 ml-2">"{value}"</span>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className={className}>
          <span className="text-gray-600">{key}:</span>
          <span className="text-blue-600 ml-2">{value}</span>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className={className}>
          <span className="text-gray-600">{key}:</span>
          <span className={`ml-2 font-semibold ${value ? 'text-green-600' : 'text-red-600'}`}>
            {value ? 'true' : 'false'}
          </span>
        </div>
      );
    }

    return (
      <div key={key} className={className}>
        <span className="text-gray-600">{key}:</span>
        <span className="text-gray-700 ml-2">{String(value)}</span>
      </div>
    );
  };

  const hasErrors = Object.keys(validationErrors || {}).length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">JSON Data</h3>
          {hasErrors && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded text-red-700 text-xs font-medium">
              <AlertCircle size={14} />
              Erros detectados
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
        >
          {copied ? (
            <>
              <Check size={16} />
              Copiado
            </>
          ) : (
            <>
              <Copy size={16} />
              Copiar
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
        {Object.entries(data).map(([key, value]) => renderValue(key, value))}
      </div>
    </div>
  );
}
