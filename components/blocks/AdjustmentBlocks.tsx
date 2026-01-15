
import React from 'react';
import { ArrayBlock, Field, CLS, SectionHeader } from '../ui/BlockBase';
import { PrestacaoContas, AjusteRepasse, AjustePagamento, Repasse, InclusaoPagamento } from '../../types';

// --- 11. Ajustes de Saldo ---
export const AjustesSaldoBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    const ajustes = data.ajustes_saldo || {};

    return (
        <div className="space-y-8">
            <div className={CLS.SECTION}>
                <SectionHeader title="11. Ajustes de Saldo" />
                <p className="text-sm text-slate-500 mb-4">
                    Utilize esta seção apenas para corrigir divergências de saldo conciliado bancário x contábil.
                </p>
            </div>

            {/* 11.1 Retificação Repasses */}
            <ArrayBlock<AjusteRepasse>
                title="11.1 Retificação de Repasses"
                items={ajustes.retificacao_repasses || []}
                newItemTemplate={{ data_prevista: '', data_repasse: '', valor_retificado: 0, fonte_recurso_tipo: 1 }}
                onAdd={i => onAdd({ ...ajustes, retificacao_repasses: [...(ajustes.retificacao_repasses || []), i] }, 'ajustes_saldo')}
                onRemove={idx => {
                    const list = [...(ajustes.retificacao_repasses || [])];
                    list.splice(idx, 1);
                    onUpdate('ajustes_saldo.retificacao_repasses', list);
                }}
                onUpdate={(idx, f, v) => {
                    const list = [...(ajustes.retificacao_repasses || [])];
                    list[idx] = { ...list[idx], [f]: v };
                    onUpdate('ajustes_saldo.retificacao_repasses', list);
                }}
                renderItem={(item, idx, update) => (
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="Data Repasse" type="date" value={item.data_repasse} onChange={(v:any)=>update('data_repasse', v)} />
                        <Field label="Valor Retificado" type="number" value={item.valor_retificado} onChange={(v:any)=>update('valor_retificado', v)} />
                        <Field label="Fonte Recurso" type="number" value={item.fonte_recurso_tipo} onChange={(v:any)=>update('fonte_recurso_tipo', v)} />
                    </div>
                )}
            />

             {/* 11.3 Retificação Pagamentos */}
             <ArrayBlock<AjustePagamento>
                title="11.3 Retificação de Pagamentos"
                items={ajustes.retificacao_pagamentos || []}
                newItemTemplate={{ 
                    identificacao_documento_fiscal: { numero: '', identificacao_credor: { documento_numero: '', documento_tipo: 2 } }, 
                    pagamento_data: '', 
                    pagamento_valor: 0, 
                    fonte_recurso_tipo: 1, 
                    valor_retificado: 0 
                }}
                onAdd={i => onAdd({ ...ajustes, retificacao_pagamentos: [...(ajustes.retificacao_pagamentos || []), i] }, 'ajustes_saldo')}
                onRemove={idx => {
                    const list = [...(ajustes.retificacao_pagamentos || [])];
                    list.splice(idx, 1);
                    onUpdate('ajustes_saldo.retificacao_pagamentos', list);
                }}
                onUpdate={(idx, f, v) => {
                     // Logic handled by parent generic update usually, but here mapped manually for nested
                     // Simplified for brevity in this example structure
                }}
                renderItem={(item, idx, update) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Field label="Número NF Original" value={item.identificacao_documento_fiscal?.numero} onChange={(v:any)=>update('identificacao_documento_fiscal.numero', v)} />
                         <Field label="Valor Retificado (Correto)" type="number" value={item.valor_retificado} onChange={(v:any)=>update('valor_retificado', v)} />
                    </div>
                )}
            />
        </div>
    );
};

// --- 17. Repasses (Vinculado a Empenhos) ---
export const RepassesBlock = ({ data, onUpdate, onAdd, onRemove, fullData }: any) => {
    const empenhos = (fullData as PrestacaoContas).empenhos || [];

    return (
        <ArrayBlock<Repasse>
            title="17. Repasses Recebidos (Financeiro)"
            items={data.repasses || []}
            newItemTemplate={{
                identificacao_empenho: { numero: '', data_emissao: '' },
                data_prevista: '',
                data_repasse: '',
                valor_previsto: 0,
                valor_repasse: 0,
                tipo_documento_bancario: 1,
                numero_documento: '',
                banco: 0,
                agencia: 0,
                conta: ''
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="repasses"
            renderItem={(rep, idx, update) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Vínculo com Empenho */}
                    <div className="col-span-3 bg-indigo-50 p-3 rounded border border-indigo-100 mb-2">
                        <label className={CLS.LABEL}>Vincular a Empenho</label>
                        <select 
                            className={CLS.INPUT}
                            value={rep.identificacao_empenho?.numero}
                            onChange={e => {
                                const num = e.target.value;
                                const emp = empenhos.find(e => e.numero === num);
                                if (emp) {
                                    update('identificacao_empenho', { numero: emp.numero, data_emissao: emp.data_emissao });
                                    // Sugerir valor
                                    if(rep.valor_repasse === 0) update('valor_repasse', emp.valor);
                                }
                            }}
                        >
                            <option value="">-- Selecione Empenho --</option>
                            {empenhos.map(e => (
                                <option key={e.numero} value={e.numero}>Empenho {e.numero} ({e.data_emissao}) - R${e.valor}</option>
                            ))}
                        </select>
                    </div>

                    <Field label="Data Repasse" type="date" value={rep.data_repasse} onChange={(v:any)=>update('data_repasse', v)} />
                    <Field label="Valor Recebido (R$)" type="number" value={rep.valor_repasse} onChange={(v:any)=>update('valor_repasse', v)} />
                    <Field label="Nr. Doc Bancário" value={rep.numero_documento} onChange={(v:any)=>update('numero_documento', v)} />
                    
                    <Field label="Banco" type="number" value={rep.banco} onChange={(v:any)=>update('banco', v)} />
                    <Field label="Agência" type="number" value={rep.agencia} onChange={(v:any)=>update('agencia', v)} />
                    <Field label="Conta" value={rep.conta} onChange={(v:any)=>update('conta', v)} />
                </div>
            )}
        />
    );
};
