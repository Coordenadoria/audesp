
import React from 'react';
import { ArrayBlock, Field, CLS } from '../ui/BlockBase';
import { Empregado, ServidorCedido } from '../../schemas/type-definitions';

export const EmpregadosBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <ArrayBlock<Empregado>
            title="4. Relação de Empregados"
            items={data.relacao_empregados || []}
            newItemTemplate={{ 
                cpf: '', 
                data_admissao: '', 
                salario_contratual: 0, 
                cbo: '', 
                cns: '',
                data_demissao: '',
                periodos_remuneracao: [] 
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="relacao_empregados"
            renderItem={(emp, idx, update) => (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="CPF" value={emp.cpf} onChange={(v: any) => update('cpf', v)} />
                        <Field label="Data Admissão" type="date" value={emp.data_admissao} onChange={(v: any) => update('data_admissao', v)} />
                        <Field label="Data Demissão" type="date" value={emp.data_demissao || ''} onChange={(v: any) => update('data_demissao', v)} />
                        <Field label="CBO" value={emp.cbo} onChange={(v: any) => update('cbo', v)} />
                        <Field label="CNS (Cartão SUS)" value={emp.cns || ''} onChange={(v: any) => update('cns', v)} />
                        <Field label="Salário Contratual" type="number" value={emp.salario_contratual} onChange={(v: any) => update('salario_contratual', v)} />
                    </div>
                    
                    {/* Nested Periodos */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs font-bold uppercase text-slate-500">Holerites / Remunerações</h5>
                            <button 
                                onClick={() => {
                                    const newP = [...(emp.periodos_remuneracao || []), { mes: 1, carga_horaria: 160, remuneracao_bruta: emp.salario_contratual }];
                                    update('periodos_remuneracao', newP);
                                }}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                                + Adicionar Período
                            </button>
                        </div>
                        {emp.periodos_remuneracao?.map((p, pIdx) => (
                            <div key={pIdx} className="flex gap-2 items-end mb-2 border-b border-slate-100 pb-2">
                                <div className="w-16">
                                    <label className="text-[9px] font-bold text-slate-400">Mês</label>
                                    <input type="number" min="1" max="12" className={CLS.INPUT + " h-8 py-0 text-xs"} value={p.mes} onChange={e => {
                                        const copy = [...emp.periodos_remuneracao];
                                        copy[pIdx].mes = Number(e.target.value);
                                        update('periodos_remuneracao', copy);
                                    }} />
                                </div>
                                <div className="w-20">
                                    <label className="text-[9px] font-bold text-slate-400">C. Horária</label>
                                    <input type="number" className={CLS.INPUT + " h-8 py-0 text-xs"} value={p.carga_horaria} onChange={e => {
                                        const copy = [...emp.periodos_remuneracao];
                                        copy[pIdx].carga_horaria = Number(e.target.value);
                                        update('periodos_remuneracao', copy);
                                    }} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-slate-400">Bruto (R$)</label>
                                    <input type="number" className={CLS.INPUT + " h-8 py-0 text-xs"} value={p.remuneracao_bruta} onChange={e => {
                                        const copy = [...emp.periodos_remuneracao];
                                        copy[pIdx].remuneracao_bruta = Number(e.target.value);
                                        update('periodos_remuneracao', copy);
                                    }} />
                                </div>
                                <button 
                                    onClick={() => {
                                        const copy = [...emp.periodos_remuneracao];
                                        copy.splice(pIdx, 1);
                                        update('periodos_remuneracao', copy);
                                    }}
                                    className="text-red-400 font-bold text-xs pb-1 hover:text-red-600"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        />
    );
};

export const ServidoresCedidosBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <ArrayBlock<ServidorCedido>
            title="12. Servidores Cedidos"
            items={data.servidores_cedidos || []}
            newItemTemplate={{ 
                cpf: '', 
                cargo_publico_ocupado: '', 
                funcao_desempenhada_entidade_beneficiaria: '', 
                data_inicial_cessao: '', 
                onus_pagamento: 1, 
                periodos_cessao: [] 
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="servidores_cedidos"
            renderItem={(item, i, update) => (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="CPF" value={item.cpf} onChange={(v:any)=>update('cpf',v)} />
                        <Field label="Data Início Cessão" type="date" value={item.data_inicial_cessao} onChange={(v:any)=>update('data_inicial_cessao',v)} />
                        <Field label="Cargo Origem" value={item.cargo_publico_ocupado} onChange={(v:any)=>update('cargo_publico_ocupado',v)} />
                        <Field label="Função Entidade" value={item.funcao_desempenhada_entidade_beneficiaria} onChange={(v:any)=>update('funcao_desempenhada_entidade_beneficiaria',v)} />
                        <Field 
                            label="Ônus Pagamento" 
                            value={item.onus_pagamento} 
                            onChange={(v:any)=>update('onus_pagamento', Number(v))}
                            options={[
                                {value: 1, label: "Origem"},
                                {value: 2, label: "Destino"},
                                {value: 3, label: "Parcial"}
                            ]}
                        />
                    </div>
                </div>
            )} 
        />
    );
};
