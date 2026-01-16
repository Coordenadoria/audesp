
import React from 'react';
import { AudespResponse } from '../types';
import { MissingFieldsPanel } from './MissingFieldsPanel';

interface Props {
    result: AudespResponse;
    onClose: () => void;
    formData?: any;
}

export const TransmissionResult: React.FC<Props> = ({ result, onClose, formData }) => {
    
    const isSuccess = result.status === 'Recebido';
    const isWarning = result.status === 'Armazenado';
    const isError = result.status === 'Rejeitado';

    const getTitle = () => {
        if (isSuccess) return 'SUCESSO: DOCUMENTO RECEBIDO';
        if (isWarning) return 'ATENÇÃO: DOCUMENTO ARMAZENADO COM RESSALVAS';
        return 'ERRO: DOCUMENTO REJEITADO';
    };

    const getIcon = () => {
        if (isSuccess) return '✅';
        if (isWarning) return '⚠️';
        return '⛔';
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
                {/* Header with Close Button */}
                <div className={`p-6 border-b-4 ${isSuccess ? 'border-green-500 bg-green-100' : isWarning ? 'border-yellow-500 bg-yellow-100' : 'border-red-500 bg-red-100'} flex items-start justify-between`}>
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{getIcon()}</span>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{getTitle()}</h2>
                            <p className="text-sm font-bold text-slate-600 opacity-80">{result.tipoDocumento}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                        title="Fechar (Esc)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
                    
                    {/* Protocol Card */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protocolo Audesp</label>
                            <div className="text-2xl font-mono font-bold text-slate-800 select-all">{result.protocolo}</div>
                        </div>
                        <div className="text-right">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data/Hora</label>
                            <div className="text-sm font-bold text-slate-600">{result.dataHora}</div>
                        </div>
                    </div>

                {/* Errors / Messages */}
                {result.erros && result.erros.length > 0 && (
                    <div>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-100 p-2 border-b border-slate-200">
                                <h4 className="text-xs font-bold text-slate-600 uppercase">Detalhamento da Análise</h4>
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2">Código</th>
                                        <th className="p-2">Campo</th>
                                        <th className="p-2">Mensagem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.erros.map((erro, idx) => (
                                        <tr key={idx} className={erro.classificacao === 'Impedittivo' ? 'bg-red-50/50' : ''}>
                                            <td className="p-2 font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${erro.classificacao === 'Impedittivo' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {erro.classificacao}
                                                </span>
                                            </td>
                                            <td className="p-2 font-mono text-slate-500">{erro.codigoErro}</td>
                                            <td className="p-2 font-mono text-slate-600">{erro.campo}</td>
                                            <td className="p-2 text-slate-800">{erro.mensagem}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Se houver dados do formulário, mostrar o painel de campos faltando */}
                        {formData && isError && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-bold text-blue-900 mb-3">📋 Campos Faltando para Transmissão</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  Complete os campos listados abaixo conforme especificado no Manual v1.9:
                                </p>
                                <MissingFieldsPanel data={formData} />
                            </div>
                        )}
                    </div>
                )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded shadow transition-colors flex items-center gap-2"
                        title="Fechar resultado (Esc)"
                    >
                        <span>✕</span> Fechar
                    </button>
                    {isSuccess && (
                        <button 
                            onClick={() => window.print()} 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-colors flex items-center gap-2"
                        >
                            <span>🖨️</span> Imprimir Recibo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
