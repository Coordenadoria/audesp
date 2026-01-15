
import React from 'react';
import { PrestacaoContas } from '../types';
import { CLS } from './ui/BlockBase';

interface ConferenceReportProps {
    data: PrestacaoContas;
    onDownloadJson: () => void;
}

// Formatters
const fmtMoney = (val?: number) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (val?: string) => {
    if (!val) return '-';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
};
const fmtDoc = (val?: string) => val || '-';

export const ConferenceReport: React.FC<ConferenceReportProps> = ({ data, onDownloadJson }) => {
    
    // Totais Calculados
    const totalEmpregados = data.relacao_empregados?.reduce((acc, emp) => 
        acc + (emp.periodos_remuneracao?.reduce((pAcc, p) => pAcc + p.remuneracao_bruta, 0) || 0), 0) || 0;
    
    const totalContratos = data.contratos?.reduce((acc, c) => acc + c.valor_montante, 0) || 0;
    const totalNotas = data.documentos_fiscais?.reduce((acc, d) => acc + d.valor_bruto, 0) || 0;
    const totalPagamentos = data.pagamentos?.reduce((acc, p) => acc + p.pagamento_valor, 0) || 0;
    const totalRepasses = data.receitas?.repasses_recebidos?.reduce((acc, r) => acc + r.valor, 0) || 0;

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-500 max-w-5xl mx-auto border border-slate-200 print:shadow-none print:border-none">
            {/* Header / Ações */}
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-xl font-bold">Relatório de Conferência</h2>
                    <p className="text-xs text-slate-400">Espelho da Prestação de Contas - Audesp Fase V</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded text-sm font-bold transition-colors">
                        🖨️ Imprimir
                    </button>
                    <button onClick={onDownloadJson} className={CLS.BTN_ADD}>
                        ⬇️ Baixar JSON
                    </button>
                </div>
            </div>

            {/* Conteúdo do Relatório (Printable) */}
            <div className="p-8 print:p-0 font-serif text-slate-900 space-y-8">
                
                {/* Cabeçalho Oficial */}
                <div className="text-center border-b-2 border-slate-800 pb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Prestação de Contas</h1>
                    <h3 className="text-lg font-semibold">{data.descritor.tipo_documento}</h3>
                    <div className="mt-4 flex justify-center gap-8 text-sm">
                        <span><strong>Entidade:</strong> {data.descritor.entidade}</span>
                        <span><strong>Município:</strong> {data.descritor.municipio}</span>
                        <span><strong>Competência:</strong> {data.descritor.mes}/{data.descritor.ano}</span>
                        <span><strong>Código Ajuste:</strong> {data.codigo_ajuste || "N/A"}</span>
                    </div>
                </div>

                {/* Resumo Financeiro */}
                <section>
                    <h4 className="bg-slate-100 p-2 font-bold uppercase text-sm border-l-4 border-slate-800 mb-4">1. Resumo Financeiro</h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-3 border rounded">
                            <span className="block text-xs uppercase text-slate-500">Repasses Recebidos</span>
                            <span className="block font-bold text-lg">{fmtMoney(totalRepasses)}</span>
                        </div>
                        <div className="p-3 border rounded">
                            <span className="block text-xs uppercase text-slate-500">Total Contratado</span>
                            <span className="block font-bold text-lg">{fmtMoney(totalContratos)}</span>
                        </div>
                        <div className="p-3 border rounded">
                            <span className="block text-xs uppercase text-slate-500">Notas Fiscais</span>
                            <span className="block font-bold text-lg">{fmtMoney(totalNotas)}</span>
                        </div>
                        <div className="p-3 border rounded">
                            <span className="block text-xs uppercase text-slate-500">Pagamentos Efetuados</span>
                            <span className="block font-bold text-lg">{fmtMoney(totalPagamentos)}</span>
                        </div>
                    </div>
                </section>

                {/* Empregados */}
                <section>
                    <h4 className="bg-slate-100 p-2 font-bold uppercase text-sm border-l-4 border-slate-800 mb-2 flex justify-between">
                        <span>2. Relação de Empregados</span>
                        <span className="text-xs font-normal">Total Folha: {fmtMoney(totalEmpregados)}</span>
                    </h4>
                    {data.relacao_empregados && data.relacao_empregados.length > 0 ? (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-2">CPF</th>
                                    <th className="p-2">Admissão</th>
                                    <th className="p-2">CBO</th>
                                    <th className="p-2">Salário Contratual</th>
                                    <th className="p-2">Períodos (Mês/Valor)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.relacao_empregados.map((emp, i) => (
                                    <tr key={i} className="border-b hover:bg-slate-50">
                                        <td className="p-2">{fmtDoc(emp.cpf)}</td>
                                        <td className="p-2">{fmtDate(emp.data_admissao)}</td>
                                        <td className="p-2">{emp.cbo}</td>
                                        <td className="p-2">{fmtMoney(emp.salario_contratual)}</td>
                                        <td className="p-2">
                                            {emp.periodos_remuneracao?.map((p, pi) => (
                                                <div key={pi}>Mês {p.mes}: {fmtMoney(p.remuneracao_bruta)}</div>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-xs text-slate-500 italic p-2">Nenhum registro.</p>}
                </section>

                {/* Documentos Fiscais */}
                <section>
                    <h4 className="bg-slate-100 p-2 font-bold uppercase text-sm border-l-4 border-slate-800 mb-2">3. Documentos Fiscais</h4>
                    {data.documentos_fiscais && data.documentos_fiscais.length > 0 ? (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-2">Número</th>
                                    <th className="p-2">Emissão</th>
                                    <th className="p-2">Credor</th>
                                    <th className="p-2">Descrição</th>
                                    <th className="p-2 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.documentos_fiscais.map((doc, i) => (
                                    <tr key={i} className="border-b hover:bg-slate-50">
                                        <td className="p-2 font-bold">{doc.numero}</td>
                                        <td className="p-2">{fmtDate(doc.data_emissao)}</td>
                                        <td className="p-2">{doc.credor?.nome} <br/><span className="text-[10px] text-slate-500">{doc.credor?.documento_numero}</span></td>
                                        <td className="p-2 max-w-[200px] truncate">{doc.descricao}</td>
                                        <td className="p-2 text-right font-mono">{fmtMoney(doc.valor_bruto)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-xs text-slate-500 italic p-2">Nenhum registro.</p>}
                </section>

                {/* Pagamentos */}
                <section>
                    <h4 className="bg-slate-100 p-2 font-bold uppercase text-sm border-l-4 border-slate-800 mb-2">4. Pagamentos</h4>
                    {data.pagamentos && data.pagamentos.length > 0 ? (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-2">Data</th>
                                    <th className="p-2">NF Vinculada</th>
                                    <th className="p-2">Meio Pgto</th>
                                    <th className="p-2 text-right">Valor Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.pagamentos.map((pag, i) => (
                                    <tr key={i} className="border-b hover:bg-slate-50">
                                        <td className="p-2">{fmtDate(pag.pagamento_data)}</td>
                                        <td className="p-2">{pag.identificacao_documento_fiscal?.numero || "N/A"}</td>
                                        <td className="p-2">
                                            {pag.meio_pagamento_tipo === 1 ? "Cheque" : pag.meio_pagamento_tipo === 2 ? "Transf/Pix" : "Espécie"}
                                            {pag.numero_transacao && <span className="block text-[10px] text-slate-500">Tx: {pag.numero_transacao}</span>}
                                        </td>
                                        <td className="p-2 text-right font-mono">{fmtMoney(pag.pagamento_valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-xs text-slate-500 italic p-2">Nenhum registro.</p>}
                </section>

                {/* Assinaturas */}
                <section className="mt-12 pt-8 border-t break-inside-avoid">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-8"></div>
                            <p className="font-bold text-sm">Responsável Legal</p>
                            <p className="text-xs text-slate-500">Assinatura</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-8"></div>
                            <p className="font-bold text-sm">Contador Responsável</p>
                            <p className="text-xs text-slate-500">CRC/Assinatura</p>
                        </div>
                    </div>
                </section>

                <div className="text-[10px] text-slate-400 text-center mt-8">
                    Gerado via Audesp Connect Phase V • {new Date().toLocaleString()}
                </div>
            </div>
        </div>
    );
};
