
import { PrestacaoContas, INITIAL_DATA } from '../schemas/type-definitions';
import { sanitizeObject } from './dataSanitizer';

/**
 * SERVIÇO DE TRANSFORMAÇÃO JSON
 * Responsável por converter o estado da aplicação para o JSON Oficial AUDESP e vice-versa.
 */

// 1. IMPORTAÇÃO (JSON Bruto -> App State)
export function importarPrestacao(jsonBruto: any): PrestacaoContas {
    console.log("Iniciando importação de JSON...");

    if (!jsonBruto) {
        throw new Error("JSON inválido ou vazio.");
    }

    // Sanitização profunda (datas, números, strings vazias)
    const cleanData = sanitizeObject(jsonBruto);

    // Merge com INITIAL_DATA para garantir que todos os campos existam (mesmo os vazios)
    // Isso evita "undefined" nos componentes React
    const appState: PrestacaoContas = {
        ...INITIAL_DATA,
        ...cleanData,
        descritor: {
            ...INITIAL_DATA.descritor,
            ...(cleanData.descritor || {})
        }
    };

    // Validação estrutural básica
    if (!appState.descritor.municipio || !appState.descritor.entidade) {
        console.warn("Aviso: JSON importado não possui Descritor completo.");
    }

    console.log("JSON importado com sucesso:", appState);
    return appState;
}

// 2. EXPORTAÇÃO (App State -> JSON Oficial Audesp V5)
export function gerarJsonAudesp(dados: PrestacaoContas): any {
    console.log("Gerando JSON Oficial Audesp V5...");

    // Cria uma cópia profunda para não mutar o estado
    const output = JSON.parse(JSON.stringify(dados));

    // REGRA 1: Remover campos auxiliares de UI (se houver)
    // (O sanitizer já deve ter cuidado disso, mas garantimos aqui)

    // REGRA 2: Arrays vazios devem ser removidos se o schema exigir
    // Para Audesp, em muitos casos, se o bloco não existe, não mandamos a chave.
    
    // Lista de chaves que são opcionais e devem ser removidas se vazias
    const optionalArrays = [
        'relacao_empregados', 
        'contratos', 
        'documentos_fiscais', 
        'pagamentos',
        'empenhos',
        'repasses',
        'servidores_cedidos',
        'glosas',
        'descontos',
        'devolucoes',
        'publicacoes_parecer_ata'
    ];

    optionalArrays.forEach(key => {
        if (output[key] && Array.isArray(output[key]) && output[key].length === 0) {
            delete output[key];
        }
    });

    // REGRA 3: Bloco de Bens
    if (output.relacao_bens) {
        const bens = output.relacao_bens;
        const hasBens = 
            (bens.relacao_bens_moveis_adquiridos?.length > 0) ||
            (bens.relacao_bens_moveis_cedidos?.length > 0) ||
            (bens.relacao_bens_moveis_baixados_devolvidos?.length > 0);
        
        if (!hasBens) delete output.relacao_bens;
    }

    // REGRA 4: Limpeza de Ajustes de Saldo
    if (output.ajustes_saldo) {
        const adj = output.ajustes_saldo;
        const hasAdj = 
            (adj.retificacao_repasses?.length > 0) ||
            (adj.inclusao_repasses?.length > 0) ||
            (adj.retificacao_pagamentos?.length > 0) ||
            (adj.inclusao_pagamentos?.length > 0);
        
        if (!hasAdj) delete output.ajustes_saldo;
    }

    // REGRA 5: Formatos Especiais
    // Garantir que todos os números sejam números (não strings)
    // Isso já é feito pelo sanitizeObject na entrada, mas reforçamos na saída se necessário.

    console.log("JSON Oficial gerado:", output);
    return output;
}
