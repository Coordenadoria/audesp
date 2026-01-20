import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ObjectGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isValid?: boolean;
  errors?: string[];
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export default function ObjectGroup({
  title,
  description,
  children,
  isValid,
  errors,
  expanded = true,
  onToggleExpand,
}: ObjectGroupProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between ${
          isValid === false ? 'bg-red-50' : isValid === true ? 'bg-green-50' : 'bg-blue-50'
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          {isValid === false && (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          )}
          {isValid === true && (
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          )}
          {isValid !== false && isValid !== true && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex-shrink-0" />
          )}

          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-4">
          {errors && errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
}
