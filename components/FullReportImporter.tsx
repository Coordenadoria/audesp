
import React, { useState } from 'react';
import { extractFullReport } from '../services/geminiService';
import { PrestacaoContas } from '../types';
import { CLS } from './ui/BlockBase';

interface FullReportImporterProps {
    onDataMerge: (data: Partial<PrestacaoContas>) => void;
    onCancel: () => void;
}

export const FullReportImporter: React.FC<FullReportImporterProps> = ({ onDataMerge, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [extractedData, setExtractedData] = useState<any>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLoading(true);
            setStatus('Lendo arquivo (Isso pode levar alguns segundos)...');

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64String = (reader.result as string).split(',')[1];
                    
                    setStatus('Enviando para IA (Gemini 2.0)...');
                    const data = await extractFullReport(base64String, file.type);
                    
                    if (data) {
                        setExtractedData(data);
                        setStatus('Análise concluída. Revise os dados abaixo.');
                    } else {
                        setStatus('Falha: Nenhum dado estruturado encontrado.');
                    }
                } catch (err: any) {
                    setStatus(`Erro: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAccept = () => {
        if (extractedData) {
            onDataMerge(extractedData);
        }
    };

    if (extractedData) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Revisão da Importação Inteligente</h2>
                            <p className="text-sm text-slate-500">O OCR identificou os seguintes registros no seu documento.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 font-bold text-sm px-4">
                                Cancelar
                            </button>
                            <button onClick={handleAccept} className={CLS.BTN_ADD}>
                                Confirmar e Importar Tudo
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Empregados" count={extractedData.relacao_empregados?.length || 0} />
                            <StatCard label="Contratos" count={extractedData.contratos?.length || 0} />
                            <StatCard label="Notas Fiscais" count={extractedData.documentos_fiscais?.length || 0} />
                            <StatCard label="Pagamentos" count={extractedData.pagamentos?.length || 0} />
                        </div>

                        {/* Raw JSON Preview (for now, better than nothing) */}
                        <div className="bg-white p-4 rounded border border-slate-200">
                             <h3 className="font-bold text-sm mb-2 text-slate-700">Pré-visualização dos Dados Estruturados</h3>
                             <pre className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(extractedData, null, 2)}
                             </pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4.414 4.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Importar Prestação Completa</h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        Faça upload de um PDF contendo múltiplos documentos (Notas, Extratos, Folha). 
                        A IA irá separar e classificar tudo automaticamente.
                    </p>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:bg-slate-50 transition-colors relative cursor-pointer">
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={loading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {loading ? (
                        <div className="space-y-3">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-bold text-blue-600">{status}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-slate-700">Clique ou arraste o PDF aqui</p>
                            <p className="text-xs text-slate-400 mt-1">Suporta arquivos PDF digitalizados (OCR via Gemini)</p>
                        </div>
                    )}
                </div>

                <button onClick={onCancel} className="mt-6 text-slate-400 hover:text-slate-600 text-sm font-medium">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

const StatCard = ({ label, count }: { label: string, count: number }) => (
    <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-center">
        <div className="text-2xl font-bold text-blue-600">{count}</div>
        <div className="text-xs text-slate-500 uppercase font-bold">{label}</div>
    </div>
);
