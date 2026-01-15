
import { PrestacaoContas } from '../schemas/type-definitions';

export interface SectionStatus {
    id: string;
    status: 'valid' | 'invalid' | 'empty' | 'partial';
    errors: string[];
}

/**
 * Valida uma seção específica usando chaves semânticas da Nova Arquitetura
 */
export function validateSection(sectionKey: string, data: PrestacaoContas): string[] {
    const errors: string[] = [];

    switch (sectionKey) {
        // --- SEÇÃO 1 ---
        case 'descritor':
            if (!data.descritor.municipio) errors.push("Município é obrigatório.");
            if (!data.descritor.entidade) errors.push("Código da Entidade é obrigatório.");
            if (!data.descritor.ano) errors.push("Ano é obrigatório.");
            if (!data.descritor.mes) errors.push("Mês é obrigatório.");
            break;
        
        case 'codigo_ajuste':
            if (!data.codigo_ajuste) errors.push("Código do Ajuste é obrigatório.");
            break;

        case 'dados_gerais':
            if (!data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_dados_gerais) errors.push("Certidão de Dados Gerais obrigatória.");
            if (!data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_corpo_diretivo) errors.push("Certidão de Corpo Diretivo obrigatória.");
            break;

        case 'responsaveis':
            if (!data.responsaveis_membros_orgao_concessor?.identificacao_certidao_responsaveis) errors.push("Certidão de Responsáveis obrigatória.");
            break;

        // --- SEÇÃO 2 ---
        case 'empenhos':
            data.empenhos?.forEach((emp, i) => {
                 if(!emp.numero) errors.push(`Empenho #${i+1}: Número obrigatório.`);
                 if(emp.valor <= 0) errors.push(`Empenho #${i+1}: Valor inválido.`);
            });
            break;

        case 'contratos':
            data.contratos?.forEach((ctr, i) => {
                if (!ctr.numero) errors.push(`Contrato #${i+1}: Número obrigatório.`);
                if (!ctr.credor?.documento_numero) errors.push(`Contrato #${i+1}: Credor obrigatório.`);
                if (ctr.valor_montante <= 0) errors.push(`Contrato #${i+1}: Valor deve ser positivo.`);
                
                if (ctr.vigencia_data_inicial && ctr.vigencia_data_final) {
                    if (new Date(ctr.vigencia_data_inicial) > new Date(ctr.vigencia_data_final)) {
                        errors.push(`Contrato #${i+1}: Data final de vigência anterior à inicial.`);
                    }
                }
            });
            break;

        case 'documentos_fiscais':
            data.documentos_fiscais?.forEach((doc, i) => {
                if (!doc.numero) errors.push(`Doc. Fiscal #${i+1}: Número obrigatório.`);
                if (doc.valor_bruto <= 0) errors.push(`Doc. Fiscal #${i+1}: Valor deve ser positivo.`);
                if (!doc.credor?.documento_numero) errors.push(`Doc. Fiscal #${i+1}: Credor obrigatório.`);
                if (!doc.data_emissao) errors.push(`Doc. Fiscal #${i+1}: Data emissão obrigatória.`);
            });
            break;

        case 'pagamentos':
            data.pagamentos?.forEach((pag, i) => {
                if (!pag.pagamento_data) errors.push(`Pagamento #${i+1}: Data obrigatória.`);
                if (pag.pagamento_valor <= 0) errors.push(`Pagamento #${i+1}: Valor deve ser positivo.`);
                
                // Cross-check: Pagamento vs Documento Fiscal
                if (data.documentos_fiscais && pag.identificacao_documento_fiscal?.numero) {
                    const doc = data.documentos_fiscais.find(d => d.numero === pag.identificacao_documento_fiscal.numero);
                    if (!doc) {
                        errors.push(`Pagamento #${i+1}: Nota Fiscal vinculada (${pag.identificacao_documento_fiscal.numero}) não encontrada.`);
                    } else if (doc.data_emissao && pag.pagamento_data) {
                        if (new Date(pag.pagamento_data) < new Date(doc.data_emissao)) {
                            errors.push(`Pagamento #${i+1}: Data do pagamento anterior à emissão da nota.`);
                        }
                    }
                }
            });
            break;

        case 'repasses':
            data.repasses?.forEach((rep, i) => {
                if(!rep.valor_repasse || rep.valor_repasse <= 0) errors.push(`Repasse #${i+1}: Valor inválido.`);
                if(!rep.data_repasse) errors.push(`Repasse #${i+1}: Data obrigatória.`);
            });
            break;
        
        case 'disponibilidades':
            data.disponibilidades?.saldos.forEach((saldo, i) => {
                if(!saldo.conta) errors.push(`Saldo #${i+1}: Conta obrigatória.`);
                if(!saldo.banco) errors.push(`Saldo #${i+1}: Banco obrigatório.`);
            });
            break;

        // --- SEÇÃO 3 ---
        case 'relatorio_atividades':
            if (data.relatorio_atividades?.programas) {
                if (data.relatorio_atividades.programas.length === 0) errors.push("Pelo menos um Programa deve ser cadastrado.");
                data.relatorio_atividades.programas.forEach((prog, pIdx) => {
                    if (!prog.nome_programa) errors.push(`Programa #${pIdx+1}: Nome obrigatório.`);
                    prog.metas.forEach((meta, mIdx) => {
                        if (!meta.codigo_meta) errors.push(`Programa #${pIdx+1}, Meta #${mIdx+1}: Código obrigatório.`);
                        if (!meta.meta_atendida && !meta.justificativa) errors.push(`Programa #${pIdx+1}, Meta #${mIdx+1}: Justificativa obrigatória para meta não atendida.`);
                    });
                });
            } else {
                errors.push("Relatório de atividades vazio.");
            }
            break;

        case 'relatorio_gov':
             if (data.relatorio_governamental_analise_execucao?.houve_emissao_relatorio_final === undefined) {
                 errors.push("Informe se houve emissão de relatório governamental.");
             }
             break;

        // --- SEÇÃO 4 ---
        case 'relacao_empregados':
            data.relacao_empregados?.forEach((emp, i) => {
                if (!emp.cpf || emp.cpf.length !== 11) errors.push(`Empregado #${i+1}: CPF inválido.`);
                if (!emp.data_admissao) errors.push(`Empregado #${i+1}: Data de admissão obrigatória.`);
                if (!emp.periodos_remuneracao || emp.periodos_remuneracao.length === 0) {
                     errors.push(`Empregado #${i+1}: Deve ter ao menos um período de remuneração.`);
                }
            });
            break;

        case 'servidores_cedidos':
            data.servidores_cedidos?.forEach((serv, i) => {
                if(!serv.cpf) errors.push(`Servidor #${i+1}: CPF obrigatório.`);
            });
            break;

        case 'relacao_bens':
            // Valida apenas se houver itens
            const bens = data.relacao_bens?.relacao_bens_moveis_adquiridos;
            bens?.forEach((bem, i) => {
                if(!bem.numero_patrimonio) errors.push(`Bem #${i+1}: Nº Patrimônio obrigatório.`);
            });
            break;

        // --- SEÇÃO 5 ---
        case 'demonstracoes':
             if (!data.demonstracoes_contabeis?.responsavel?.cpf) errors.push("CPF do Responsável Técnico obrigatório.");
             break;

        // --- SEÇÃO 6 ---
        case 'declaracoes':
            const dec = data.declaracoes;
            if (dec?.houve_contratacao_empresas_pertencentes && (!dec.empresas_pertencentes || dec.empresas_pertencentes.length === 0)) {
                errors.push("Lista de empresas pertencentes obrigatória.");
            }
            break;

        case 'transparencia':
            const transp = data.transparencia;
            if (transp?.entidade_beneficiaria_mantem_sitio_internet) {
                if (!transp.sitios_internet || transp.sitios_internet.length === 0 || transp.sitios_internet.some(s => !s.trim())) {
                    errors.push("Informe a URL do sítio.");
                }
            }
            break;

        case 'parecer':
            if (!data.parecer_conclusivo?.identificacao_parecer) errors.push("Identificação do Parecer Conclusivo obrigatória.");
            break;
    }

    return errors;
}

