
import React from 'react';
import { PrestacaoContas } from '../types';
import { CLS, SectionHeader } from './ui/BlockBase';
import { ConferenceReport } from './ConferenceReport';

// Header Blocks
import { DescritorBlock, CodigoAjusteBlock, RetificacaoBlock } from './blocks/HeaderBlocks';
// Finance Blocks
import { ContratosBlock, DocsFiscaisBlock, PagamentosBlock } from './blocks/FinanceBlocks';
// HR Blocks
import { EmpregadosBlock, ServidoresCedidosBlock } from './blocks/HRBlocks';
// Adjustment Blocks
import { AjustesSaldoBlock, RepassesBlock } from './blocks/AdjustmentBlocks';
// Standard Array Blocks
import { BensBlock, DisponibilidadesBlock, ReceitasBlock, DescontosBlock, DevolucoesBlock, GlosasBlock, EmpenhosBlock } from './blocks/StandardArrayBlocks';
// Activity & Reports
import { RelatorioAtividadesBlock } from './blocks/ActivityReportsBlock';
import { ParecerConclusivoBlock, DemonstracoesContabeisBlock } from './blocks/ReportBlocks';
import { RelatorioGovBlock, PublicacoesAtaBlock, PrestacaoBeneficiariaBlock } from './blocks/FinalizationBlocks';
// General & Transparency
import { DadosGeraisBlock, ResponsaveisBlock, DeclaracoesBlock } from './blocks/GeneralDataBlocks';
import { TransparencyBlock } from './blocks/TransparencyBlock';

interface FormSectionsProps {
    activeSection: string;
    formData: PrestacaoContas;
    updateField: (path: string, value: any) => void;
    updateItem: (path: string, index: number, field: string, value: any) => void;
    addItem: (path: string, item: any) => void;
    removeItem: (path: string, index: number) => void;
    handleExtraction: (section: string, data: any) => void;
    handleDownload: () => void;
}

