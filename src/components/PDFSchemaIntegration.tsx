import React, { useState } from 'react';
import { FileUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import SchemaMappingService from '../services/schemaMappingService';
import { advancedOCRService } from '../services/advancedOCRService';

interface PDFSchemaIntegrationProps {
  onDataExtracted: (data: any) => void;
  onError: (error: string) => void;
}

export const PDFSchemaIntegration: React.FC<PDFSchemaIntegrationProps> = ({ onDataExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      // Extrair dados do PDF usando OCR
      const ocrResult = await advancedOCRService.extractFromPDF(file);

      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Falha ao extrair dados do PDF');
      }

      setExtractedData(ocrResult.data);

      // Mapear dados para o schema
      const mappedResult = SchemaMappingService.mapPDFDataToSchema(ocrResult.data, {});

      setMappingResult(mappedResult);

      if (mappedResult.success) {
        onDataExtracted(mappedResult.data);
      } else {
        onError(`Campos obrigatórios faltando: ${mappedResult.missingFields.join(', ')}`);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      onError(errorMsg);
      setMappingResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Carregar Prestação de Contas via PDF</h2>

        {/* Upload Area */}
        <div className="mb-8">
          <label className="flex items-center justify-center w-full p-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition">
            <div className="text-center">
              <FileUp className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-slate-900">Clique para carregar PDF</p>
              <p className="text-sm text-slate-600">ou arraste o arquivo aqui</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              <div>
                <p className="font-semibold text-slate-900">Processando PDF...</p>
                <p className="text-sm text-slate-600">Extraindo dados e mapeando para o schema...</p>
              </div>
            </div>
          </div>
        )}

        {/* File Info */}
        {fileName && !isProcessing && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Arquivo:</span> {fileName}
            </p>
          </div>
        )}

        {/* Mapping Results */}
        {mappingResult && !isProcessing && (
          <div className="space-y-6">
            {/* Status */}
            <div
              className={`rounded-lg p-6 ${
                mappingResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {mappingResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {mappingResult.success ? 'Mapeamento Completo' : 'Mapeamento Parcial'}
                  </h3>
                  {!mappingResult.success && mappingResult.missingFields.length > 0 && (
                    <div className="text-sm text-slate-700">
                      <p className="mb-2">Campos obrigatórios faltando:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {mappingResult.missingFields.map((field: string) => (
                          <li key={field} className="text-yellow-700">
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {mappingResult.warnings && mappingResult.warnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-900 mb-2">Avisos:</p>
                <ul className="space-y-1">
                  {mappingResult.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="text-sm text-orange-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Preview */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Dados Extraídos</h3>
              <div className="bg-white rounded border border-slate-200 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(mappingResult.data, null, 2).substring(0, 2000)}...
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Schema Mapping Info */}
        <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">O que é Mapeado do PDF:</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>Descritor:</strong> Tipo de documento, município, entidade, ano e mês
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>Relação de Empregados:</strong> CPF, datas, CBO, salários e períodos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>Relação de Bens:</strong> Móveis e imóveis adquiridos, cedidos e baixados
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>Documentos Fiscais:</strong> Números, credores, valores e categorias
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>Pagamentos:</strong> Datas, valores, meios e dados bancários
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <span>
                <strong>E mais:</strong> Receitas, disponibilidades, empenhos, repasses, etc.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFSchemaIntegration;
