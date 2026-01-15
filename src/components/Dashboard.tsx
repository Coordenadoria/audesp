
import React from 'react';
import { PrestacaoContas } from '../schemas/type-definitions';
import { SectionStatus } from '../services/validationService';
import { CLS } from './ui/BlockBase';

interface DashboardProps {
    data: PrestacaoContas;
    sectionStatus: Record<string, SectionStatus>;
    onNavigate: (sectionId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, sectionStatus, onNavigate }) => {
    
    // Calculate Financial Totals
    const totalRepasses = data.receitas?.repasses_recebidos?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0;
    const totalOutrasReceitas = (data.receitas?.outras_receitas?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_municipais || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_estaduais || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_federais || 0);
    
    const totalReceitas = totalRepasses + totalOutrasReceitas;

    const totalPagamentos = data.pagamentos?.reduce((acc, cur) => acc + (cur.pagamento_valor || 0), 0) || 0;
    const totalDevolucoes = data.devolucoes?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0;
    const totalDespesas = totalPagamentos + totalDevolucoes;

    const saldo = totalReceitas - totalDespesas;

    // Calculate Completion
    // Uses the semantic keys now
    const sectionKeys = [
        'descritor', 'codigo_ajuste', 'dados_gerais', 'responsaveis',
        'empenhos', 'contratos', 'documentos_fiscais', 'pagamentos', 'repasses', 'receitas', 'glosas', 'ajustes_saldo', 'descontos', 'devolucoes', 'disponibilidades',
        'relatorio_atividades', 'relatorio_gov',
        'relacao_empregados', 'servidores_cedidos', 'relacao_bens',
        'demonstracoes', 'publicacoes',
        'declaracoes', 'transparencia', 'parecer'
    ];
    
    const totalSections = sectionKeys.length;
    const validSections = (Object.values(sectionStatus) as SectionStatus[]).filter(s => s.status === 'valid').length;
    const progress = Math.round((validSections / totalSections) * 100);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Progresso do Preenchimento</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-slate-800">{progress}%</span>
                        <span className="text-sm text-slate-500 mb-1">{validSections}/{totalSections} Blocos</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Receitas</h3>
                    <span className="text-2xl font-bold text-slate-800">
                        {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Repasses + Rendimentos</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Total Despesas</h3>
                    <span className="text-2xl font-bold text-slate-800">
                        {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Pagamentos + Devoluções</p>
                </div>

                <div className={`p-6 rounded-lg shadow-sm border ${saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Final Estimado</h3>
                    <span className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Calculado automaticamente</p>
                </div>
            </div>

            {/* Sections Grid */}
            <div className={CLS.SECTION}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={CLS.HEADER_TITLE}>Status dos Blocos</h2>
                    <div className="flex gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Completo</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Inválido/Pendente</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Vazio (Opcional)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sectionKeys.map(id => {
                        const status = sectionStatus[id];
                        let statusColor = 'bg-slate-50 border-slate-200 text-slate-400';
                        let icon = '⚪';

                        if (status?.status === 'valid') {
                            statusColor = 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
                            icon = '✅';
                        } else if (status?.status === 'invalid') {
                            statusColor = 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100';
                            icon = '⚠️';
                        }

                        // Human Readable Labels for Semantic Keys
                        const labels: Record<string, string> = {
                            'descritor': 'Descritor', 'codigo_ajuste': 'Código Ajuste', 'dados_gerais': 'Dados Gerais', 'responsaveis': 'Responsáveis',
                            'empenhos': 'Empenhos', 'contratos': 'Contratos', 'documentos_fiscais': 'Docs Fiscais', 'pagamentos': 'Pagamentos', 'repasses': 'Repasses', 'receitas': 'Receitas', 'glosas': 'Glosas', 'ajustes_saldo': 'Ajustes Saldo', 'descontos': 'Descontos', 'devolucoes': 'Devoluções', 'disponibilidades': 'Disponibilidades',
                            'relatorio_atividades': 'Rel. Atividades', 'relatorio_gov': 'Rel. Governo',
                            'relacao_empregados': 'Empregados', 'servidores_cedidos': 'Cedidos', 'relacao_bens': 'Bens',
                            'demonstracoes': 'Dem. Contábeis', 'publicacoes': 'Publicações',
                            'declaracoes': 'Declarações', 'transparencia': 'Transparência', 'parecer': 'Parecer'
                        };

                        return (
                            <button 
                                key={id}
                                onClick={() => onNavigate(id)}
                                className={`p-3 rounded border text-left transition-all ${statusColor} relative group`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-xs uppercase tracking-wide opacity-70">Seção</span>
                                    <span>{icon}</span>
                                </div>
                                <div className="font-semibold text-sm mt-1 truncate">
                                    {labels[id] || id}
                                </div>
                                {status?.errors.length > 0 && (
                                    <div className="hidden group-hover:block absolute bottom-full left-0 w-full bg-slate-800 text-white text-[10px] p-2 rounded mb-2 z-10 shadow-lg">
                                        {status.errors[0]} {status.errors.length > 1 && `(+${status.errors.length - 1})`}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
