import React, { useState, useCallback, useRef } from 'react';
import { Upload, Loader, CheckCircle, AlertCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { OCRService, OCRResult } from '../services/OCRService';
import { DocumentClassifier } from '../services/DocumentClassifier';
import { FieldExtractor, FieldExtractionResult } from '../services/FieldExtractor';
import { DocumentLinker, DocumentLink } from '../services/DocumentLinker';
import PDFReviewPanel from './PDFReviewPanel';

interface ProcessedDocument {
  id: string;
  file: File;
  status: 'uploading' | 'ocr' | 'extracting' | 'classifying' | 'linking' | 'complete' | 'error';
  ocrResult?: OCRResult;
  classificationResult?: any;
  extractionResult?: FieldExtractionResult;
  link?: DocumentLink;
  error?: string;
  progress: number;
}

interface DocumentUploadManagerProps {
  formRecordId: string;
  onDocumentsProcessed?: (documents: ProcessedDocument[]) => void;
}

export const DocumentUploadManager: React.FC<DocumentUploadManagerProps> = ({
  formRecordId,
  onDocumentsProcessed,
}) => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ocrService = OCRService;
  const documentClassifier = DocumentClassifier;
  const fieldExtractor = FieldExtractor;
  const documentLinker = DocumentLinker;

  const processDocument = useCallback(async (file: File) => {
    const documentId = `doc-${Date.now()}-${Math.random()}`;

    const processedDoc: ProcessedDocument = {
      id: documentId,
      file,
      status: 'uploading',
      progress: 0,
    };

    setDocuments((prev) => [...prev, processedDoc]);

    try {
      // Etapa 1: OCR
      processedDoc.status = 'ocr';
      processedDoc.progress = 25;
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );

      const ocrResult = await ocrService.extractTextFromPDF(file);
      processedDoc.ocrResult = ocrResult;
      processedDoc.progress = 40;

      // Etapa 2: Extração de Campos
      processedDoc.status = 'extracting';
      processedDoc.progress = 55;
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );

      const extractedFields = ocrService.extractFields(ocrResult.text);
      const extractionResult = fieldExtractor.extractAndMap(ocrResult.text, extractedFields);
      processedDoc.extractionResult = extractionResult;
      processedDoc.progress = 70;

      // Etapa 3: Classificação
      processedDoc.status = 'classifying';
      processedDoc.progress = 80;
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );

      const classificationResult = documentClassifier.classify(
        file.name,
        ocrResult.text,
        extractedFields
      );
      processedDoc.classificationResult = classificationResult;
      processedDoc.progress = 90;

      // Etapa 4: Linking
      processedDoc.status = 'linking';
      processedDoc.progress = 95;
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );

      // Criar registro de formulário se não existir
      if (!documentLinker.getLinkedDocuments(formRecordId)) {
        documentLinker.createFormRecord(formRecordId, 'Prestação de Contas');
      }

      const link = documentLinker.linkDocumentToForm(
        documentId,
        {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
          documentType: classificationResult.type,
          classificationType: classificationResult.category,
          extractedFields,
          ocrConfidence: ocrResult.confidence,
        },
        extractionResult.mappings,
        formRecordId
      );

      processedDoc.link = link;
      processedDoc.status = 'complete';
      processedDoc.progress = 100;

      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );

      // Notificar sobre processamento completo
      onDocumentsProcessed?.([processedDoc]);
    } catch (error) {
      processedDoc.status = 'error';
      processedDoc.error = error instanceof Error ? error.message : 'Erro desconhecido';
      processedDoc.progress = 0;

      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...processedDoc } : d))
      );
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.includes('pdf') || file.type.includes('image')) {
        processDocument(file);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      processDocument(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'uploading':
      case 'ocr':
      case 'extracting':
      case 'classifying':
      case 'linking':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      uploading: 'Enviando...',
      ocr: 'Extraindo texto com OCR...',
      extracting: 'Extraindo campos...',
      classifying: 'Classificando documento...',
      linking: 'Vinculando ao formulário...',
      complete: 'Pronto para revisão',
      error: 'Erro no processamento',
    };
    return labels[status] || 'Desconhecido';
  };

  const completedDocuments = documents.filter((d) => d.status === 'complete');
  const errorDocuments = documents.filter((d) => d.status === 'error');
  const processingDocuments = documents.filter(
    (d) => d.status !== 'complete' && d.status !== 'error'
  );

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 mb-2">Enviar Documentos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Arraste arquivos PDF ou imagens aqui, ou clique para selecionar
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Selecionar Arquivos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Summary */}
      {documents.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">Em Processamento</p>
            <p className="text-2xl font-bold text-blue-900">{processingDocuments.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">Concluído</p>
            <p className="text-2xl font-bold text-green-900">{completedDocuments.length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">Erros</p>
            <p className="text-2xl font-bold text-red-900">{errorDocuments.length}</p>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Documentos Enviados</h3>

          {/* Processing Documents */}
          {processingDocuments.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium text-gray-900">{doc.file.name}</p>
                    <p className="text-sm text-gray-500">{getStatusLabel(doc.status)}</p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{doc.progress}%</p>
            </div>
          ))}

          {/* Completed Documents */}
          {completedDocuments.map((doc) => (
            <div key={doc.id}>
              <div
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedId(expandedId === doc.id ? null : doc.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium text-gray-900">{doc.file.name}</p>
                      {doc.classificationResult && (
                        <p className="text-sm text-gray-500">
                          {doc.classificationResult.category} •{' '}
                          {(doc.ocrResult?.confidence! * 100).toFixed(0)}% confiança
                        </p>
                      )}
                    </div>
                  </div>
                  {expandedId === doc.id ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Review */}
              {expandedId === doc.id && doc.extractionResult && doc.link && (
                <div className="mt-2">
                  <PDFReviewPanel
                    documentId={doc.id}
                    fileName={doc.file.name}
                    ocrConfidence={doc.ocrResult?.confidence || 0}
                    extractedFields={doc.extractionResult.mappings}
                    link={doc.link}
                    onApprove={(updatedFields) => {
                      console.log('Documento aprovado:', updatedFields);
                    }}
                    onReject={() => {
                      setDocuments((prev) =>
                        prev.filter((d) => d.id !== doc.id)
                      );
                    }}
                    onEdit={(fieldName, newValue) => {
                      console.log(`Campo ${fieldName} editado para: ${newValue}`);
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Error Documents */}
          {errorDocuments.map((doc) => (
            <div key={doc.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium text-gray-900">{doc.file.name}</p>
                    <p className="text-sm text-red-600">{doc.error}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setDocuments((prev) =>
                      prev.filter((d) => d.id !== doc.id)
                    )
                  }
                  className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-100 transition text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadManager;
