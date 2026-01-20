import React, { useState } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import ErrorPanel from './ErrorPanel';
import JSONViewer from './JSONViewer';
import JSONEditor from './JSONEditor';
import SectionManager, { SectionConfig } from './SectionManager';
import { Menu, X } from 'lucide-react';

interface FormLayoutProps {
  sections: SectionConfig[];
  initialData?: any;
  onSubmit?: (data: any) => void;
  showJSONEditor?: boolean;
  showJSONViewer?: boolean;
  showErrorPanel?: boolean;
  title?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  sections,
  initialData = {},
  onSubmit,
  showJSONEditor = true,
  showJSONViewer = true,
  showErrorPanel = true,
  title = 'Formulário',
}) => {
  const form = useFormValidation(initialData);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'errors' | 'json' | 'editor'>('errors');

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Main Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Completude: {form.validationResult.summary.completionPercentage}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button
              onClick={() => onSubmit?.(form.formData)}
              disabled={!form.validationResult.isValid}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                form.validationResult.isValid
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 cursor-not-allowed text-gray-600'
              }`}
            >
              {form.validationResult.isValid ? '✓ Enviar' : '❌ Erros'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            <SectionManager sections={sections} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:relative right-0 top-0 bottom-0 w-full md:w-96 bg-white border-l border-gray-200 transform transition-transform md:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {showErrorPanel && (
            <button
              onClick={() => setActiveTab('errors')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'errors'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Erros ({form.validationResult.summary.totalErrors})
            </button>
          )}
          {showJSONViewer && (
            <button
              onClick={() => setActiveTab('json')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'json'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              JSON
            </button>
          )}
          {showJSONEditor && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'editor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Editor
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'errors' && showErrorPanel && (
            <div className="h-full overflow-y-auto">
              <ErrorPanel
                errors={form.validationResult.errors}
                warnings={form.validationResult.warnings}
                completionPercentage={
                  form.validationResult.summary.completionPercentage
                }
                isOpen={true}
              />
            </div>
          )}

          {activeTab === 'json' && showJSONViewer && (
            <div className="h-full">
              <JSONViewer
                data={form.formData}
                errors={form.validationResult.errors}
              />
            </div>
          )}

          {activeTab === 'editor' && showJSONEditor && (
            <div className="h-full">
              <JSONEditor
                data={form.formData}
                onChange={(newData) => {
                  form.setFormData(newData);
                  form.validateForm(newData);
                }}
                errors={form.validationResult.errors}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormLayout;
