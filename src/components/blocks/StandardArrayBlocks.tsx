
import React from 'react';
import { ArrayBlock, Field, CLS, SectionHeader } from '../ui/BlockBase';
import { PrestacaoContas, Empenho, Repasse, Receitas, Contrato, DocumentoFiscal, Pagamento, AjustesSaldo, ItemFinanceiro, Disponibilidades, RelacaoBens } from '../../schemas/type-definitions';

// --- 5. Relação de Bens ---
export const BensBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <ArrayBlock
            title="5. Relação de Bens (Móveis Adquiridos)"
            items={data.relacao_bens?.relacao_bens_moveis_adquiridos || []}
            newItemTemplate={{ numero_patrimonio: '', descricao: '', valor_aquisicao: 0, data_aquisicao: '' }}
            onAdd={item => {
                const current = data.relacao_bens || {};
                const list = current.relacao_bens_moveis_adquiridos || [];
                // Chama o adapter com: (ObjetoCompleto, CaminhoString)
                onAdd({ ...current, relacao_bens_moveis_adquiridos: [...list, item] }, 'relacao_bens');
            }}
            onRemove={idx => {
                const list = [...(data.relacao_bens?.relacao_bens_moveis_adquiridos || [])];
                list.splice(idx, 1);
                // Aqui onUpdate é o updateField direto: (CaminhoString, Valor)
                onUpdate('relacao_bens.relacao_bens_moveis_adquiridos', list);
            }}
            onUpdate={(idx, f, v) => {
                 const list = [...(data.relacao_bens?.relacao_bens_moveis_adquiridos || [])];
                 list[idx] = { ...list[idx], [f]: v };
                 onUpdate('relacao_bens.relacao_bens_moveis_adquiridos', list);
            }}
            ocrSection="relacao_bens"
            renderItem={(item, idx, update) => (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="Patrimônio" value={item.numero_patrimonio} onChange={(v:any) => update('numero_patrimonio', v)} />
                    <div className="md:col-span-2">
                        <Field label="Descrição" value={item.descricao} onChange={(v:any) => update('descricao', v)} />
                    </div>
                    <Field label="Data Aquisição" type="date" value={item.data_aquisicao} onChange={(v:any) => update('data_aquisicao', v)} />
                    <Field label="Valor (R$)" type="number" value={item.valor_aquisicao} onChange={(v:any) => update('valor_aquisicao', v)} />
                </div>
            )}
        />
    );
};

// --- 9. Disponibilidades ---
export const DisponibilidadesBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <div className="space-y-6">
            <ArrayBlock
                title="9. Disponibilidades (Saldos Bancários)"
                items={data.disponibilidades?.saldos || []}
                newItemTemplate={{ banco: 0, agencia: 0, conta: '', saldo_bancario: 0, saldo_contabil: 0, conta_tipo: 1 }}
                onAdd={(item) => {
                    const current = data.disponibilidades || { saldo_fundo_fixo: 0, saldos: [] };
                    const saldos = current.saldos || [];
                    // Chama o adapter com: (ObjetoCompleto, CaminhoString)
                    onAdd({ ...current, saldos: [...saldos, item] }, 'disponibilidades');
                }}
                onRemove={(idx) => {
                    const saldos = [...(data.disponibilidades?.saldos || [])];
                    saldos.splice(idx, 1);
                    onUpdate('disponibilidades.saldos', saldos);
                }}
                onUpdate={(idx, f, v) => {
                     const saldos = [...(data.disponibilidades?.saldos || [])];
                     saldos[idx] = { ...saldos[idx], [f]: v }; 
                     onUpdate('disponibilidades.saldos', saldos);
                }}
                ocrSection="disponibilidades"
                renderItem={(item, idx, update) => (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <Field label="Banco" type="number" value={item.banco} onChange={(v:any) => update('banco', v)} />
                        <Field label="Agência" type="number" value={item.agencia} onChange={(v:any) => update('agencia', v)} />
                        <Field label="Conta" value={item.conta} onChange={(v:any) => update('conta', v)} />
                        <Field label="Saldo Banco (R$)" type="number" value={item.saldo_bancario} onChange={(v:any) => update('saldo_bancario', v)} />
                        <Field label="Saldo Contábil (R$)" type="number" value={item.saldo_contabil} onChange={(v:any) => update('saldo_contabil', v)} />
                    </div>
                )}
            />
            
            <div className={CLS.SECTION}>
                <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">Outros Saldos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <Field 
                        label="Saldo Fundo Fixo (Caixa)" 
                        type="number" 
                        value={data.disponibilidades?.saldo_fundo_fixo || 0} 
                        onChange={(v:any) => onUpdate('disponibilidades.saldo_fundo_fixo', v)} 
                    />
                </div>
            </div>
        </div>
    );
};

