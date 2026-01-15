
import React from 'react';
import { PrestacaoContas } from '../types';
import { CLS, SectionHeader } from './ui/BlockBase';
import { ConferenceReport } from './ConferenceReport'; // Importante

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

    switch (activeSection) {
        // --- Header / Initial ---
        case '1': return <DescritorBlock data={formData} updateField={updateField} />;
        case '2': return <CodigoAjusteBlock data={formData} updateField={updateField} />;
        case '3': return <RetificacaoBlock data={formData} updateField={updateField} />;

        // --- Core Business (Arrays) ---
        case '4': return <EmpregadosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('relacao_empregados', idx, f, v)} onAdd={(item: any) => addItem('relacao_empregados', item)} onRemove={(idx: number) => removeItem('relacao_empregados', idx)} />;
        case '5': return <BensBlock data={formData} onUpdate={updateField} onAdd={updateField} onRemove={()=>{}} />; 
        case '6': return <ContratosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('contratos', idx, f, v)} onAdd={(item: any) => addItem('contratos', item)} onRemove={(idx: number) => removeItem('contratos', idx)} />;
        case '7': return <DocsFiscaisBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('documentos_fiscais', idx, f, v)} onAdd={(item: any) => addItem('documentos_fiscais', item)} onRemove={(idx: number) => removeItem('documentos_fiscais', idx)} />;
        case '8': return <PagamentosBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('pagamentos', idx, f, v)} onAdd={(item: any) => addItem('pagamentos', item)} onRemove={(idx: number) => removeItem('pagamentos', idx)} />;
        
        // --- Financial & Adjustments ---
        case '9': return <DisponibilidadesBlock data={formData} onUpdate={updateField} onAdd={updateField} onRemove={()=>{}} />;
        case '10': return <ReceitasBlock data={formData} onUpdate={updateField} onAdd={updateField} onRemove={()=>{}} />;
        case '11': return <AjustesSaldoBlock data={formData} onUpdate={updateField} onAdd={(v:any, path: string) => updateField(path, v)} onRemove={()=>{}} />;
        case '12': return <ServidoresCedidosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('servidores_cedidos', idx, f, v)} onAdd={(item: any) => addItem('servidores_cedidos', item)} onRemove={(idx: number) => removeItem('servidores_cedidos', idx)} />;
        case '13': return <DescontosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('descontos', idx, f, v)} onAdd={(item: any) => addItem('descontos', item)} onRemove={(idx: number) => removeItem('descontos', idx)} />;
        case '14': return <DevolucoesBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('devolucoes', idx, f, v)} onAdd={(item: any) => addItem('devolucoes', item)} onRemove={(idx: number) => removeItem('devolucoes', idx)} />;
        case '15': return <GlosasBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('glosas', idx, f, v)} onAdd={(item: any) => addItem('glosas', item)} onRemove={(idx: number) => removeItem('glosas', idx)} />;
        case '16': return <EmpenhosBlock data={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('empenhos', idx, f, v)} onAdd={(item: any) => addItem('empenhos', item)} onRemove={(idx: number) => removeItem('empenhos', idx)} />;
        case '17': return <RepassesBlock data={formData} fullData={formData} onUpdate={(idx: number, f: string, v: any) => updateItem('repasses', idx, f, v)} onAdd={(item: any) => addItem('repasses', item)} onRemove={(idx: number) => removeItem('repasses', idx)} />;

        // --- Activities & Reports ---
        case '18': return <RelatorioAtividadesBlock data={formData} updateField={updateField} />;
        case '22': return <RelatorioGovBlock data={formData} updateField={updateField} />;
        case '23': return <DemonstracoesContabeisBlock data={formData} updateField={updateField} />;
        case '24': return <PublicacoesAtaBlock data={formData} updateField={updateField} />;
        case '25': return <PrestacaoBeneficiariaBlock data={formData} updateField={updateField} />;
        case '26': return <ParecerConclusivoBlock data={formData} updateField={updateField} />;
        case '27': return <TransparencyBlock data={formData} updateField={updateField} />;

        // --- Administrative & Declarations ---
        case '19': return <DadosGeraisBlock data={formData} updateField={updateField} />;
        case '20': return <ResponsaveisBlock data={formData} updateField={updateField} />;
        case '21': return <DeclaracoesBlock data={formData} updateField={updateField} />;
        
        // --- Report / Review ---
        case 'preview':
            return <ConferenceReport data={formData} onDownloadJson={handleDownload} />;

        default:
            return (
                <div className={CLS.SECTION}>
                    <SectionHeader title={`Seção ${activeSection}`} />
                    <p className="text-slate-500">Bloco {activeSection} ainda não implementado na UI.</p>
                </div>
            );
    }
};
