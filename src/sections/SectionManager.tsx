import React from 'react';
import { PrestacaoContas } from '../schemas/type-definitions';
import { SectionHeader } from '../components/ui/BlockBase';
import { ConferenceReport } from '../components/ConferenceReport';
import * as Blocks from '../blocks/index';

interface SectionManagerProps {
    activeSection: string;
    formData: PrestacaoContas;
    updateField: (path: string, value: any) => void;
    updateItem: (path: string, index: number, field: string, value: any) => void;
    addItem: (path: string, item: any) => void;
    removeItem: (path: string, index: number) => void;
    onDownload: () => void;
}

export const SectionManager: React.FC<SectionManagerProps> = (props) => {
    const { activeSection, formData, updateField, updateItem, addItem, removeItem } = props;

    // Helper props for standard array blocks (Contratos, Pagamentos, etc.)
    // These blocks expect onAdd(item) and handle the path internally via the closure 'key'
    const arrayProps = (key: string) => ({
        data: formData,
        fullData: formData, // For cross-linking
        onUpdate: (idx: number, f: string, v: any) => updateItem(key, idx, f, v),
        onAdd: (item: any) => addItem(key, item),
        onRemove: (idx: number) => removeItem(key, idx)
    });

    // Helper props for singleton blocks (Descritor, Dados Gerais, etc.)
    const singleProps = {
        data: formData,
        updateField: updateField
    };

    // Helper props for Complex Blocks (Ajustes, Disponibilidades, Receitas, Bens)
    // These blocks manage multiple sub-arrays or nested logic.
    // CRITICAL FIX: The block calls onAdd(newValue, pathString).
    // We must adapt this to call updateField(pathString, newValue).
    const complexProps = {
        data: formData,
        fullData: formData,
        onUpdate: updateField, // updateField(path, value) matches block's onUpdate(path, value)
        onAdd: (val: any, path: string) => updateField(path, val), // Adapter: swaps args for updateField
        onRemove: () => {} // Remove logic is handled internally by updateField in these complex blocks
    };

    switch (activeSection) {
        // --- SEÇÃO 1 ---
        case 'descritor': return <Blocks.Descritor {...singleProps} />;
        case 'codigo_ajuste': return <Blocks.CodigoAjuste {...singleProps} />;
        case 'dados_gerais': return <Blocks.DadosGerais {...singleProps} />;
        case 'prestacao_benef': return <Blocks.PrestacaoBeneficiaria {...singleProps} />;
        case 'responsaveis': return <Blocks.Responsaveis {...singleProps} />;

        // --- SEÇÃO 2 ---
        case 'empenhos': return <Blocks.Empenhos {...arrayProps('empenhos')} />;
        case 'repasses': return <Blocks.Repasses {...arrayProps('repasses')} />;
        
        // Complex Blocks (Must use complexProps to fix path.split error)
        case 'receitas': return <Blocks.Receitas {...complexProps} />;
        case 'disponibilidades': return <Blocks.Disponibilidades {...complexProps} />;
        case 'ajustes_saldo': return <Blocks.AjustesSaldo {...complexProps} />;

        // Standard Array Blocks
        case 'contratos': return <Blocks.Contratos {...arrayProps('contratos')} />;
        case 'documentos_fiscais': return <Blocks.DocumentosFiscais {...arrayProps('documentos_fiscais')} />;
        case 'pagamentos': return <Blocks.Pagamentos {...arrayProps('pagamentos')} />;
        case 'glosas': return <Blocks.Glosas {...arrayProps('glosas')} />;
        case 'descontos': return <Blocks.Descontos {...arrayProps('descontos')} />;
        case 'devolucoes': return <Blocks.Devolucoes {...arrayProps('devolucoes')} />;

        // --- SEÇÃO 3 ---
        case 'relatorio_atividades': return <Blocks.RelatorioAtividades {...singleProps} />;
        case 'relatorio_gov': return <Blocks.RelatorioGov {...singleProps} />;

        // --- SEÇÃO 4 ---
        case 'relacao_empregados': return <Blocks.Empregados {...arrayProps('relacao_empregados')} />;
        case 'servidores_cedidos': return <Blocks.ServidoresCedidos {...arrayProps('servidores_cedidos')} />;
        // Bens behaves like a complex block (nested logic)
        case 'relacao_bens': return <Blocks.Bens {...complexProps} />;

        // --- SEÇÃO 5 ---
        case 'demonstracoes': return <Blocks.DemonstracoesContabeis {...singleProps} />;
        case 'publicacoes': return <Blocks.Publicacoes {...singleProps} />;

        // --- SEÇÃO 6 ---
        case 'declaracoes': return <Blocks.Declaracoes {...singleProps} />;
        case 'transparencia': return <Blocks.Transparencia {...singleProps} />;
        case 'parecer': return <Blocks.Parecer {...singleProps} />;

        case 'preview':
            return <ConferenceReport data={formData} onDownloadJson={props.onDownload} />;

        default:
            return (
                <div className="p-8 text-center text-slate-500">
                    <SectionHeader title="Seção não encontrada" />
                    <p>Selecione um item no menu lateral.</p>
                </div>
            );
    }
};