import React, { useState, useRef } from 'react';
import { Upload, Loader } from 'lucide-react';

interface ExtractedDocument {
  type: 'nota_fiscal' | 'contrato' | 'comprovante';
  numero: string;
  data?: string;
  valor?: number;
  cpf_cnpj?: string;
  confidence: number;
  text: string;
}

const PDFOCRExtractor: React.FC<{ onExtract: (docs: ExtractedDocument[]) => void }> = ({ onExtract }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(50);

    try {
      // Simulated document extraction
      const mockDoc: ExtractedDocument = {
        type: 'nota_fiscal',
        numero: `NF-${Math.random().toString(36).substring(7)}`,
        data: new Date().toISOString().split('T')[0],
        valor: Math.random() * 10000,
        cpf_cnpj: '00000000000000',
        confidence: 0.85,
        text: 'Documento extraído simulado'
      };

      setProgress(100);
      onExtract([mockDoc]);
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 1000);
    } catch (err) {
      alert('Erro ao processar PDF: ' + (err as Error).message);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-blue-300">
      <div className="flex items-center justify-center mb-4">
        <Upload size={32} className="text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-center mb-2">Importador de PDFs</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Carregue PDFs de documentos fiscais, contratos ou comprovantes
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="application/pdf"
        className="hidden"
        disabled={loading}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Processando...' : 'Selecionar PDF'}
      </button>

      {loading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader size={16} className="animate-spin" />
            <span className="text-sm">Processando documento...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFOCRExtractor;
