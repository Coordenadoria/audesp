
import React from 'react';
import { Field, CLS, SectionHeader, ArrayBlock } from '../ui/BlockBase';
import { PrestacaoContas, DadosGerais, Responsaveis, Declaracoes } from '../../schemas/type-definitions';

// --- 19. Dados Gerais ---
export const DadosGeraisBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const dados = data.dados_gerais_entidade_beneficiaria || {} as DadosGerais;

    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="19. Dados Gerais da Entidade" />
            <div className="grid grid-cols-1 gap-4">
                <Field 
                    label="Certidão de Dados Gerais (Código/Hash)" 
                    value={dados.identificacao_certidao_dados_gerais} 
                    onChange={(v:any) => updateField('dados_gerais_entidade_beneficiaria.identificacao_certidao_dados_gerais', v)} 
                />
                <Field 
                    label="Certidão Corpo Diretivo (Código/Hash)" 
                    value={dados.identificacao_certidao_corpo_diretivo} 
                    onChange={(v:any) => updateField('dados_gerais_entidade_beneficiaria.identificacao_certidao_corpo_diretivo', v)} 
                />
                <Field 
                    label="Certidão Membros Conselho (Código/Hash)" 
                    value={dados.identificacao_certidao_membros_conselho} 
                    onChange={(v:any) => updateField('dados_gerais_entidade_beneficiaria.identificacao_certidao_membros_conselho', v)} 
                />
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">
                * Informe o código de autenticação das certidões emitidas no cadastro do TCESP.
            </p>
        </div>
    );
};

// --- 20. Responsáveis ---
export const ResponsaveisBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const resp = data.responsaveis_membros_orgao_concessor || {} as Responsaveis;
    
    return (
        <div className={CLS.SECTION}>
            <SectionHeader title="20. Responsáveis (Órgão Concessor)" />
            <div className="grid grid-cols-1 gap-4">
                 <Field 
                    label="Certidão Responsáveis (Código)" 
                    value={resp.identificacao_certidao_responsaveis} 
                    onChange={(v:any) => updateField('responsaveis_membros_orgao_concessor.identificacao_certidao_responsaveis', v)} 
                />
                 <Field 
                    label="Certidão Comissão Avaliação (Código)" 
                    value={resp.identificacao_certidao_membros_comissao_avaliacao} 
                    onChange={(v:any) => updateField('responsaveis_membros_orgao_concessor.identificacao_certidao_membros_comissao_avaliacao', v)} 
                />
                 <Field 
                    label="Certidão Controle Interno (Código)" 
                    value={resp.identificacao_certidao_membros_controle_interno} 
                    onChange={(v:any) => updateField('responsaveis_membros_orgao_concessor.identificacao_certidao_membros_controle_interno', v)} 
                />
            </div>
        </div>
    );
};

// --- 21. Declarações ---
export const DeclaracoesBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const dec = data.declaracoes || {} as Declaracoes;

    const updateDec = (field: string, val: any) => {
        updateField(`declaracoes.${field}`, val);
    };

    return (
        <div className="space-y-6">
            <div className={CLS.SECTION}>
                <SectionHeader title="21. Declarações Obrigatórias" />
                
                {/* 21.1 Empresas Pertencentes */}
                <div className="mb-6 border-b border-slate-100 pb-6">
                    <div className={CLS.FLEX_ROW_CENTER + " mb-4"}>
                        <input 
                            type="checkbox" 
                            className={CLS.CHECKBOX}
                            checked={dec.houve_contratacao_empresas_pertencentes} 
                            onChange={e => updateDec('houve_contratacao_empresas_pertencentes', e.target.checked)} 
                        />
                        <label className="font-bold text-slate-700">
                            Houve contratação de empresas pertencentes a dirigentes?
                        </label>
                    </div>

                    {dec.houve_contratacao_empresas_pertencentes && (
                        <div className="pl-6 bg-red-50 p-4 rounded border border-red-100">
                            <h4 className="text-sm font-bold text-red-800 mb-2">Relacionar Empresas</h4>
                            {(dec.empresas_pertencentes || []).map((emp, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <div className="w-1/2">
                                        <input className={CLS.INPUT} placeholder="CNPJ" value={emp.cnpj} onChange={e => {
                                            const list = [...(dec.empresas_pertencentes || [])];
                                            list[idx].cnpj = e.target.value;
                                            updateDec('empresas_pertencentes', list);
                                        }} />
                                    </div>
                                    <div className="w-1/2">
                                        <input className={CLS.INPUT} placeholder="CPF Dirigente" value={emp.cpf} onChange={e => {
                                            const list = [...(dec.empresas_pertencentes || [])];
                                            list[idx].cpf = e.target.value;
                                            updateDec('empresas_pertencentes', list);
                                        }} />
                                    </div>
                                    <button onClick={() => {
                                        const list = [...(dec.empresas_pertencentes || [])];
                                        list.splice(idx, 1);
                                        updateDec('empresas_pertencentes', list);
                                    }} className={CLS.BTN_REMOVE}>X</button>
                                </div>
                            ))}
                            <button onClick={() => {
                                const list = [...(dec.empresas_pertencentes || [])];
                                list.push({ cnpj: '', cpf: '' });
                                updateDec('empresas_pertencentes', list);
                            }} className={CLS.BTN_ADD + " mt-2"}>+ Adicionar Empresa</button>
                        </div>
                    )}
                </div>

                {/* 21.2 Quadro Diretivo */}
                <div>
                    <div className={CLS.FLEX_ROW_CENTER + " mb-4"}>
                        <input 
                            type="checkbox" 
                            className={CLS.CHECKBOX}
                            checked={dec.houve_participacao_quadro_diretivo_administrativo} 
                            onChange={e => updateDec('houve_participacao_quadro_diretivo_administrativo', e.target.checked)} 
                        />
                        <label className="font-bold text-slate-700">
                            Houve participação do quadro diretivo em contratações?
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
