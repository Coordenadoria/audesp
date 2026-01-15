
import React from 'react';
import { Field, CLS, SectionHeader, ArrayBlock } from '../ui/BlockBase';
import { PrestacaoContas, RelatorioGov, PrestacaoContasBenef } from '../../schemas/type-definitions';

// --- 22. Relatório Governamental ---
export const RelatorioGovBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const gov = data.relatorio_governamental_analise_execucao || {} as RelatorioGov;

    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="22. Relatório Governamental (Análise Execução)" />
            
            <div className="mb-6 bg-yellow-50 p-4 rounded border border-yellow-100">
                <div className="flex items-center gap-3 mb-4">
                    <input 
                        type="checkbox" 
                        className={CLS.CHECKBOX}
                        checked={gov.houve_emissao_relatorio_final} 
                        onChange={e => updateField('relatorio_governamental_analise_execucao.houve_emissao_relatorio_final', e.target.checked)} 
                    />
                    <label className="font-bold text-slate-800 text-sm">
                        Houve emissão de Relatório Final pelo Órgão Público?
                    </label>
                </div>

                {gov.houve_emissao_relatorio_final && (
                    <div className="animate-in fade-in space-y-4">
                        <Field 
                            label="Conclusão do Relatório" 
                            value={gov.conclusao_relatorio} 
                            onChange={(v:any) => updateField('relatorio_governamental_analise_execucao.conclusao_relatorio', Number(v))}
                            options={[
                                {value: 1, label: "Favorável"},
                                {value: 2, label: "Favorável com Ressalvas"},
                                {value: 3, label: "Desfavorável"}
                            ]}
                        />
                        <div>
                            <label className={CLS.LABEL}>Justificativa / Considerações</label>
                            <textarea 
                                className={CLS.INPUT + " h-24 py-2"}
                                value={gov.justificativa} 
                                onChange={e => updateField('relatorio_governamental_analise_execucao.justificativa', e.target.value)} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 24. Publicações Parecer/Ata ---
export const PublicacoesAtaBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const items = data.publicacoes_parecer_ata || [];

    const updateItem = (idx: number, field: string, value: any) => {
        const copy = [...items];
        // Handle nested or root property
        if(field === 'root') copy[idx] = { ...copy[idx], ...value };
        else (copy[idx] as any)[field] = value;
        updateField('publicacoes_parecer_ata', copy);
    };

    const addItem = () => {
        updateField('publicacoes_parecer_ata', [...items, { 
            tipo_parecer_ata: 1, 
            houve_publicacao: false, 
            conclusao_parecer: 1, 
            publicacoes: [] 
        }]);
    };

    const removeItem = (idx: number) => {
        const copy = [...items];
        copy.splice(idx, 1);
        updateField('publicacoes_parecer_ata', copy);
    };

    return (
        <div className="space-y-6">
            <div className={CLS.SECTION}>
                <SectionHeader title="24. Publicações de Pareceres e Atas">
                    <button onClick={addItem} className={CLS.BTN_ADD}>+ Adicionar Registro</button>
                </SectionHeader>
            </div>

            {items.map((item, idx) => (
                <div key={idx} className={CLS.SECTION + " border-l-4 border-purple-400"}>
                     <div className="flex justify-between items-center mb-4">
                        <Field 
                            label="Tipo de Documento" 
                            value={item.tipo_parecer_ata} 
                            onChange={(v:any) => updateItem(idx, 'tipo_parecer_ata', Number(v))}
                            options={[
                                {value: 1, label: "Parecer do Conselho Fiscal"},
                                {value: 2, label: "Ata da Assembleia Geral"},
                                {value: 3, label: "Ata do Conselho de Administração"}
                            ]}
                        />
                        <button onClick={() => removeItem(idx)} className={CLS.BTN_REMOVE + " mt-4"}>Remover</button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div className="flex items-center gap-3 h-10 mt-5 bg-slate-50 px-3 rounded border">
                            <input 
                                type="checkbox" 
                                className={CLS.CHECKBOX}
                                checked={item.houve_publicacao} 
                                onChange={e => updateItem(idx, 'houve_publicacao', e.target.checked)} 
                            />
                            <label className="text-xs font-bold uppercase text-slate-500">Houve Publicação?</label>
                         </div>
                         <Field 
                            label="Conclusão" 
                            value={item.conclusao_parecer} 
                            onChange={(v:any) => updateItem(idx, 'conclusao_parecer', Number(v))}
                            options={[
                                {value: 1, label: "Aprovação"},
                                {value: 2, label: "Aprovação com Ressalvas"},
                                {value: 3, label: "Rejeição"}
                            ]}
                        />
                     </div>

                     {item.houve_publicacao && (
                         <div className="pl-4 border-l-2 border-purple-100 mt-4">
                             <label className={CLS.LABEL + " text-purple-700"}>Veículos de Publicação</label>
                             {(item.publicacoes || []).map((pub, pIdx) => (
                                 <div key={pIdx} className="flex gap-2 mb-2 items-center">
                                     <input className={CLS.INPUT} placeholder="Nome Veículo" value={pub.nome_veiculo} onChange={e => {
                                         const pubs = [...(item.publicacoes || [])];
                                         pubs[pIdx] = { ...pubs[pIdx], nome_veiculo: e.target.value };
                                         updateItem(idx, 'publicacoes', pubs);
                                     }} />
                                     <input type="date" className={CLS.INPUT} value={pub.data_publicacao} onChange={e => {
                                         const pubs = [...(item.publicacoes || [])];
                                         pubs[pIdx] = { ...pubs[pIdx], data_publicacao: e.target.value };
                                         updateItem(idx, 'publicacoes', pubs);
                                     }} />
                                     <button onClick={() => {
                                         const pubs = [...(item.publicacoes || [])];
                                         pubs.splice(pIdx, 1);
                                         updateItem(idx, 'publicacoes', pubs);
                                     }} className="text-red-500 font-bold px-2">X</button>
                                 </div>
                             ))}
                             <button onClick={() => {
                                 const pubs = [...(item.publicacoes || [])];
                                 pubs.push({ tipo_veiculo_publicacao: 1, nome_veiculo: '', data_publicacao: '' });
                                 updateItem(idx, 'publicacoes', pubs);
                             }} className="text-xs font-bold text-blue-600 hover:underline">+ Adicionar Publicação</button>
                         </div>
                     )}
                </div>
            ))}
        </div>
    );
};

// --- 25. Prestação de Contas Entidade Beneficiária ---
export const PrestacaoBeneficiariaBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const benef = data.prestacao_contas_entidade_beneficiaria || {} as PrestacaoContasBenef;

    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="25. Dados da Prestação (Entidade)" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field 
                    label="Data da Prestação" 
                    type="date" 
                    value={benef.data_prestacao} 
                    onChange={(v:any) => updateField('prestacao_contas_entidade_beneficiaria.data_prestacao', v)} 
                />
                <Field 
                    label="Período Ref. Início" 
                    type="date" 
                    value={benef.periodo_referencia_data_inicial} 
                    onChange={(v:any) => updateField('prestacao_contas_entidade_beneficiaria.periodo_referencia_data_inicial', v)} 
                />
                <Field 
                    label="Período Ref. Final" 
                    type="date" 
                    value={benef.periodo_referencia_data_final} 
                    onChange={(v:any) => updateField('prestacao_contas_entidade_beneficiaria.periodo_referencia_data_final', v)} 
                />
            </div>
            <p className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                Estes dados referem-se ao período de execução e à data em que a entidade finalizou internamente a prestação de contas.
            </p>
        </div>
    );
};
