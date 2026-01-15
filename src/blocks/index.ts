
// This file aggregates all blocks and maps them to the new semantic structure.
// In a full refactor, these would be separate files in folders like src/blocks/Financeiro/Contratos.tsx
// For now, we re-export the existing components but structured logically.

import { DescritorBlock, CodigoAjusteBlock } from '../components/blocks/HeaderBlocks';
import { DadosGeraisBlock, ResponsaveisBlock, DeclaracoesBlock } from '../components/blocks/GeneralDataBlocks';
import { ContratosBlock, DocsFiscaisBlock, PagamentosBlock } from '../components/blocks/FinanceBlocks';
import { EmpregadosBlock, ServidoresCedidosBlock } from '../components/blocks/HRBlocks';
import { BensBlock, DisponibilidadesBlock, ReceitasBlock, DescontosBlock, DevolucoesBlock, GlosasBlock, EmpenhosBlock } from '../components/blocks/StandardArrayBlocks';
import { AjustesSaldoBlock, RepassesBlock } from '../components/blocks/AdjustmentBlocks';
import { RelatorioAtividadesBlock } from '../components/blocks/ActivityReportsBlock';
import { RelatorioGovBlock, PublicacoesAtaBlock, PrestacaoBeneficiariaBlock } from '../components/blocks/FinalizationBlocks';
import { ParecerConclusivoBlock, DemonstracoesContabeisBlock } from '../components/blocks/ReportBlocks';
import { TransparencyBlock } from '../components/blocks/TransparencyBlock';

// SEÇÃO 1
export const Descritor = DescritorBlock;
export const CodigoAjuste = CodigoAjusteBlock;
export const DadosGerais = DadosGeraisBlock;
export const PrestacaoBeneficiaria = PrestacaoBeneficiariaBlock;
export const Responsaveis = ResponsaveisBlock;

// SEÇÃO 2
export const Empenhos = EmpenhosBlock;
export const Repasses = RepassesBlock;
export const Receitas = ReceitasBlock;
export const Contratos = ContratosBlock;
export const DocumentosFiscais = DocsFiscaisBlock;
export const Pagamentos = PagamentosBlock;
export const Glosas = GlosasBlock;
export const AjustesSaldo = AjustesSaldoBlock;
export const Descontos = DescontosBlock;
export const Devolucoes = DevolucoesBlock;
export const Disponibilidades = DisponibilidadesBlock;

// SEÇÃO 3
export const RelatorioAtividades = RelatorioAtividadesBlock;
export const RelatorioGov = RelatorioGovBlock;

// SEÇÃO 4
export const Empregados = EmpregadosBlock;
export const ServidoresCedidos = ServidoresCedidosBlock;
export const Bens = BensBlock;

// SEÇÃO 5
export const DemonstracoesContabeis = DemonstracoesContabeisBlock;
export const Publicacoes = PublicacoesAtaBlock;

// SEÇÃO 6
export const Declaracoes = DeclaracoesBlock;
export const Transparencia = TransparencyBlock;
export const Parecer = ParecerConclusivoBlock;
