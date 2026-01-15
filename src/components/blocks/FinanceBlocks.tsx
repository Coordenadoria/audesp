
import React from 'react';
import { ArrayBlock, InputGroup, CLS, Field } from '../ui/BlockBase';
import { Contrato, DocumentoFiscal, Pagamento, PrestacaoContas } from '../../schemas/type-definitions';
import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

// --- 6. Contratos ---
export const ContratosBlock = ({ data, onUpdate, onAdd, onRemove }: any) => {
    return (
        <>
            {/* OCR Upload */}
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <p className="text-sm font-semibold text-purple-800 mb-2">📄 Extrair Contratos de PDF</p>
                <p className="text-xs text-purple-700 mb-3">Carregue um PDF com dados de contratos para pré-preenchimento automático:</p>
                <PDFUploader 
                    onDataExtracted={(extracted, confidence) => {
                        const mapped = mapExtractedDataToForm(extracted);
                        if (mapped.contratos && Array.isArray(mapped.contratos)) {
                            // Adicionar cada contrato extraído
                            mapped.contratos.forEach((c: any) => onAdd(c));
                            console.log(`✓ ${mapped.contratos.length} contrato(s) adicionado(s) com ${Math.round(confidence * 100)}% confiança`);
                        }
                    }}
                    onError={(error) => alert(`❌ Erro: ${error}`)}
                />
            </div>
        
            <ArrayBlock<Contrato>
            title="6. Contratos"
            items={data.contratos || []}
            newItemTemplate={{ 
                numero: '', 
                credor: { documento_numero: '', nome: '', documento_tipo: 2 }, 
                valor_montante: 0, 
                data_assinatura: '', 
                objeto: '',
                natureza_contratacao: [],
                criterio_selecao: 1,
                valor_tipo: 2,
                vigencia_tipo: 1,
                vigencia_data_inicial: ''
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="contratos"
            renderItem={(ctr, idx, update) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Número Contrato" value={ctr.numero} onChange={(v: any) => update('numero', v)} />
                    <Field label="Data Assinatura" type="date" value={ctr.data_assinatura} onChange={(v: any) => update('data_assinatura', v)} />
                    <Field label="Vigência Inicial" type="date" value={ctr.vigencia_data_inicial} onChange={(v: any) => update('vigencia_data_inicial', v)} />
                    <Field label="Valor Global (R$)" type="number" value={ctr.valor_montante} onChange={(v: any) => update('valor_montante', v)} />
                    
                    <div className="col-span-2">
                        <Field label="Objeto" value={ctr.objeto} onChange={(v: any) => update('objeto', v)} />
                    </div>
                    
                    <div className="col-span-2 p-3 bg-blue-50/50 border border-blue-100 rounded">
                        <h4 className="text-[10px] font-bold uppercase text-blue-800 mb-2">Credor</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="CNPJ/CPF" value={ctr.credor?.documento_numero} onChange={(v: any) => update('credor.documento_numero', v)} />
                            <Field label="Nome/Razão Social" value={ctr.credor?.nome} onChange={(v: any) => update('credor.nome', v)} />
                        </div>
                    </div>
                </div>
            )}
        />
        </>
    );
};

// --- 7. Docs Fiscais (With Contract Linking) ---
export const DocsFiscaisBlock = ({ data, onUpdate, onAdd, onRemove, fullData }: any) => {
    const contracts = (fullData as PrestacaoContas).contratos || [];

    return (
        <>
            {/* OCR Upload */}
            <div className="mb-6 p-4 bg-cyan-50 border-2 border-cyan-200 rounded-lg">
                <p className="text-sm font-semibold text-cyan-800 mb-2">📄 Extrair Documentos Fiscais de PDF</p>
                <p className="text-xs text-cyan-700 mb-3">Carregue um PDF com notas fiscais para pré-preenchimento automático:</p>
                <PDFUploader 
                    onDataExtracted={(extracted, confidence) => {
                        const mapped = mapExtractedDataToForm(extracted);
                        if (mapped.documentos_fiscais && Array.isArray(mapped.documentos_fiscais)) {
                            mapped.documentos_fiscais.forEach((d: any) => onAdd(d));
                            console.log(`✓ ${mapped.documentos_fiscais.length} documento(s) fiscal(is) adicionado(s)`);
                        }
                    }}
                    onError={(error) => alert(`❌ Erro: ${error}`)}
                />
            </div>

            <ArrayBlock<DocumentoFiscal>
            title="7. Documentos Fiscais"
            items={data.documentos_fiscais || []}
            newItemTemplate={{ 
                numero: '', 
                data_emissao: '', 
                valor_bruto: 0, 
                credor: { documento_numero: '', documento_tipo: 2 },
                descricao: '',
                estado_emissor: 35,
                categoria_despesas_tipo: 1,
                rateio_proveniente_tipo: 2
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="documentos_fiscais"
            renderItem={(doc, idx, update) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Número Nota/Recibo" value={doc.numero} onChange={(v: any) => update('numero', v)} />
                    <Field label="Data Emissão" type="date" value={doc.data_emissao} onChange={(v: any) => update('data_emissao', v)} />
                    <Field label="Valor Bruto (R$)" type="number" value={doc.valor_bruto} onChange={(v: any) => update('valor_bruto', v)} />
                    
                    {/* Linking Logic */}
                    <div className="col-span-3 bg-amber-50 p-3 rounded border border-amber-100">
                        <InputGroup label="Vincular a Contrato Existente">
                            <select 
                                className={CLS.INPUT} 
                                value={doc.identificacao_contrato?.numero || ""} 
                                onChange={e => {
                                    const cNum = e.target.value;
                                    const contract = contracts.find(c => c.numero === cNum);
                                    if(contract) {
                                        update('identificacao_contrato', { 
                                            numero: cNum, 
                                            data_assinatura: contract.data_assinatura, 
                                            identificacao_credor: contract.credor 
                                        });
                                        // Auto-fill creditor if empty
                                        if(!doc.credor?.documento_numero) update('credor', contract.credor);
                                    } else {
                                        update('identificacao_contrato', undefined);
                                    }
                                }}
                            >
                                <option value="">-- Sem Vínculo Contratual --</option>
                                {contracts.map(c => <option key={c.numero} value={c.numero}>Contrato {c.numero} - {c.credor.nome}</option>)}
                            </select>
                        </InputGroup>
                    </div>

                    <div className="col-span-3 grid grid-cols-2 gap-4">
                        <Field label="CNPJ/CPF Emitente" value={doc.credor?.documento_numero} onChange={(v: any) => update('credor.documento_numero', v)} />
                        <Field label="Nome Emitente" value={doc.credor?.nome} onChange={(v: any) => update('credor.nome', v)} />
                    </div>
                </div>
            )}
        />
        </>
    );
};

// --- 8. Pagamentos (With Invoice Linking) ---
export const PagamentosBlock = ({ data, onUpdate, onAdd, onRemove, fullData }: any) => {
    const docs = (fullData as PrestacaoContas).documentos_fiscais || [];

    return (
        <ArrayBlock<Pagamento>
            title="8. Pagamentos"
            items={data.pagamentos || []}
            newItemTemplate={{ 
                identificacao_documento_fiscal: { numero: '', identificacao_credor: { documento_numero: '', documento_tipo: 2 } }, 
                pagamento_data: '', 
                pagamento_valor: 0,
                fonte_recurso_tipo: 1,
                meio_pagamento_tipo: 2
            }}
            onAdd={onAdd}
            onRemove={onRemove}
            onUpdate={onUpdate}
            ocrSection="pagamentos"
            renderItem={(pag, idx, update) => (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Linking Logic */}
                    <div className="col-span-3 bg-emerald-50 p-3 rounded border border-emerald-100">
                        <InputGroup label="Vincular Documento Fiscal (Nota)">
                            <select 
                                className={CLS.INPUT} 
                                value={pag.identificacao_documento_fiscal?.numero} 
                                onChange={e => {
                                    const docNum = e.target.value;
                                    const doc = docs.find(d => d.numero === docNum);
                                    update('identificacao_documento_fiscal.numero', docNum);
                                    if(doc) {
                                        update('identificacao_documento_fiscal.identificacao_credor', doc.credor);
                                        // Auto-suggest value
                                        if (pag.pagamento_valor === 0) update('pagamento_valor', doc.valor_bruto);
                                    }
                                }}
                            >
                                <option value="">-- Selecione Nota --</option>
                                {docs.map(d => <option key={d.numero} value={d.numero}>NF {d.numero} ({d.credor.nome}) - R${d.valor_bruto}</option>)}
                            </select>
                        </InputGroup>
                    </div>

                    <Field label="Data Pagamento" type="date" value={pag.pagamento_data} onChange={(v: any) => update('pagamento_data', v)} />
                    <Field label="Valor Pago (R$)" type="number" value={pag.pagamento_valor} onChange={(v: any) => update('pagamento_valor', v)} />
                    
                    <Field 
                        label="Meio Pagamento" 
                        value={pag.meio_pagamento_tipo} 
                        onChange={(v: any) => update('meio_pagamento_tipo', Number(v))}
                        options={[
                            {value: 1, label: 'Cheque'},
                            {value: 2, label: 'Transferência/DOC/TED/Pix'},
                            {value: 3, label: 'Espécie'}
                        ]}
                    />
                    
                    {pag.meio_pagamento_tipo === 2 && (
                        <Field label="ID Transação / Autenticação" value={pag.numero_transacao} onChange={(v: any) => update('numero_transacao', v)} />
                    )}
                </div>
            )}
        />
    );
};
