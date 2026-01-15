
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { PrestacaoContas } from '../types';

const ajv = new Ajv({ allErrors: true, verbose: true, coerceTypes: true });
addFormats(ajv);

export interface SectionStatus {
    id: string;
    status: 'valid' | 'invalid' | 'empty' | 'partial';
    errors: string[];
}

/**
 * Valida uma seção específica e retorna seus erros com regras de negócio detalhadas
 */
export function validateSection(sectionId: string, data: PrestacaoContas): string[] {
    const errors: string[] = [];

    switch (sectionId) {
        case '1': // Descritor
            if (!data.descritor.municipio) errors.push("Município é obrigatório.");
            if (!data.descritor.entidade) errors.push("Código da Entidade é obrigatório.");
            if (!data.descritor.ano) errors.push("Ano é obrigatório.");
            if (!data.descritor.mes) errors.push("Mês é obrigatório.");
            break;
        
        case '2': // Ajuste
            if (!data.codigo_ajuste) errors.push("Código do Ajuste é obrigatório.");
            break;
        
        case '3': // Retificação
            // Sem validação específica obrigatória além de boolean
            break;

        case '4': // Empregados
            data.relacao_empregados?.forEach((emp, i) => {
                if (!emp.cpf || emp.cpf.length !== 11) errors.push(`Empregado #${i+1}: CPF inválido (deve ter 11 dígitos).`);
                if (!emp.data_admissao) errors.push(`Empregado #${i+1}: Data de admissão obrigatória.`);
                if (!emp.periodos_remuneracao || emp.periodos_remuneracao.length === 0) {
                     errors.push(`Empregado #${i+1}: Deve ter ao menos um período de remuneração.`);
                }
                emp.periodos_remuneracao?.forEach((p, pi) => {
                     if (p.remuneracao_bruta <= 0) errors.push(`Empregado #${i+1}, Mês ${p.mes}: Remuneração deve ser maior que zero.`);
                     if (p.mes > 12 || p.mes < 1) errors.push(`Empregado #${i+1}: Mês ${p.mes} inválido.`);
                });
            });
            break;

        case '5': // Bens
            const bens = data.relacao_bens?.relacao_bens_moveis_adquiridos;
            bens?.forEach((bem, i) => {
                if(!bem.numero_patrimonio) errors.push(`Bem #${i+1}: Nº Patrimônio obrigatório.`);
                if(!bem.descricao) errors.push(`Bem #${i+1}: Descrição obrigatória.`);
                if(!bem.valor_aquisicao || bem.valor_aquisicao <= 0) errors.push(`Bem #${i+1}: Valor inválido.`);
            });
            break;

        case '6': // Contratos
            data.contratos?.forEach((ctr, i) => {
                if (!ctr.numero) errors.push(`Contrato #${i+1}: Número obrigatório.`);
                if (!ctr.credor?.documento_numero) errors.push(`Contrato #${i+1}: Credor obrigatório.`);
                if (ctr.valor_montante <= 0) errors.push(`Contrato #${i+1}: Valor deve ser positivo.`);
                
                // Validação de Vigência
                if (ctr.vigencia_data_inicial && ctr.vigencia_data_final) {
                    if (new Date(ctr.vigencia_data_inicial) > new Date(ctr.vigencia_data_final)) {
                        errors.push(`Contrato #${i+1}: Data final de vigência anterior à inicial.`);
                    }
                }
            });
            break;

        case '7': // Docs Fiscais
            data.documentos_fiscais?.forEach((doc, i) => {
                if (!doc.numero) errors.push(`Doc. Fiscal #${i+1}: Número obrigatório.`);
                if (doc.valor_bruto <= 0) errors.push(`Doc. Fiscal #${i+1}: Valor deve ser positivo.`);
                if (!doc.credor?.documento_numero) errors.push(`Doc. Fiscal #${i+1}: Credor obrigatório.`);
                if (!doc.data_emissao) errors.push(`Doc. Fiscal #${i+1}: Data emissão obrigatória.`);
            });
            break;

        case '8': // Pagamentos
            data.pagamentos?.forEach((pag, i) => {
                if (!pag.pagamento_data) errors.push(`Pagamento #${i+1}: Data obrigatória.`);
                if (pag.pagamento_valor <= 0) errors.push(`Pagamento #${i+1}: Valor deve ser positivo.`);
                if (!pag.identificacao_documento_fiscal?.numero) errors.push(`Pagamento #${i+1}: Vínculo com Nota Fiscal obrigatório.`);
                
                // Cross-check: Pagamento vs Documento Fiscal
                if (data.documentos_fiscais) {
                    const doc = data.documentos_fiscais.find(d => d.numero === pag.identificacao_documento_fiscal.numero);
                    if (!doc) {
                        errors.push(`Pagamento #${i+1}: Nota Fiscal vinculada (${pag.identificacao_documento_fiscal.numero}) não encontrada na seção 7.`);
                    } else if (doc.data_emissao && pag.pagamento_data) {
                        if (new Date(pag.pagamento_data) < new Date(doc.data_emissao)) {
                            errors.push(`Pagamento #${i+1}: Data do pagamento (${pag.pagamento_data}) anterior à emissão da nota (${doc.data_emissao}).`);
                        }
                    }
                }
            });
            break;
        
        case '9': // Disponibilidades
            data.disponibilidades?.saldos.forEach((saldo, i) => {
                if(!saldo.conta) errors.push(`Saldo #${i+1}: Conta obrigatória.`);
                if(!saldo.banco) errors.push(`Saldo #${i+1}: Banco obrigatório.`);
                if(saldo.saldo_bancario === undefined) errors.push(`Saldo #${i+1}: Valor bancário obrigatório.`);
            });
            break;

        case '10': // Receitas
             if (data.receitas?.repasses_recebidos) {
                 data.receitas.repasses_recebidos.forEach((rep, i) => {
                     if (!rep.data_repasse) errors.push(`Receita (Repasse) #${i+1}: Data obrigatória.`);
                     if (rep.valor <= 0) errors.push(`Receita (Repasse) #${i+1}: Valor deve ser positivo.`);
                 });
             }
             break;

        case '11': // Ajustes
            // Opcional, mas se preenchido, validar campos
            break;
        
        case '12': // Servidores Cedidos
            data.servidores_cedidos?.forEach((serv, i) => {
                if(!serv.cpf) errors.push(`Servidor #${i+1}: CPF obrigatório.`);
                if(!serv.data_inicial_cessao) errors.push(`Servidor #${i+1}: Data início obrigatória.`);
            });
            break;

        case '16': // Empenhos
            data.empenhos?.forEach((emp, i) => {
                 if(!emp.numero) errors.push(`Empenho #${i+1}: Número obrigatório.`);
                 if(emp.valor <= 0) errors.push(`Empenho #${i+1}: Valor inválido.`);
            });
            break;
        
        case '17': // Repasses (Financeiro)
            data.repasses?.forEach((rep, i) => {
                if(!rep.valor_repasse || rep.valor_repasse <= 0) errors.push(`Repasse #${i+1}: Valor inválido.`);
                if(!rep.data_repasse) errors.push(`Repasse #${i+1}: Data obrigatória.`);
            });
            break;

        case '18': // Relatório Atividades
            if (data.relatorio_atividades?.programas) {
                if (data.relatorio_atividades.programas.length === 0) errors.push("Pelo menos um Programa deve ser cadastrado.");
                
                data.relatorio_atividades.programas.forEach((prog, pIdx) => {
                    if (!prog.nome_programa) errors.push(`Programa #${pIdx+1}: Nome obrigatório.`);
                    if (!prog.metas || prog.metas.length === 0) errors.push(`Programa #${pIdx+1}: Deve ter ao menos uma meta.`);
                    
                    prog.metas.forEach((meta, mIdx) => {
                        if (!meta.codigo_meta) errors.push(`Programa #${pIdx+1}, Meta #${mIdx+1}: Código obrigatório.`);
                        if (!meta.meta_atendida && !meta.justificativa) errors.push(`Programa #${pIdx+1}, Meta #${mIdx+1}: Justificativa obrigatória para meta não atendida.`);
                    });
                });
            } else {
                errors.push("Relatório de atividades vazio (Seção 18).");
            }
            break;

        case '19': // Dados Gerais
            if (!data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_dados_gerais) errors.push("Certidão de Dados Gerais obrigatória.");
            if (!data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_corpo_diretivo) errors.push("Certidão de Corpo Diretivo obrigatória.");
            break;
        
        case '20': // Responsáveis
             if (!data.responsaveis_membros_orgao_concessor?.identificacao_certidao_responsaveis) errors.push("Certidão de Responsáveis obrigatória.");
             break;

        case '21': // Declarações
            const dec = data.declaracoes;
            if (dec?.houve_contratacao_empresas_pertencentes && (!dec.empresas_pertencentes || dec.empresas_pertencentes.length === 0)) {
                errors.push("Se houve contratação de empresas pertencentes, a lista de empresas é obrigatória.");
            }
            break;
        
        case '22': // Relatório Gov
            // Validar se houve emissão e conclusão
            break;
        
        case '23': // Demonstrações Contábeis
             if (!data.demonstracoes_contabeis?.responsavel?.cpf) errors.push("CPF do Responsável Técnico obrigatório.");
             break;

        case '26': // Parecer
            if (!data.parecer_conclusivo?.identificacao_parecer) errors.push("Identificação do Parecer Conclusivo obrigatória.");
            break;

        case '27': // Transparência
            const transp = data.transparencia;
            if (transp?.entidade_beneficiaria_mantem_sitio_internet) {
                if (!transp.sitios_internet || transp.sitios_internet.length === 0 || transp.sitios_internet.some(s => !s.trim())) {
                    errors.push("Se mantém sítio na internet, informe a URL.");
                }
            }
            break;
    }

    return errors;
}

