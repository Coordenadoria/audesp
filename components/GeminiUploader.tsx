
import React, { useState } from 'react';
import { extractDataFromImage } from '../services/geminiService';

interface GeminiUploaderProps {
  section: 
    | 'documentos_fiscais' 
    | 'relacao_empregados' 
    | 'contratos'
    | 'relacao_bens'
    | 'pagamentos'
    | 'disponibilidades'
    | 'receitas'
    | 'ajustes_saldo'
    | 'servidores_cedidos'
    | 'descontos'
    | 'devolucoes'
    | 'glosas'
    | 'empenhos'
    | 'repasses'
    | 'relatorio_atividades'
    | 'dados_gerais_entidade_beneficiaria'
    | 'responsaveis_membros_orgao_concessor'
    | 'declaracoes'
    | 'relatorio_governamental_analise_execucao'
    | 'demonstracoes_contabeis'
    | 'publicacoes_parecer_ata'
    | 'prestacao_contas_entidade_beneficiaria'
    | 'parecer_conclusivo'
    | 'transparencia';
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
          // Removes the Data URL prefix (e.g. "data:application/pdf;base64,")
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;
          
          const extractedData = await extractDataFromImage(base64String, mimeType, section);
          
          if (extractedData) {
             onDataExtracted(extractedData);
          } else {
             setError("Não foi possível extrair dados legíveis deste documento.");
          }
        } catch (err) {
          setError("Erro ao processar o documento com IA. Verifique sua chave de API ou tente outro arquivo.");
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
                Preenchimento Inteligente (OCR/AI)
            </h3>
            <p className="text-xs text-indigo-600 mt-1">
                Carregue PDF ou Imagem para preencher este formulário automaticamente.
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
                {loading ? 'Processando...' : 'Selecionar Arquivo'}
            </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
};
