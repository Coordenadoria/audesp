/**
 * JSON VIEWER MODERNO
 * Visualização profissional e interativa de estrutura JSON
 */

import React, { useState } from 'react';

interface JSONViewerModernProps {
  data: any;
  readOnly?: boolean;
}

const JSONViewerModern: React.FC<JSONViewerModernProps> = ({
  data,
  readOnly = true
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', 'prestacao-contas.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderValue = (key: string, value: any, depth: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400">{String(value)}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600 font-medium">{String(value)}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-cyan-600 font-medium">{value}</span>;
    }

    if (typeof value === 'string') {
      if (value.length > 50 && !searchTerm) {
        return <span className="text-green-600">"{value.substring(0, 47)}..."</span>;
      }
      return <span className="text-green-600">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div>
          <span
            className="cursor-pointer text-slate-700 hover:text-blue-600"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? '▼' : '▶'} <span className="text-slate-600">[{value.length} items]</span>
          </span>
          {isExpanded && (
            <div className="ml-4 mt-1 text-xs">
              {value.map((item, idx) => (
                <div key={idx} className="text-slate-700">
                  <span className="text-orange-600">[{idx}]</span>: {renderValue(`${key}[${idx}]`, item, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedKeys.has(key);
      const keys = Object.keys(value);
      return (
        <div>
          <span
            className="cursor-pointer text-slate-700 hover:text-blue-600"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? '▼' : '▶'} <span className="text-slate-600">{{{keys.length} keys}}</span>
          </span>
          {isExpanded && (
            <div className="ml-4 mt-1">
              {keys.map(k => (
                <div key={k} className="text-xs text-slate-700 my-1">
                  <span className="text-blue-600">"{k}"</span>: {renderValue(`${key}.${k}`, value[k], depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-slate-500">{String(value)}</span>;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* TOOLBAR */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Estrutura de Dados</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition"
            >
              {copied ? '✓ Copiado' : 'Copiar JSON'}
            </button>
            <button
              onClick={downloadJSON}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
            >
              Download JSON
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar campos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="font-mono text-xs">
          <div className="text-slate-700 bg-white p-4 rounded border border-slate-200 max-w-3xl">
            <div>
              <span className="text-slate-600">{"{"}</span>
              <div className="ml-4">
                {Object.entries(data).map(([key, value], idx) => (
                  <div key={key} className="text-slate-700 my-1">
                    <span className="text-blue-600">"{key}"</span>
                    <span className="text-slate-600">: </span>
                    {renderValue(key, value)}
                    <span className="text-slate-600">,</span>
                  </div>
                ))}
              </div>
              <span className="text-slate-600">{"}"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        {Object.keys(data).length} campos • Última atualização: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default JSONViewerModern;
