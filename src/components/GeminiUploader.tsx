
import React, { useState } from 'react';
import { extractBlockData } from '../services/ocrService';

interface GeminiUploaderProps {
  section: string; // Chave semântica (ex: 'contratos', 'empenhos')
  onDataExtracted: (data: any) => void;
}

export const GeminiUploader: React.FC<GeminiUploaderProps> = ({ section, onDataExtracted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;
          
          // Using the new OCR Service
          const extractedData = await extractBlockData(base64String, mimeType, section);
          
          if (extractedData) {
             onDataExtracted(extractedData);
          } else {
             setError("OCR: Não foi possível identificar dados estruturados neste documento.");
          }
        } catch (err) {
          setError("Erro no processamento IA. Verifique conexão ou tente outro arquivo.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                OCR Inteligente (Gemini 2.0)
            </h3>
            <p className="text-xs text-indigo-600 mt-1">
                Extração automática para seção: <strong>{section}</strong>
            </p>
        </div>
        <div className="relative">
             <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button disabled={loading} className={`px-4 py-2 rounded text-sm font-medium shadow transition-colors ${loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                {loading ? 'Lendo Documento...' : 'Upload PDF/Imagem'}
            </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
};