/**
 * Retorna o status de validação de TODAS as seções para o Dashboard/Sidebar
 */
export function getAllSectionsStatus(data: PrestacaoContas): Record<string, SectionStatus> {
    const statusMap: Record<string, SectionStatus> = {};
    
    const sections = [
        'descritor', 'codigo_ajuste', 'dados_gerais', 'responsaveis',
        'empenhos', 'contratos', 'documentos_fiscais', 'pagamentos', 'repasses', 'receitas', 'glosas', 'ajustes_saldo', 'descontos', 'devolucoes', 'disponibilidades',
        'relatorio_atividades', 'relatorio_gov',
        'relacao_empregados', 'servidores_cedidos', 'relacao_bens',
        'demonstracoes', 'publicacoes',
        'declaracoes', 'transparencia', 'parecer'
    ];

    sections.forEach(id => {
        const errors = validateSection(id, data);
        let status: SectionStatus['status'] = 'valid';
        
        const isEmpty = checkSectionEmpty(id, data);
        
        if (errors.length > 0) {
            status = 'invalid';
        } else if (isEmpty) {
            // Seções obrigatórias que não podem ficar vazias
            const mandatory = ['descritor', 'codigo_ajuste', 'dados_gerais', 'responsaveis', 'relatorio_atividades', 'declaracoes', 'parecer', 'transparencia'];
            if (mandatory.includes(id)) {
                status = 'invalid';
            } else {
                status = 'empty';
            }
        }

        statusMap[id] = { id, status, errors };
    });

    return statusMap;
}

// Verifica se a seção tem dados preenchidos
function checkSectionEmpty(id: string, data: PrestacaoContas): boolean {
    switch(id) {
        case 'descritor': return !data.descritor.municipio;
        case 'codigo_ajuste': return !data.codigo_ajuste;
        case 'relacao_empregados': return (!data.relacao_empregados || data.relacao_empregados.length === 0);
        case 'contratos': return (!data.contratos || data.contratos.length === 0);
        case 'documentos_fiscais': return (!data.documentos_fiscais || data.documentos_fiscais.length === 0);
        case 'pagamentos': return (!data.pagamentos || data.pagamentos.length === 0);
        case 'empenhos': return (!data.empenhos || data.empenhos.length === 0);
        case 'relatorio_atividades': return (!data.relatorio_atividades?.programas || data.relatorio_atividades.programas.length === 0);
        case 'dados_gerais': return !data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_dados_gerais;
        case 'declaracoes': return !data.declaracoes;
        default: return false; // Assumir preenchido se não checado explicitamente
    }
}

export function validatePrestacaoContas(data: PrestacaoContas): string[] {
    const status = getAllSectionsStatus(data);
    const allErrors: string[] = [];
    Object.values(status).forEach(s => {
        if (s.status === 'invalid') {
            s.errors.forEach(e => allErrors.push(`[${s.id}] ${e}`));
        }
    });
    return allErrors;
}

export function validateConsistency(data: PrestacaoContas): string[] {
    return []; // Implementar regras de consistência contábil aqui se necessário
}
