/**
 * COMPONENTE DE IMPORTAÇÃO EM LOTE DE PDFs
 * Upload, processamento com IA, e sugestão de preenchimento
 */

import React, { useState, useRef } from 'react';
import { PrestacaoContas } from '../types';
import AdvancedPDFService, { ExtractedDocument, BatchProcessingResult } from '../services/advancedPDFService';

interface BatchPDFImporterProps {
  onDocumentsProcessed: (results: BatchProcessingResult) => void;
  onApplySuggestions: (field: string, value: string) => void;
  formData: PrestacaoContas;
}

export const BatchPDFImporter: React.FC<BatchPDFImporterProps> = ({
  onDocumentsProcessed,
  onApplySuggestions,
  formData
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchProcessingResult | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file: File) =>
      file.type === 'application/pdf'
    );

    if (selectedFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos PDF');
      return;
    }

    setFiles(selectedFiles);
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      alert('Selecione pelo menos um arquivo PDF');
      return;
    }

    setIsProcessing(true);

    try {
      const batchResults = await AdvancedPDFService.processBatchPDFs(files);
      setResults(batchResults);
      onDocumentsProcessed(batchResults);

      // Selecionar primeiro documento
      if (batchResults.extractedDocuments.length > 0) {
        setSelectedDoc(batchResults.extractedDocuments[0]);
      }
    } catch (error: any) {
      alert(`Erro ao processar PDFs: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplySuggestion = (field: string, value: string) => {
    onApplySuggestions(field, value);
    alert(`Campo '${field}' preenchido com: ${value}`);
  };

  const progress = results
    ? Math.round((results.processedFiles / results.totalFiles) * 100)
    : 0;

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      {/* CABEÇALHO */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          📄 Importar Múltiplos PDFs
        </h2>
        <p className="text-sm text-slate-500">
          Envie vários PDFs e deixe a IA ajudar no preenchimento automático
        </p>
      </div>

      {!results ? (
        <>
          {/* ZONA DE DROP */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFiles = Array.from(e.dataTransfer.files).filter(
                (f: File) => f.type === 'application/pdf'
              );
              setFiles(droppedFiles as File[]);
            }}
            className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 mb-4 hover:bg-blue-100 transition cursor-pointer"
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="font-bold text-slate-700 mb-1">
              Arraste PDFs aqui
            </p>
            <p className="text-sm text-slate-500">
              ou clique para selecionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Selecionar PDFs
            </button>
          </div>

          {/* LISTA DE ARQUIVOS */}
          {files.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-slate-700 mb-2">
                Arquivos Selecionados ({files.length}):
              </h3>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200"
                  >
                    <span className="text-lg">📄</span>
                    <span className="flex-1 text-sm text-slate-700 font-medium">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() =>
                        setFiles(files.filter((_, i) => i !== idx))
                      }
                      className="text-red-600 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTÃO PROCESSAR */}
          <button
            onClick={handleProcessFiles}
            disabled={files.length === 0 || isProcessing}
            className="w-full h-11 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processando com IA...
              </>
            ) : (
              <>
                <span>🚀</span>
                Processar {files.length} PDF(s) com IA
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {/* RESULTADOS */}
          <div className="mb-6">
            {/* RESUMO */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {results.processedFiles}/{results.totalFiles}
                </div>
                <div className="text-xs text-blue-700 font-bold">
                  Arquivos Processados
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(results.summary.estimatedCompleteness * 100)}%
                </div>
                <div className="text-xs text-green-700 font-bold">
                  Completude Estimada
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {results.extractedDocuments.reduce(
                    (sum, doc) => sum + doc.suggestedFields.length,
                    0
                  )}
                </div>
                <div className="text-xs text-purple-700 font-bold">
                  Sugestões Disponíveis
                </div>
              </div>
            </div>

            {/* AVISO */}
            {results.summary.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <h4 className="font-bold text-yellow-700 mb-2">⚠️ Avisos:</h4>
                <ul className="space-y-1">
                  {results.summary.warnings.map((w, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      • {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* PRÓXIMOS PASSOS */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
              <h4 className="font-bold text-green-700 mb-2">
                ✓ Próximos Passos:
              </h4>
              <ol className="space-y-1 list-decimal list-inside">
                {results.summary.suggestedNextSteps.map((step, idx) => (
                  <li key={idx} className="text-sm text-green-800">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* DOCUMENTOS EXTRAÍDOS */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-700 mb-3">
              📋 Documentos Extraídos:
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {results.extractedDocuments.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    selectedDoc?.filename === doc.filename
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-700 text-sm truncate">
                    {doc.filename}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded mr-2">
                      {doc.type}
                    </span>
                    <span>
                      {Math.round(doc.confidence * 100)}% confiança
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DETALHES DO DOCUMENTO SELECIONADO */}
          {selectedDoc && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-700 mb-3">
                Sugestões para: {selectedDoc.filename}
              </h4>

              {selectedDoc.suggestedFields.length > 0 ? (
                <div className="space-y-2">
                  {selectedDoc.suggestedFields.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded border border-slate-200 hover:border-blue-300 transition"
                    >
                      <div>
                        <div className="font-bold text-slate-700 text-sm">
                          {suggestion.field}
                        </div>
                        <div className="text-sm text-slate-600 font-mono">
                          {suggestion.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Confiança: {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleApplySuggestion(
                            suggestion.field,
                            suggestion.value
                          )
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition whitespace-nowrap ml-2"
                      >
                        ✓ Usar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhuma sugestão disponível para este documento.
                </p>
              )}
            </div>
          )}

          {/* BOTÃO RESET */}
          <div className="mt-6">
            <button
              onClick={() => {
                setResults(null);
                setFiles([]);
                setSelectedDoc(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition"
            >
              ← Voltar e Importar Novos PDFs
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchPDFImporter;
