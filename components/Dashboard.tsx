import React, { useState } from 'react';
import { PrestacaoContas } from '../types';
import { SectionStatus } from '../services/validationService';
import { CLS } from './ui/BlockBase';
import PrestacaoContasForm from './PrestacaoContasForm';

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
    const totalSections = 27;
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
                    {Array.from({length: 27}, (_, i) => String(i + 1)).map(id => {
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

                        // Labels simplificados para caber no card
                        const labels: Record<string, string> = {
                            '1': 'Descritor', '2': 'Ajuste', '3': 'Retificação', '4': 'Empregados', '5': 'Bens',
                            '6': 'Contratos', '7': 'Docs Fiscais', '8': 'Pagamentos', '9': 'Disponibilidades',
                            '10': 'Receitas', '11': 'Ajustes Saldo', '12': 'Cedidos', '13': 'Descontos',
                            '14': 'Devoluções', '15': 'Glosas', '16': 'Empenhos', '17': 'Repasses',
                            '18': 'Rel. Atividades', '19': 'Dados Gerais', '20': 'Responsáveis', '21': 'Declarações',
                            '22': 'Rel. Governo', '23': 'Dem. Contábeis', '24': 'Pub. Atas', '25': 'Prest. Entidade',
                            '26': 'Parecer', '27': 'Transparência'
                        };

                        return (
                            <button 
                                key={id}
                                onClick={() => onNavigate(id)}
                                className={`p-3 rounded border text-left transition-all ${statusColor} relative group`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-xs uppercase tracking-wide opacity-70">Bloco {id}</span>
                                    <span>{icon}</span>
                                </div>
                                <div className="font-semibold text-sm mt-1 truncate">
                                    {labels[id]}
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

export const DashboardNew: React.FC = () => {
    return <PrestacaoContasForm />;
};

export default Dashboard;