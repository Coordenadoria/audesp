import React, { useState, useRef } from 'react';
import { processPDFFile, ExtractedData, mapExtractedDataToForm } from '../services/ocrService';

interface PDFUploaderProps {
  onDataExtracted: (data: ExtractedData, mappedData: Partial<any>) => void;
  onError: (error: string) => void;
  sectionType: string; // 'descritor', 'receitas', 'documentos_fiscais', etc
  label?: string;
}

/**
 * Componente para upload de PDF com OCR automático
 * Extrai dados do PDF e preenche o formulário automaticamente
 */
export const PDFUploader: React.FC<PDFUploaderProps> = ({
  onDataExtracted,
  onError,
  sectionType,
  label = 'Carregar PDF'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.includes('pdf')) {
      onError('Por favor, selecione um arquivo PDF válido');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log(`[PDFUploader] Iniciando processamento: ${file.name}`);
      
      // Simular progresso durante OCR
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 500);

      // Processar PDF
      const data = await processPDFFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      // Mapear para formato do formulário
      const mappedData = mapExtractedDataToForm(data);

      setExtractedData(data);
      
      // Callback com dados
      onDataExtracted(data, mappedData);

      console.log(`[PDFUploader] Processamento concluído:`, data);
      console.log(`[PDFUploader] Confiança: ${Math.round(data.confidence * 100)}%`);

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reset após 3 segundos
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 3000);
    } catch (error) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF';
      onError(message);
      console.error('[PDFUploader] Erro:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Input */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="sr-only"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors ${
            isProcessing
              ? 'border-blue-300 bg-blue-50 text-blue-600'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin">⏳</div>
              <span>Processando PDF... {Math.round(progress)}%</span>
            </div>
          ) : extractedData ? (
            <div className="flex items-center justify-center gap-2">
              <span>✓</span>
              <span>PDF Carregado com Sucesso!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>📄</span>
              <span>{label}</span>
            </div>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Extracted Data Info */}
      {extractedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-900 mb-2">
            ✓ Dados Extraídos ({Math.round(extractedData.confidence * 100)}% confiança)
          </p>
          
          <div className="space-y-1 text-green-800 text-xs">
            {extractedData.cnpj && <p>• CNPJ: {extractedData.cnpj}</p>}
            {extractedData.municipio && <p>• Município: {extractedData.municipio}</p>}
            {extractedData.ano && <p>• Ano: {extractedData.ano}</p>}
            {extractedData.mes && <p>• Mês: {extractedData.mes}</p>}
            {extractedData.cpfs && extractedData.cpfs.length > 0 && (
              <p>• CPFs encontrados: {extractedData.cpfs.length}</p>
            )}
            {extractedData.datas && extractedData.datas.length > 0 && (
              <p>• Datas encontradas: {extractedData.datas.length}</p>
            )}
            {extractedData.valores?.despesas && (
              <p>• Valor médio: R$ {extractedData.valores.despesas.toFixed(2)}</p>
            )}
          </div>

          {extractedData.confidence < 0.6 && (
            <p className="mt-2 text-yellow-700 text-xs bg-yellow-100 p-2 rounded">
              ⚠️ Baixa confiança na extração. Revise os dados preenchidos.
            </p>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
        <p className="font-semibold mb-1">💡 Dica:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>PDF deve estar legível e em português</li>
          <li>Documentos escaneados funcionam melhor</li>
          <li>Até 10 páginas serão analisadas</li>
          <li>Os dados extraídos preencherão automaticamente o formulário</li>
        </ul>
      </div>
    </div>
  );
};