// --- 10. Receitas ---
export const ReceitasBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <div className="space-y-6">
            <ArrayBlock
                title="10.1 Repasses Recebidos"
                items={data.receitas?.repasses_recebidos || []}
                newItemTemplate={{ data_repasse: '', valor: 0, fonte_recurso_tipo: 1, data_prevista: '' }}
                onAdd={item => {
                    const current = data.receitas || {};
                    const list = current.repasses_recebidos || [];
                    onAdd({ ...current, repasses_recebidos: [...list, item] }, 'receitas');
                }}
                onRemove={idx => {
                    const list = [...(data.receitas?.repasses_recebidos || [])];
                    list.splice(idx, 1);
                    onUpdate('receitas.repasses_recebidos', list);
                }}
                onUpdate={(idx, f, v) => {
                     const list = [...(data.receitas?.repasses_recebidos || [])];
                     list[idx] = { ...list[idx], [f]: v };
                     onUpdate('receitas.repasses_recebidos', list);
                }}
                ocrSection="receitas"
                renderItem={(item, idx, update) => (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Data Prevista" type="date" value={item.data_prevista} onChange={(v:any)=>update('data_prevista',v)} />
                        <Field label="Data Efetiva" type="date" value={item.data_repasse} onChange={(v:any)=>update('data_repasse',v)} />
                        <Field label="Valor (R$)" type="number" value={item.valor} onChange={(v:any)=>update('valor',v)} />
                    </div>
                )}
            />
            
            <div className={CLS.SECTION}>
                <SectionHeader title="10.2 Rendimentos de Aplicação Financeira" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Field 
                        label="Rend. Municipal (R$)" type="number" 
                        value={data.receitas?.receitas_aplic_financ_repasses_publicos_municipais || 0} 
                        onChange={(v:any) => onUpdate('receitas.receitas_aplic_financ_repasses_publicos_municipais', v)} 
                    />
                     <Field 
                        label="Rend. Estadual (R$)" type="number" 
                        value={data.receitas?.receitas_aplic_financ_repasses_publicos_estaduais || 0} 
                        onChange={(v:any) => onUpdate('receitas.receitas_aplic_financ_repasses_publicos_estaduais', v)} 
                    />
                     <Field 
                        label="Rend. Federal (R$)" type="number" 
                        value={data.receitas?.receitas_aplic_financ_repasses_publicos_federais || 0} 
                        onChange={(v:any) => onUpdate('receitas.receitas_aplic_financ_repasses_publicos_federais', v)} 
                    />
                </div>
            </div>
        </div>
    );
};

// --- 13. Descontos ---
export const DescontosBlock = ({ data, onUpdate, onAdd, onRemove }: any) => (
    <ArrayBlock<ItemFinanceiro>
        title="13. Descontos"
        items={data.descontos || []}
        newItemTemplate={{ data: '', descricao: '', valor: 0 }}
        onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate}
        renderItem={(item, i, update) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <Field label="Descrição" value={item.descricao} onChange={(v:any)=>update('descricao',v)} />
                </div>
                <Field label="Data" type="date" value={item.data} onChange={(v:any)=>update('data',v)} />
                <Field label="Valor (R$)" type="number" value={item.valor} onChange={(v:any)=>update('valor',v)} />
            </div>
        )}
    />
);

// --- 14. Devoluções ---
export const DevolucoesBlock = ({ data, onUpdate, onAdd, onRemove }: any) => (
    <ArrayBlock<ItemFinanceiro>
        title="14. Devoluções de Saldo"
        items={data.devolucoes || []}
        newItemTemplate={{ data: '', natureza_devolucao_tipo: 1, valor: 0 }}
        onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate}
        renderItem={(item, i, update) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Data" type="date" value={item.data} onChange={(v:any)=>update('data',v)} />
                <Field label="Valor (R$)" type="number" value={item.valor} onChange={(v:any)=>update('valor',v)} />
                <Field 
                    label="Natureza" 
                    value={item.natureza_devolucao_tipo} 
                    onChange={(v:any)=>update('natureza_devolucao_tipo', Number(v))}
                    options={[
                        { value: 1, label: "Saldo de Recursos não Utilizados" },
                        { value: 2, label: "Glosas" },
                        { value: 3, label: "Rendimentos de Aplicação" }
                    ]}
                />
            </div>
        )}
    />
);

// --- 15. Glosas ---
export const GlosasBlock = ({ data, onUpdate, onAdd, onRemove }: any) => (
    <ArrayBlock<ItemFinanceiro>
        title="15. Glosas"
        items={data.glosas || []}
        newItemTemplate={{ identificacao_documento_fiscal: { numero: '', identificacao_credor: { documento_numero: '', documento_tipo: 2 } }, resultado_analise: 1, valor_glosa: 0 }}
        onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate}
        renderItem={(item, i, update) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Field label="Número Nota Fiscal" value={item.identificacao_documento_fiscal?.numero} onChange={(v:any)=>update('identificacao_documento_fiscal.numero',v)} />
                 <Field label="Valor Glosado (R$)" type="number" value={item.valor_glosa} onChange={(v:any)=>update('valor_glosa',v)} />
                 <Field 
                    label="Tipo Glosa" 
                    value={item.resultado_analise} 
                    onChange={(v:any)=>update('resultado_analise', Number(v))}
                    options={[
                        { value: 1, label: "Total" },
                        { value: 2, label: "Parcial" }
                    ]}
                />
            </div>
        )}
    />
);

// --- 16. Empenhos ---
export const EmpenhosBlock = ({ data, onUpdate, onAdd, onRemove }: any) => (
    <ArrayBlock<Empenho>
        title="16. Empenhos"
        items={data.empenhos || []}
        newItemTemplate={{ numero: '', data_emissao: '', valor: 0, historico: '', classificacao_economica_tipo: '', fonte_recurso_tipo: 1, cpf_ordenador_despesa: '' }}
        onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate}
        ocrSection="empenhos"
        renderItem={(item, i, update) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Número Empenho" value={item.numero} onChange={(v:any)=>update('numero',v)} />
                <Field label="Data Emissão" type="date" value={item.data_emissao} onChange={(v:any)=>update('data_emissao',v)} />
                <Field label="Valor (R$)" type="number" value={item.valor} onChange={(v:any)=>update('valor',v)} />
                <div className="md:col-span-3">
                    <Field label="Histórico" value={item.historico} onChange={(v:any)=>update('historico',v)} />
                </div>
            </div>
        )}
    />
);
