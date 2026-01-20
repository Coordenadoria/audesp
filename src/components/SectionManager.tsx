import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface SectionConfig {
  id: number;
  title: string;
  description?: string;
  completed?: boolean;
  errors?: number;
  warnings?: number;
  children: React.ReactNode;
}

interface SectionManagerProps {
  sections: SectionConfig[];
  onSectionClick?: (sectionId: number) => void;
  expandedSections?: Record<number, boolean>;
  onToggleSection?: (sectionId: number, expanded: boolean) => void;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  onSectionClick,
  expandedSections: controlledExpanded,
  onToggleSection,
}) => {
  const [localExpanded, setLocalExpanded] = useState<Record<number, boolean>>({
    1: true, // Primeira seção aberta por padrão
  });

  const expanded = controlledExpanded || localExpanded;

  const handleToggle = useCallback(
    (sectionId: number) => {
      const newState = !expanded[sectionId];
      
      if (onToggleSection) {
        onToggleSection(sectionId, newState);
      } else {
        setLocalExpanded((prev) => ({
          ...prev,
          [sectionId]: newState,
        }));
      }
    },
    [expanded, onToggleSection]
  );

  const getStatusIcon = (section: SectionConfig) => {
    if (section.errors && section.errors > 0) {
      return <AlertCircle size={18} className="text-red-600" />;
    }
    if (section.warnings && section.warnings > 0) {
      return <AlertCircle size={18} className="text-yellow-600" />;
    }
    if (section.completed) {
      return <CheckCircle size={18} className="text-green-600" />;
    }
    return <Clock size={18} className="text-gray-400" />;
  };

  const getStatusColor = (section: SectionConfig) => {
    if (section.errors && section.errors > 0) {
      return 'bg-red-50 border-red-200';
    }
    if (section.warnings && section.warnings > 0) {
      return 'bg-yellow-50 border-yellow-200';
    }
    if (section.completed) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`border rounded-lg transition-all ${getStatusColor(section)}`}
        >
          {/* Header */}
          <button
            onClick={() => {
              handleToggle(section.id);
              onSectionClick?.(section.id);
            }}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-75 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <div className="flex-shrink-0">
                {expanded[section.id] ? (
                  <ChevronUp size={20} className="text-gray-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{section.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Badges */}
              {section.errors && section.errors > 0 && (
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded-full">
                  {section.errors} erro{section.errors !== 1 ? 's' : ''}
                </span>
              )}
              {section.warnings && section.warnings > 0 && (
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                  {section.warnings} aviso{section.warnings !== 1 ? 's' : ''}
                </span>
              )}

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(section)}
              </div>
            </div>
          </button>

          {/* Content */}
          {expanded[section.id] && (
            <div className="border-t border-gray-200 px-4 py-3 bg-opacity-50">
              {section.children}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SectionManager;