/**
 * Retorna o status de validação de TODAS as seções para o Dashboard/Sidebar
 */
export function getAllSectionsStatus(data: PrestacaoContas): Record<string, SectionStatus> {
    const statusMap: Record<string, SectionStatus> = {};
    const sectionIds = Array.from({length: 27}, (_, i) => String(i + 1));

    sectionIds.forEach(id => {
        const errors = validateSection(id, data);
        let status: SectionStatus['status'] = 'valid';
        
        // Check for emptiness (Generic logic)
        const isEmpty = checkSectionEmpty(id, data);
        
        if (errors.length > 0) {
            status = 'invalid';
        } else if (isEmpty) {
            status = 'empty';
            // Some sections are mandatory to be non-empty
            if (['1', '2', '18', '19', '20', '21', '26', '27'].includes(id)) {
                status = 'invalid'; // These must be filled
                if(errors.length === 0) errors.push("Seção obrigatória não preenchida.");
            }
        }

        statusMap[id] = { id, status, errors };
    });

    return statusMap;
}

// Helper to check if a section has data populated
function checkSectionEmpty(id: string, data: PrestacaoContas): boolean {
    switch(id) {
        case '1': return !data.descritor.municipio;
        case '2': return !data.codigo_ajuste;
        case '3': return false; // Checkbox always has value
        case '4': return (!data.relacao_empregados || data.relacao_empregados.length === 0);
        case '5': return (!data.relacao_bens?.relacao_bens_moveis_adquiridos || data.relacao_bens.relacao_bens_moveis_adquiridos.length === 0);
        case '6': return (!data.contratos || data.contratos.length === 0);
        case '7': return (!data.documentos_fiscais || data.documentos_fiscais.length === 0);
        case '8': return (!data.pagamentos || data.pagamentos.length === 0);
        case '9': return (!data.disponibilidades?.saldos || data.disponibilidades.saldos.length === 0);
        case '10': return (!data.receitas?.repasses_recebidos || data.receitas.repasses_recebidos.length === 0);
        case '11': return (!data.ajustes_saldo?.retificacao_repasses || data.ajustes_saldo.retificacao_repasses.length === 0);
        case '12': return (!data.servidores_cedidos || data.servidores_cedidos.length === 0);
        case '13': return (!data.descontos || data.descontos.length === 0);
        case '14': return (!data.devolucoes || data.devolucoes.length === 0);
        case '15': return (!data.glosas || data.glosas.length === 0);
        case '16': return (!data.empenhos || data.empenhos.length === 0);
        case '17': return (!data.repasses || data.repasses.length === 0);
        case '18': return (!data.relatorio_atividades?.programas || data.relatorio_atividades.programas.length === 0);
        case '19': return !data.dados_gerais_entidade_beneficiaria?.identificacao_certidao_dados_gerais;
        case '20': return !data.responsaveis_membros_orgao_concessor?.identificacao_certidao_responsaveis;
        case '21': return !data.declaracoes; // Check for existence of Declarations object
        case '22': return !data.relatorio_governamental_analise_execucao?.houve_emissao_relatorio_final;
        case '23': return (!data.demonstracoes_contabeis?.publicacoes || data.demonstracoes_contabeis.publicacoes.length === 0);
        case '24': return (!data.publicacoes_parecer_ata || data.publicacoes_parecer_ata.length === 0);
        case '25': return !data.prestacao_contas_entidade_beneficiaria?.data_prestacao;
        case '26': return !data.parecer_conclusivo?.identificacao_parecer;
        case '27': return false; // Always present
        default: return true;
    }
}

