
import React from 'react';
import { Field, CLS, SectionHeader } from '../ui/BlockBase';
import { PrestacaoContas, RelatorioAtividades, Programa, Meta, Periodicidade } from '../../types';
import { GeminiUploader } from '../GeminiUploader';

export const RelatorioAtividadesBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const relatorio = data.relatorio_atividades || { programas: [] };

    // Helper para atualizar o array raiz de programas
    const updateProgramas = (newProgramas: Programa[]) => {
        updateField('relatorio_atividades.programas', newProgramas);
    };

    const handleOcrData = (extracted: any) => {
        // Lógica inteligente de merge para OCR de relatório
        if (extracted && Array.isArray(extracted.programas)) {
            const current = [...(relatorio.programas || [])];
            updateProgramas([...current, ...extracted.programas]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className={CLS.SECTION}>
                <SectionHeader title="18. Relatório de Atividades">
                    <button 
                        onClick={() => updateProgramas([...(relatorio.programas || []), { nome_programa: '', metas: [] }])} 
                        className={CLS.BTN_ADD}
                    >
                        + Novo Programa
                    </button>
                </SectionHeader>

                <GeminiUploader section="relatorio_atividades" onDataExtracted={handleOcrData} />

                {(!relatorio.programas || relatorio.programas.length === 0) && (
                    <p className="text-slate-400 text-sm text-center py-8 border-2 border-dashed border-slate-200 rounded">
                        Nenhum programa cadastrado. Adicione manualmente ou use o OCR.
                    </p>
                )}
            </div>

            {relatorio.programas?.map((prog, pIdx) => (
                <div key={pIdx} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-indigo-500 border-y border-r border-slate-200 relative">
                    {/* Header do Programa */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-full mr-4">
                            <h3 className="text-sm font-bold uppercase text-indigo-600 mb-2">Programa #{pIdx + 1}</h3>
                            <Field 
                                label="Nome do Programa" 
                                value={prog.nome_programa} 
                                onChange={(v:any) => {
                                    const copy = [...relatorio.programas];
                                    copy[pIdx].nome_programa = v;
                                    updateProgramas(copy);
                                }} 
                            />
                        </div>
                        <button 
                            onClick={() => {
                                const copy = [...relatorio.programas];
                                copy.splice(pIdx, 1);
                                updateProgramas(copy);
                            }} 
                            className={CLS.BTN_REMOVE + " mt-6"}
                        >
                            Remover Programa
                        </button>
                    </div>

                    {/* Metas do Programa */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Metas do Programa</h4>
                            <button 
                                onClick={() => {
                                    const copy = [...relatorio.programas];
                                    copy[pIdx].metas.push({ codigo_meta: '', periodicidades: [], meta_atendida: false, justificativa: '' });
                                    updateProgramas(copy);
                                }} 
                                className={CLS.BTN_SUB}
                            >
                                + Adicionar Meta
                            </button>
                        </div>

                        {prog.metas.map((meta, mIdx) => (
                            <div key={mIdx} className="bg-white p-4 rounded border border-slate-200 mb-4 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                    <div className="md:col-span-3">
                                        <Field 
                                            label="Código Meta" 
                                            value={meta.codigo_meta} 
                                            onChange={(v:any) => {
                                                const copy = [...relatorio.programas];
                                                copy[pIdx].metas[mIdx].codigo_meta = v;
                                                updateProgramas(copy);
                                            }} 
                                        />
                                    </div>
                                    <div className="md:col-span-7">
                                        <Field 
                                            label="Descrição (Opcional)" 
                                            value={meta.descricao || ''} 
                                            onChange={(v:any) => {
                                                const copy = [...relatorio.programas];
                                                copy[pIdx].metas[mIdx].descricao = v;
                                                updateProgramas(copy);
                                            }} 
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-end">
                                        <button 
                                            onClick={() => {
                                                const copy = [...relatorio.programas];
                                                copy[pIdx].metas.splice(mIdx, 1);
                                                updateProgramas(copy);
                                            }} 
                                            className="text-red-500 hover:bg-red-50 p-2 rounded"
                                            title="Remover Meta"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4 bg-indigo-50 p-2 rounded w-fit">
                                    <input 
                                        type="checkbox" 
                                        className={CLS.CHECKBOX}
                                        checked={meta.meta_atendida} 
                                        onChange={e => {
                                            const copy = [...relatorio.programas];
                                            copy[pIdx].metas[mIdx].meta_atendida = e.target.checked;
                                            updateProgramas(copy);
                                        }} 
                                    />
                                    <label className="text-xs font-bold text-indigo-900 cursor-pointer">A Meta foi plenamente atendida?</label>
                                </div>

                                {!meta.meta_atendida && (
                                    <div className="mb-4 animate-in fade-in">
                                        <Field 
                                            label="Justificativa do Não Atendimento" 
                                            value={meta.justificativa || ''} 
                                            onChange={(v:any) => {
                                                const copy = [...relatorio.programas];
                                                copy[pIdx].metas[mIdx].justificativa = v;
                                                updateProgramas(copy);
                                            }} 
                                        />
                                    </div>
                                )}

                                {/* Periodicidades da Meta */}
                                <div className="pl-4 border-l-2 border-indigo-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase">Execução Física (Periodicidade)</h5>
                                        <button 
                                            onClick={() => {
                                                const copy = [...relatorio.programas];
                                                copy[pIdx].metas[mIdx].periodicidades.push({ periodo: 1, quantidade_realizada: 0 });
                                                updateProgramas(copy);
                                            }}
                                            className="text-[10px] text-blue-600 font-bold hover:underline"
                                        >
                                            + Adicionar Período
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {meta.periodicidades.map((per, perIdx) => (
                                            <div key={perIdx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                                                <div className="w-24">
                                                    <select 
                                                        className={CLS.INPUT + " h-8 py-0 text-xs"}
                                                        value={per.periodo}
                                                        onChange={e => {
                                                            const copy = [...relatorio.programas];
                                                            copy[pIdx].metas[mIdx].periodicidades[perIdx].periodo = Number(e.target.value);
                                                            updateProgramas(copy);
                                                        }}
                                                    >
                                                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Qtd."
                                                        className={CLS.INPUT + " h-8 py-0 text-xs"}
                                                        value={per.quantidade_realizada}
                                                        onChange={e => {
                                                            const copy = [...relatorio.programas];
                                                            copy[pIdx].metas[mIdx].periodicidades[perIdx].quantidade_realizada = Number(e.target.value);
                                                            updateProgramas(copy);
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const copy = [...relatorio.programas];
                                                        copy[pIdx].metas[mIdx].periodicidades.splice(perIdx, 1);
                                                        updateProgramas(copy);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