export const FormSections: React.FC<FormSectionsProps> = ({
    activeSection,
    formData,
    updateField,
    updateItem,
    addItem,
    removeItem,
    handleDownload
}) => {

    // ADAPTER: Complex blocks (Bens, Receitas, Disponibilidades, Ajustes) emit onAdd(value, path).
    // App.updateField expects (path, value). We must swap them to prevent 'path.split is not a function'.
    const handleComplexAdd = (value: any, path: string) => {
        if (typeof path === 'string') {
            updateField(path, value);
        } else {
            console.error("Critical: handleComplexAdd received invalid path:", path);
        }
    };

    switch (activeSection) {
        // --- SEÇÃO 1: IDENTIFICAÇÃO ---
        case 'descritor': 
        case '1': return <DescritorBlock data={formData} updateField={updateField} />;
        
        case 'codigo_ajuste':
        case '2': return <CodigoAjusteBlock data={formData} updateField={updateField} />;
        
        case 'retificacao':
        case '3': return <RetificacaoBlock data={formData} updateField={updateField} />;

        case 'dados_gerais':
        case '19': return <DadosGeraisBlock data={formData} updateField={updateField} />;
        
        case 'prestacao_benef':
        case '25': return <PrestacaoBeneficiariaBlock data={formData} updateField={updateField} />;
        
        case 'responsaveis':
        case '20': return <ResponsaveisBlock data={formData} updateField={updateField} />;

        // --- SEÇÃO 2: FINANCEIRO ---
        case 'empenhos':
        case '16': return <EmpenhosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('empenhos', idx, f, v)} onAdd={(item: any) => addItem('empenhos', item)} onRemove={(idx: number) => removeItem('empenhos', idx)} />;
        
        case 'repasses':
        case '17': return <RepassesBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('repasses', idx, f, v)} onAdd={(item: any) => addItem('repasses', item)} onRemove={(idx: number) => removeItem('repasses', idx)} />;
        
        // COMPLEX BLOCK (Usa Adapter)
        case 'receitas':
        case '10': return <ReceitasBlock data={formData} onUpdate={updateField} onAdd={handleComplexAdd} onRemove={()=>{}} />;
        
        case 'contratos':
        case '6': return <ContratosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('contratos', idx, f, v)} onAdd={(item: any) => addItem('contratos', item)} onRemove={(idx: number) => removeItem('contratos', idx)} />;
        
        case 'documentos_fiscais':
        case '7': return <DocsFiscaisBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('documentos_fiscais', idx, f, v)} onAdd={(item: any) => addItem('documentos_fiscais', item)} onRemove={(idx: number) => removeItem('documentos_fiscais', idx)} />;
        
        case 'pagamentos':
        case '8': return <PagamentosBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('pagamentos', idx, f, v)} onAdd={(item: any) => addItem('pagamentos', item)} onRemove={(idx: number) => removeItem('pagamentos', idx)} />;
        
        case 'glosas':
        case '15': return <GlosasBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('glosas', idx, f, v)} onAdd={(item: any) => addItem('glosas', item)} onRemove={(idx: number) => removeItem('glosas', idx)} />;
        
        // COMPLEX BLOCK (Usa Adapter)
        case 'ajustes_saldo':
        case '11': return <AjustesSaldoBlock data={formData} onUpdate={updateField} onAdd={handleComplexAdd} onRemove={()=>{}} />;
        
        case 'descontos':
        case '13': return <DescontosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('descontos', idx, f, v)} onAdd={(item: any) => addItem('descontos', item)} onRemove={(idx: number) => removeItem('descontos', idx)} />;
        
        case 'devolucoes':
        case '14': return <DevolucoesBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('devolucoes', idx, f, v)} onAdd={(item: any) => addItem('devolucoes', item)} onRemove={(idx: number) => removeItem('devolucoes', idx)} />;
        
        // COMPLEX BLOCK (Usa Adapter)
        case 'disponibilidades':
        case '9': return <DisponibilidadesBlock data={formData} onUpdate={updateField} onAdd={handleComplexAdd} onRemove={()=>{}} />;

        // --- SEÇÃO 3: RELATÓRIOS ---
        case 'relatorio_atividades':
        case '18': return <RelatorioAtividadesBlock data={formData} updateField={updateField} />;
        
        case 'relatorio_gov':
        case '22': return <RelatorioGovBlock data={formData} updateField={updateField} />;

        // --- SEÇÃO 4: EMPREGADOS E BENS ---
        case 'relacao_empregados':
        case '4': return <EmpregadosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('relacao_empregados', idx, f, v)} onAdd={(item: any) => addItem('relacao_empregados', item)} onRemove={(idx: number) => removeItem('relacao_empregados', idx)} />;
        
        case 'servidores_cedidos':
        case '12': return <ServidoresCedidosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('servidores_cedidos', idx, f, v)} onAdd={(item: any) => addItem('servidores_cedidos', item)} onRemove={(idx: number) => removeItem('servidores_cedidos', idx)} />;
        
        // COMPLEX BLOCK (Usa Adapter)
        case 'relacao_bens':
        case '5': return <BensBlock data={formData} onUpdate={updateField} onAdd={handleComplexAdd} onRemove={()=>{}} />; 

        // --- SEÇÃO 5: PUBLICAÇÕES ---
        case 'demonstracoes':
        case '23': return <DemonstracoesContabeisBlock data={formData} updateField={updateField} />;
        
        case 'publicacoes':
        case '24': return <PublicacoesAtaBlock data={formData} updateField={updateField} />;

        // --- SEÇÃO 6: DECLARAÇÕES ---
        case 'declaracoes':
        case '21': return <DeclaracoesBlock data={formData} updateField={updateField} />;
        
        case 'transparencia':
        case '27': return <TransparencyBlock data={formData} updateField={updateField} />;
        
        case 'parecer':
        case '26': return <ParecerConclusivoBlock data={formData} updateField={updateField} />;

        // --- Report / Review ---
        case 'preview':
            return <ConferenceReport data={formData} onDownloadJson={handleDownload} />;

        case 'dashboard':
            return (
                <div className={CLS.SECTION}>
                    <SectionHeader title="Dashboard" />
                    <p className="text-slate-500">Visão geral do preenchimento.</p>
                </div>
            );

        default:
            return (
                <div className={CLS.SECTION}>
                    <SectionHeader title={`Seção ${activeSection}`} />
                    <p className="text-slate-500">Selecione uma seção no menu lateral.</p>
                </div>
            );
    }
};
