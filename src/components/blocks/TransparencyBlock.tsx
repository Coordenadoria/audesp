
import React from 'react';
import { Field, CLS, SectionHeader, ArrayBlock } from '../ui/BlockBase';
import { PrestacaoContas, Transparencia } from '../../schemas/type-definitions';

// Componente auxiliar para lista de requisitos (Sim/Não)
const RequirementList = ({ 
    title, 
    items, 
    onChange 
}: { 
    title: string, 
    items: any[], // TransparenciaRequisito is simple structure: { requisito: number, atende: boolean }
    onChange: (newItems: any[]) => void 
}) => {
    // Lista base de requisitos conforme Manual (Exemplo simplificado de IDs)
    // Na aplicação real, mapearíamos os textos exatos da legislação para cada ID (1, 2, 3...)
    const definitions = [
        { id: 1, label: "Registro das competências e estrutura organizacional" },
        { id: 2, label: "Endereços, telefones e horários de atendimento" },
        { id: 3, label: "Registros de repasses ou transferências de recursos financeiros" },
        { id: 4, label: "Registros das despesas" },
        { id: 5, label: "Informações sobre procedimentos licitatórios/compras" },
        { id: 6, label: "Disponibilização de dados para acompanhamento de programas" }
    ];

    const toggleReq = (id: number, checked: boolean) => {
        let newItems = [...items];
        const exists = newItems.find(i => i.requisito === id);
        
        if (checked) {
            if (!exists) newItems.push({ requisito: id, atende: true });
            else exists.atende = true;
        } else {
            // Se desmarcar, ou removemos ou setamos como false. 
            // O manual geralmente pede confirmação positiva.
            // Aqui vamos setar atende = false
            if (!exists) newItems.push({ requisito: id, atende: false });
            else exists.atende = false;
        }
        onChange(newItems);
    };

    return (
        <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-700 text-sm uppercase">{title}</h4>
            </div>
            <div className="p-4 space-y-3 bg-white">
                {definitions.map(def => {
                    const req = items.find(i => i.requisito === def.id);
                    const isChecked = req?.atende === true;

                    return (
                        <div key={def.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded transition-colors">
                            <input 
                                type="checkbox" 
                                className={CLS.CHECKBOX + " mt-1"}
                                checked={isChecked}
                                onChange={e => toggleReq(def.id, e.target.checked)}
                            />
                            <div>
                                <span className="text-sm text-slate-700 font-medium block">{def.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Código Requisito: {def.id}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const TransparencyBlock = ({ data, updateField }: { data: PrestacaoContas, updateField: Function }) => {
    const transp = data.transparencia || {
        entidade_beneficiaria_mantem_sitio_internet: false,
        sitios_internet: [],
        requisitos_artigos_7o_8o_paragrafo_1o: [],
        requisitos_sitio_artigo_8o_paragrafo_3o: [],
        requisitos_divulgacao_informacoes: []
    } as Transparencia;

    return (
        <div className="space-y-6">
            <div className={CLS.SECTION}>
                <SectionHeader title="27. Transparência e Acesso à Informação" />
                
                <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            className={CLS.CHECKBOX} 
                            checked={transp.entidade_beneficiaria_mantem_sitio_internet} 
                            onChange={e => updateField('transparencia.entidade_beneficiaria_mantem_sitio_internet', e.target.checked)} 
                        />
                        <label className="font-bold text-blue-900">Entidade beneficiária mantém Sítio na Internet?</label>
                    </div>
                </div>

                {transp.entidade_beneficiaria_mantem_sitio_internet && (
                    <div className="animate-in fade-in space-y-6">
                        {/* Lista de Sítios */}
                        <ArrayBlock<string>
                            title="Endereços dos Sítios Eletrônicos"
                            items={transp.sitios_internet || []}
                            newItemTemplate=""
                            onAdd={() => updateField('transparencia.sitios_internet', [...(transp.sitios_internet || []), ""])}
                            onRemove={idx => {
                                const list = [...(transp.sitios_internet || [])];
                                list.splice(idx, 1);
                                updateField('transparencia.sitios_internet', list);
                            }}
                            onUpdate={(idx, f, v) => {
                                const list = [...(transp.sitios_internet || [])];
                                list[idx] = v;
                                updateField('transparencia.sitios_internet', list);
                            }}
                            renderItem={(item, idx, update) => (
                                <Field label="URL do Sítio" value={item} onChange={(v:any) => update('', v)} />
                            )}
                        />

                        <hr className="border-slate-200" />

                        {/* Checklists de Requisitos */}
                        <RequirementList 
                            title="Requisitos Art. 7º e 8º, § 1º (Conteúdo Mínimo)"
                            items={transp.requisitos_artigos_7o_8o_paragrafo_1o || []}
                            onChange={(list) => updateField('transparencia.requisitos_artigos_7o_8o_paragrafo_1o', list)}
                        />

                        <RequirementList 
                            title="Requisitos Art. 8º, § 3º (Ferramentas do Sítio)"
                            items={transp.requisitos_sitio_artigo_8o_paragrafo_3o || []}
                            onChange={(list) => updateField('transparencia.requisitos_sitio_artigo_8o_paragrafo_3o', list)}
                        />
                        
                        <RequirementList 
                            title="Requisitos de Divulgação de Informações (Prazos e Formatos)"
                            items={transp.requisitos_divulgacao_informacoes || []}
                            onChange={(list) => updateField('transparencia.requisitos_divulgacao_informacoes', list)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
