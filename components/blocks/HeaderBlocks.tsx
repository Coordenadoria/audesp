
import React from 'react';
import { Field, CLS, SectionHeader } from '../ui/BlockBase';
import { PrestacaoContas } from '../../types';

export const DescritorBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => (
    <div className={CLS.SECTION}>
        <SectionHeader title="1. Descritor" />
        <Field 
            label="Tipo de Documento" 
            value={data.descritor.tipo_documento} 
            onChange={(v: any) => updateField('descritor.tipo_documento', v)}
            options={[
                { value: "Prestação de Contas de Convênio", label: "Prestação de Contas de Convênio" },
                { value: "Prestação de Contas de Contrato de Gestão", label: "Prestação de Contas de Contrato de Gestão" },
                { value: "Prestação de Contas de Termo de Parceria", label: "Prestação de Contas de Termo de Parceria" },
                { value: "Prestação de Contas de Termo de Fomento", label: "Prestação de Contas de Termo de Fomento" },
                { value: "Prestação de Contas de Termo de Colaboração", label: "Prestação de Contas de Termo de Colaboração" },
                { value: "Declaração Negativa", label: "Declaração Negativa" }
            ]}
        />
        <div className={CLS.GRID_CONTAINER + " mt-4"}>
            <Field label="Município (Código IBGE)" type="number" value={data.descritor.municipio} onChange={(v: any) => updateField('descritor.municipio', v)} />
            <Field label="Entidade (Código TCESP)" type="number" value={data.descritor.entidade} onChange={(v: any) => updateField('descritor.entidade', v)} />
            <Field label="Ano de Referência" type="number" value={data.descritor.ano} onChange={(v: any) => updateField('descritor.ano', v)} />
            <Field label="Mês de Referência" type="number" value={data.descritor.mes} onChange={(v: any) => updateField('descritor.mes', v)} />
        </div>
    </div>
);

export const CodigoAjusteBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => (
    <div className={CLS.SECTION}>
        <SectionHeader title="2. Código do Ajuste" />
        <p className="text-xs text-slate-500 mb-2">Informe o código único do ajuste fornecido pelo TCESP.</p>
        <Field label="Código do Ajuste" value={data.codigo_ajuste} onChange={(v:any) => updateField('codigo_ajuste', v)} />
    </div>
);

export const RetificacaoBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => (
    <div className={CLS.SECTION}>
        <SectionHeader title="3. Retificação" />
        <div className="bg-orange-50 p-4 rounded border border-orange-200 flex items-center gap-3">
            <input 
                type="checkbox" 
                className={CLS.CHECKBOX} 
                checked={data.retificacao} 
                onChange={e => updateField('retificacao', e.target.checked)} 
            />
            <div>
                <label className="font-bold text-slate-800 text-sm">Este envio é uma RETIFICAÇÃO?</label>
                <p className="text-xs text-slate-500">Marque apenas se você já enviou uma prestação para este mês e deseja corrigir dados.</p>
            </div>
        </div>
    </div>
);