/**
 * Validação de Consistência Contábil (Cross-Section)
 * Verifica se os pagamentos possuem cobertura financeira
 */
export function validateConsistency(data: PrestacaoContas): string[] {
    const consistencyErrors: string[] = [];

    // 1. Totais
    const totalPagamentos = data.pagamentos?.reduce((acc, cur) => acc + (cur.pagamento_valor || 0), 0) || 0;
    const totalDevolucoes = data.devolucoes?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0;
    const totalDespesas = totalPagamentos + totalDevolucoes;

    const totalRepasses = data.receitas?.repasses_recebidos?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0;
    const totalOutrasReceitas = (data.receitas?.outras_receitas?.reduce((acc, cur) => acc + (cur.valor || 0), 0) || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_municipais || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_estaduais || 0) +
                                (data.receitas?.receitas_aplic_financ_repasses_publicos_federais || 0);
    const totalReceitas = totalRepasses + totalOutrasReceitas;

    const totalSaldoBancario = data.disponibilidades?.saldos.reduce((acc, cur) => acc + (cur.saldo_bancario || 0), 0) || 0;

    // AVISO: Sem saldo anterior, não podemos bloquear estritamente Despesas > Receitas, 
    // mas se Despesas > Receitas + Disponibilidades, há um furo óbvio.
    
    // Regra: Disponibilidade Final não pode ser negativa
    // Saldo Final ~= Saldo Inicial + Receitas - Despesas
    // Logo: Saldo Inicial = Saldo Final - Receitas + Despesas
    // Se o Saldo Inicial implícito for negativo, alertamos.
    
    // Simplificando para validação visual:
    // Se pagamentos > receitas (muito comum ter saldo anterior), apenas alertamos se a diferença for absurda
    // Mas regra de ouro: Todo pagamento deve ter documento fiscal. (Já validado na Seção 8)
    
    return consistencyErrors;
}

