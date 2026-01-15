
import React from 'react';
import { Field, CLS, SectionHeader, ArrayBlock } from '../ui/BlockBase';
import { PrestacaoContas, ParecerConclusivo, DemonstracoesContabeis } from '../../schemas/type-definitions';

// --- 26. Parecer Conclusivo ---
export const ParecerConclusivoBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const parecer = data.parecer_conclusivo || {} as ParecerConclusivo;

    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="26. Parecer Conclusivo" />
            
            <div className="grid grid-cols-1 gap-4 mb-6">
                <Field 
                    label="Identificação do Parecer (ID/Número)" 
                    value={parecer.identificacao_parecer} 
                    onChange={(v:any) => updateField('parecer_conclusivo.identificacao_parecer', v)} 
                />
                <Field 
                    label="Conclusão" 
                    value={parecer.conclusao_parecer} 
                    onChange={(v:any) => updateField('parecer_conclusivo.conclusao_parecer', Number(v))}
                    options={[
                        {value: 1, label: "Aprovado"},
                        {value: 2, label: "Aprovado com Ressalvas"},
                        {value: 3, label: "Rejeitado"}
                    ]}
                />
                <div className="col-span-1">
                     <label className={CLS.LABEL}>Considerações do Conselho Fiscal</label>
                     <textarea 
                        className={CLS.INPUT + " h-24 py-2"} 
                        value={parecer.consideracoes_parecer} 
                        onChange={e => updateField('parecer_conclusivo.consideracoes_parecer', e.target.value)} 
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4">Declarações do Parecer</h4>
                <div className="space-y-4">
                    {/* Exemplo de declaração fixa - na prática seriam várias baseadas no manual */}
                    {[1, 2, 3].map(tipo => (
                        <div key={tipo} className="flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-slate-100 pb-2">
                             <div className="flex-1 text-sm font-medium text-slate-600">
                                {tipo === 1 && "A entidade aplicou os recursos conforme o plano de trabalho?"}
                                {tipo === 2 && "As despesas estão comprovadas por documentos fiscais?"}
                                {tipo === 3 && "Houve cumprimento das metas estabelecidas?"}
                             </div>
                             <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name={`dec_${tipo}`} checked={parecer.declaracoes?.find(d => d.tipo_declaracao === tipo)?.declaracao === 1} onChange={() => {
                                        const decls = [...(parecer.declaracoes || [])];
                                        const idx = decls.findIndex(d => d.tipo_declaracao === tipo);
                                        if (idx >= 0) decls[idx].declaracao = 1;
                                        else decls.push({ tipo_declaracao: tipo, declaracao: 1 });
                                        updateField('parecer_conclusivo.declaracoes', decls);
                                    }} /> Sim
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name={`dec_${tipo}`} checked={parecer.declaracoes?.find(d => d.tipo_declaracao === tipo)?.declaracao === 2} onChange={() => {
                                        const decls = [...(parecer.declaracoes || [])];
                                        const idx = decls.findIndex(d => d.tipo_declaracao === tipo);
                                        if (idx >= 0) decls[idx].declaracao = 2;
                                        else decls.push({ tipo_declaracao: tipo, declaracao: 2 });
                                        updateField('parecer_conclusivo.declaracoes', decls);
                                    }} /> Não
                                </label>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 23. Demonstrações Contábeis ---
export const DemonstracoesContabeisBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const demo = data.demonstracoes_contabeis || {} as DemonstracoesContabeis;

    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="23. Demonstrações Contábeis" />
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6">
                <h4 className="text-xs font-bold uppercase text-blue-800 mb-2">Responsável Técnico (Contador)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Nome" value={demo.responsavel?.numero_crc} onChange={(v:any) => updateField('demonstracoes_contabeis.responsavel.numero_crc', v)} /> {/* Usando campo generico para nome ou CRC conforme JSON */}
                    <Field label="CPF" value={demo.responsavel?.cpf} onChange={(v:any) => updateField('demonstracoes_contabeis.responsavel.cpf', v)} />
                    <div className={CLS.FLEX_ROW_CENTER + " h-10 mt-5"}>
                         <input type="checkbox" className={CLS.CHECKBOX} checked={demo.responsavel?.situacao_regular_crc} onChange={e => updateField('demonstracoes_contabeis.responsavel.situacao_regular_crc', e.target.checked)} />
                         <label className="text-xs font-bold text-slate-500 uppercase">Regular no CRC?</label>
                    </div>
                </div>
            </div>
            
            {/* Array de Publicações */}
            <h4 className={CLS.LABEL}>Publicações das Demonstrações</h4>
            {(demo.publicacoes || []).map((pub, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                     <input className={CLS.INPUT} placeholder="Veículo" value={pub.nome_veiculo} onChange={e => {
                         const list = [...(demo.publicacoes || [])];
                         list[idx].nome_veiculo = e.target.value;
                         updateField('demonstracoes_contabeis.publicacoes', list);
                     }} />
                     <input type="date" className={CLS.INPUT} value={pub.data_publicacao} onChange={e => {
                         const list = [...(demo.publicacoes || [])];
                         list[idx].data_publicacao = e.target.value;
                         updateField('demonstracoes_contabeis.publicacoes', list);
                     }} />
                     <button className={CLS.BTN_REMOVE} onClick={() => {
                          const list = [...(demo.publicacoes || [])];
                          list.splice(idx, 1);
                          updateField('demonstracoes_contabeis.publicacoes', list);
                     }}>X</button>
                </div>
            ))}
            <button onClick={() => {
                const list = [...(demo.publicacoes || [])];
                list.push({ tipo_veiculo_publicacao: 1, data_publicacao: '', nome_veiculo: '' });
                updateField('demonstracoes_contabeis.publicacoes', list);
            }} className={CLS.BTN_ADD}>+ Publicação</button>
        </div>
    );
};
