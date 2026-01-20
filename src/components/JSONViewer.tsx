import React, { useState, useRef } from 'react';
import { Copy, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationError } from '../services/AUDESPValidator';

interface JSONViewerProps {
  data: any;
  errors?: ValidationError[];
  onFieldClick?: (path: string) => void;
}

interface JSONNodeProps {
  name?: string;
  value: any;
  path: string;
  errors?: ValidationError[];
  level: number;
  onFieldClick?: (path: string) => void;
}

const JSONNode: React.FC<JSONNodeProps> = ({
  name,
  value,
  path,
  errors,
  level,
  onFieldClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasErrors = errors?.some(
    (e) => e.path === path || (e.path.startsWith(path) && e.path[path.length] === '.')
  );
  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === 'object';
  const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;

  if (!isObject) {
    return (
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer transition-colors ${
          hasErrors ? 'bg-red-50' : ''
        }`}
        onClick={() => onFieldClick?.(path)}
      >
        {name && (
          <>
            <span className="text-blue-600 font-mono">{name}:</span>
            {hasErrors && <AlertCircle size={14} className="text-red-600 flex-shrink-0" />}
          </>
        )}
        <span
          className={`font-mono ${
            typeof value === 'string'
              ? 'text-green-600'
              : typeof value === 'number'
              ? 'text-orange-600'
              : typeof value === 'boolean'
              ? 'text-purple-600'
              : 'text-gray-600'
          }`}
        >
          {JSON.stringify(value)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`py-1 ${hasErrors ? 'bg-red-50 rounded' : ''}`}
    >
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="flex-shrink-0 p-0 hover:bg-gray-200 rounded">
          {isExpanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronUp size={16} />
          )}
        </button>
        {name && (
          <>
            <span className="text-blue-600 font-mono font-semibold">{name}</span>
            {hasErrors && <AlertCircle size={14} className="text-red-600 flex-shrink-0" />}
          </>
        )}
        <span className="text-gray-500 text-sm">
          {isArray ? `[${value.length}]` : `{${Object.keys(value).length}}`}
        </span>
      </div>

      {isExpanded && (
        <div className="ml-4 border-l border-gray-300 pl-2">
          {isEmpty ? (
            <div className="text-gray-400 text-sm py-1 px-2">empty</div>
          ) : isArray ? (
            value.map((item, idx) => (
              <JSONNode
                key={idx}
                name={`[${idx}]`}
                value={item}
                path={`${path}/${idx}`}
                errors={errors}
                level={level + 1}
                onFieldClick={onFieldClick}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <JSONNode
                key={key}
                name={key}
                value={val}
                path={`${path}/${key}`}
                errors={errors}
                level={level + 1}
                onFieldClick={onFieldClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const JSONViewer: React.FC<JSONViewerProps> = ({
  data,
  errors = [],
  onFieldClick,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString)
    );
    element.setAttribute(
      'download',
      `prestacao-contas-${new Date().toISOString().split('T')[0]}.json`
    );
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">JSON Resultado</h3>
          <p className="text-sm text-slate-200">
            {JSON.stringify(data).length.toLocaleString()} bytes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`p-2 rounded transition-all ${
              copyFeedback
                ? 'bg-green-600 text-white'
                : 'bg-slate-600 hover:bg-slate-500 text-white'
            }`}
            title="Copiar JSON"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-all"
            title="Download JSON"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gray-50">
        <JSONNode
          value={data}
          path=""
          errors={errors}
          level={0}
          onFieldClick={onFieldClick}
        />
      </div>

      {/* Raw JSON */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="mb-2 flex items-center gap-2">
          <h4 className="font-semibold text-sm text-gray-700">JSON Bruto</h4>
          <span className="text-xs text-gray-500">
            {copyFeedback && '✓ Copiado!'}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          readOnly
          value={JSON.stringify(data, null, 2)}
          className="w-full h-32 p-2 border border-gray-200 rounded font-mono text-xs bg-gray-50 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default JSONViewer;