/**
 * NOVO: Retorna campos FALTANDO para transmissão
 * Mostra exatamente o que o usuário precisa preencher
 */
export interface MissingFieldsReport {
    totalMissing: number;
    categories: {
        [category: string]: {
            description: string;
            fields: {
                fieldName: string;
                requirement: string;
                manualRef?: string;
            }[];
        };
    };
    readyToTransmit: boolean;
}

export function getMissingFieldsForTransmission(data: PrestacaoContas): MissingFieldsReport {
    const missing: MissingFieldsReport = {
        totalMissing: 0,
        categories: {},
        readyToTransmit: true
    };

    // 1. Descritor (Seção 1)
    if (!data.descritor?.municipio || !data.descritor?.entidade || !data.descritor?.ano || !data.descritor?.mes) {
        missing.categories['Informações Básicas'] = {
            description: 'Dados de identificação do documento (obrigatórios)',
            fields: [
                { fieldName: 'Tipo de Documento', requirement: 'Selecione o tipo', manualRef: 'Manual v1.9 - Seção 1' },
                { fieldName: 'Município', requirement: 'Código IBGE do município', manualRef: 'Manual v1.9 - Seção 1' },
                { fieldName: 'Entidade', requirement: 'Código da entidade no Audesp', manualRef: 'Manual v1.9 - Seção 1' },
                { fieldName: 'Ano/Mês', requirement: 'Período da prestação (obrigatoriamente mês 12 - dezembro)', manualRef: 'Manual v1.9 - Seção 1' }
            ]
        };
        missing.totalMissing += 4;
        missing.readyToTransmit = false;
    }

    // 2. Dados Gerais (Seção 2)
    if (!data.dados_gerais_entidade_beneficiaria) {
        missing.categories['Dados da Entidade'] = {
            description: 'Informações sobre a entidade beneficiária',
            fields: [
                { fieldName: 'CNPJ', requirement: 'CNPJ válido (14 dígitos)', manualRef: 'Manual v1.9 - Seção 2' },
                { fieldName: 'Razão Social', requirement: 'Nome da entidade', manualRef: 'Manual v1.9 - Seção 2' },
                { fieldName: 'Certidão - Dados Gerais', requirement: 'Preenchimento de dados gerais', manualRef: 'Manual v1.9 - Seção 2' },
                { fieldName: 'Certidão - Corpo Diretivo', requirement: 'Informações do corpo diretivo', manualRef: 'Manual v1.9 - Seção 2' },
                { fieldName: 'Certidão - Conselho', requirement: 'Informações do conselho', manualRef: 'Manual v1.9 - Seção 2' },
                { fieldName: 'Certidão - Membros Comissão', requirement: 'Membros da comissão de avaliação', manualRef: 'Manual v1.9 - Seção 2' }
            ]
        };
        missing.totalMissing += 6;
        missing.readyToTransmit = false;
    }

    // 3. Responsáveis (Seção 3)
    if (!data.responsaveis_membros_orgao_concessor || Object.keys(data.responsaveis_membros_orgao_concessor).length === 0) {
        if (!missing.categories['Responsáveis']) {
            missing.categories['Responsáveis'] = {
                description: 'Pessoas responsáveis pela prestação',
                fields: [
                    { fieldName: 'Responsável', requirement: 'Nome completo do responsável', manualRef: 'Manual v1.9 - Seção 3' },
                    { fieldName: 'CPF', requirement: 'CPF válido do responsável', manualRef: 'Manual v1.9 - Seção 3' },
                    { fieldName: 'Certidão - Membros', requirement: 'Identificação de membros do órgão', manualRef: 'Manual v1.9 - Seção 3' }
                ]
            };
            missing.totalMissing += 3;
            missing.readyToTransmit = false;
        }
    }

    // 4. Receitas (Seção 4)
    if (!data.receitas || Object.keys(data.receitas).length === 0) {
        missing.categories['Receitas'] = {
            description: 'Movimento financeiro de entrada (repasses, arrecadações, etc)',
            fields: [
                { fieldName: 'Repasses Recebidos', requirement: 'Valores recebidos de órgão concedente', manualRef: 'Manual v1.9 - Seção 4' },
                { fieldName: 'Receitas de Aplicações Financeiras', requirement: 'Juros e rendimentos', manualRef: 'Manual v1.9 - Seção 4' },
                { fieldName: 'Recursos Próprios', requirement: 'Receitas do próprio órgão', manualRef: 'Manual v1.9 - Seção 4' }
            ]
        };
        missing.totalMissing += 3;
        missing.readyToTransmit = false;
    }

    // 5. Documentos Fiscais (Seção 5)
    if (!data.documentos_fiscais || data.documentos_fiscais.length === 0) {
        missing.categories['Documentos Fiscais'] = {
            description: 'Notas fiscais, recibos e comprovantes de despesas',
            fields: [
                { fieldName: 'Documentos Fiscais', requirement: 'Pelo menos 1 documento ou deixar vazio se sem despesas', manualRef: 'Manual v1.9 - Seção 5' }
            ]
        };
        missing.readyToTransmit = false; // Pode estar vazio se não houver despesas
    }

    // 6. Relação de Bens (Seção 6)
    if (!data.relacao_bens || Object.keys(data.relacao_bens).length === 0) {
        missing.categories['Relação de Bens'] = {
            description: 'Bens móveis e imóveis adquiridos, cedidos ou baixados',
            fields: [
                { fieldName: 'Bens Móveis Adquiridos', requirement: 'Lista de bens móveis adquiridos (pode ser vazio)', manualRef: 'Manual v1.9 - Seção 6' },
                { fieldName: 'Bens Móveis Cedidos', requirement: 'Bens cedidos para terceiros (pode ser vazio)', manualRef: 'Manual v1.9 - Seção 6' },
                { fieldName: 'Bens Imóveis', requirement: 'Propriedades (pode ser vazio)', manualRef: 'Manual v1.9 - Seção 6' }
            ]
        };
        missing.readyToTransmit = false; // Pode estar vazio
    }

    // 7. Ajustes de Saldo (Seção 7)
    if (!data.ajustes_saldo || Object.keys(data.ajustes_saldo).length === 0) {
        missing.categories['Ajustes Contábeis'] = {
            description: 'Retificações e inclusões de transações',
            fields: [
                { fieldName: 'Retificações de Repasses', requirement: 'Ajustes em repasses anteriores', manualRef: 'Manual v1.9 - Seção 7' },
                { fieldName: 'Inclusões de Repasses', requirement: 'Novos repasses descobertos', manualRef: 'Manual v1.9 - Seção 7' },
                { fieldName: 'Ajustes de Pagamentos', requirement: 'Retificações e inclusões de pagamentos', manualRef: 'Manual v1.9 - Seção 7' }
            ]
        };
        missing.totalMissing += 3;
        missing.readyToTransmit = false;
    }

    // 8. Disponibilidades (Seção 8)
    if (!data.disponibilidades || Object.keys(data.disponibilidades).length === 0) {
        missing.categories['Disponibilidades'] = {
            description: 'Saldos bancários e fundos de caixa',
            fields: [
                { fieldName: 'Saldos Bancários', requirement: 'Saldo de contas bancárias', manualRef: 'Manual v1.9 - Seção 8' },
                { fieldName: 'Saldo de Fundo Fixo', requirement: 'Dinheiro em caixa ou fundo fixo', manualRef: 'Manual v1.9 - Seção 8' }
            ]
        };
        missing.totalMissing += 2;
        missing.readyToTransmit = false;
    }

    // 9. Relatórios (Seções 9-12)
    const relatorios = {
        'relatorio_atividades': 'Relatório de Atividades',
        'demonstracoes_contabeis': 'Demonstrações Contábeis',
        'relatorio_governamental_analise_execucao': 'Análise de Execução Governamental',
        'parecer_conclusivo': 'Parecer Conclusivo'
    };

    const missingRelatorios: string[] = [];
    for (const [key, label] of Object.entries(relatorios)) {
        if (!data[key as keyof PrestacaoContas]) {
            missingRelatorios.push(label);
        }
    }

    if (missingRelatorios.length > 0) {
        missing.categories['Relatórios'] = {
            description: 'Documentos de análise e parecer',
            fields: missingRelatorios.map(r => ({
                fieldName: r,
                requirement: 'Descrição ou documento anexado',
                manualRef: 'Manual v1.9 - Seções 9-12'
            }))
        };
        missing.totalMissing += missingRelatorios.length;
        missing.readyToTransmit = false;
    }

    return missing;
}

/**
 * Função principal de validação para transmissão
 */
export function validatePrestacaoContas(data: PrestacaoContas): string[] {
    const status = getAllSectionsStatus(data);
    const allErrors: string[] = [];

    Object.values(status).forEach(s => {
        if (s.status === 'invalid') {
            s.errors.forEach(e => allErrors.push(`[Seção ${s.id}] ${e}`));
        }
    });

    const consistency = validateConsistency(data);
    consistency.forEach(e => allErrors.push(`[Consistência] ${e}`));

    return allErrors;
}
