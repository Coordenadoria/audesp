import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, Copy, Download } from 'lucide-react';

interface AdvancedJSONViewerProps {
  data: any;
  errors?: Array<{ path: string; message: string }>;
  onPathClick?: (path: string) => void;
}

interface SearchResult {
  path: string;
  value: any;
  key: string;
}

export const AdvancedJSONViewer: React.FC<AdvancedJSONViewerProps> = ({
  data,
  errors = [],
  onPathClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'populated'>('all');

  // Buscar recursivamente no JSON
  const search = useCallback((obj: any, path: string = '', results: SearchResult[] = []): SearchResult[] => {
    if (obj === null || obj === undefined) return results;

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        const itemPath = `${path}[${idx}]`;
        if (typeof item === 'object') {
          search(item, itemPath, results);
        } else {
          const strValue = String(item).toLowerCase();
          if (strValue.includes(searchTerm.toLowerCase())) {
            results.push({ path: itemPath, value: item, key: `[${idx}]` });
          }
        }
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object') {
          search(value, currentPath, results);
        } else {
          const strValue = String(value).toLowerCase();
          if (strValue.includes(searchTerm.toLowerCase())) {
            results.push({ path: currentPath, value, key });
          }
        }
      });
    }

    return results;
  }, [searchTerm]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return search(data);
  }, [searchTerm, data, search]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString)
    );
    element.setAttribute('download', `audesp-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4">
        <h3 className="font-bold text-lg mb-3">Visualizador JSON Avançado</h3>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-2 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar em todo JSON..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-600 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button onClick={handleCopy} className="p-1.5 hover:bg-slate-600 rounded transition-colors" title="Copiar">
            <Copy size={18} />
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-slate-600 rounded transition-colors" title="Download">
            <Download size={18} />
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'errors', 'populated'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-600 text-gray-200 hover:bg-slate-500'
              }`}
            >
              {type === 'all' && 'Todos'}
              {type === 'errors' && '❌ Erros'}
              {type === 'populated' && '✓ Preenchidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gray-50">
        {searchResults.length > 0 && searchTerm ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 mb-2">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => onPathClick?.(result.path)}
                className="p-2 bg-white border border-yellow-200 rounded cursor-pointer hover:bg-yellow-50 transition-colors"
              >
                <div className="text-xs text-gray-600">{result.path}</div>
                <div className="text-sm text-gray-900 mt-1">
                  {String(result.value).substring(0, 100)}
                  {String(result.value).length > 100 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <JSONTreeNode
            value={data}
            path=""
            expanded={expandedPaths}
            onToggle={togglePath}
            errors={errors}
            onPathClick={onPathClick}
          />
        )}
      </div>
    </div>
  );
};

interface JSONTreeNodeProps {
  value: any;
  path: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  errors: Array<{ path: string; message: string }>;
  onPathClick?: (path: string) => void;
}

const JSONTreeNode: React.FC<JSONTreeNodeProps> = ({
  value,
  path,
  expanded,
  onToggle,
  errors,
  onPathClick,
}) => {
  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === 'object';
  const hasError = errors.some((e) => e.path === path || e.path.startsWith(path + '/'));

  if (!isObject) {
    const displayValue = JSON.stringify(value);
    return (
      <div
        onClick={() => onPathClick?.(path)}
        className={`py-1 px-2 rounded cursor-pointer hover:bg-gray-200 transition-colors ${
          hasError ? 'bg-red-100' : ''
        }`}
      >
        <span className="text-blue-600">{path.split('.').pop() || 'value'}:</span>
        <span
          className={`ml-2 ${
            typeof value === 'string'
              ? 'text-green-600'
              : typeof value === 'number'
              ? 'text-orange-600'
              : typeof value === 'boolean'
              ? 'text-purple-600'
              : 'text-gray-600'
          }`}
        >
          {displayValue}
        </span>
      </div>
    );
  }

  const isExpanded = expanded.has(path);
  const isEmpty = isArray ? value.length === 0 : Object.keys(value).length === 0;

  return (
    <div className={hasError ? 'bg-red-50 rounded-lg p-1 mb-1' : ''}>
      <div
        onClick={() => onToggle(path)}
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <span className="text-gray-600 select-none">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="text-blue-600 font-semibold">{path.split('.').pop() || 'root'}:</span>
        <span className="text-gray-500 text-sm">
          {isArray ? `[${value.length}]` : `{${Object.keys(value).length}}`}
        </span>
      </div>

      {isExpanded && (
        <div className="ml-4 border-l border-gray-300 pl-2">
          {isEmpty ? (
            <div className="text-gray-400 text-sm py-1">empty</div>
          ) : isArray ? (
            value.map((item, idx) => (
              <JSONTreeNode
                key={idx}
                value={item}
                path={`${path}[${idx}]`}
                expanded={expanded}
                onToggle={onToggle}
                errors={errors}
                onPathClick={onPathClick}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <JSONTreeNode
                key={key}
                value={val}
                path={path ? `${path}.${key}` : key}
                expanded={expanded}
                onToggle={onToggle}
                errors={errors}
                onPathClick={onPathClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedJSONViewer;
