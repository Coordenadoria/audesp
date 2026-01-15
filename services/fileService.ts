
import { PrestacaoContas } from '../types';

/**
 * Faz o download do objeto PrestacaoContas como arquivo JSON
 */
export const downloadJson = (data: PrestacaoContas, filename?: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    // Nome sugerido: prestacao_ENTIDADE_MES_ANO.json
    const defaultName = `prestacao_${data.descritor.entidade}_${data.descritor.mes}_${data.descritor.ano}.json`;
    
    const link = document.createElement('a');
    link.href = href;
    link.download = filename || defaultName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
};

/**
 * Lê um arquivo JSON e retorna o objeto PrestacaoContas
 */
export const loadJson = (file: File): Promise<PrestacaoContas> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                if (event.target?.result) {
                    const json = JSON.parse(event.target.result as string);
                    // Aqui poderíamos adicionar uma validação básica de schema
                    // Para garantir que é um arquivo Audesp válido
                    if (!json.descritor) {
                        throw new Error("Arquivo inválido: Objeto 'descritor' não encontrado.");
                    }
                    resolve(json as PrestacaoContas);
                } else {
                    reject(new Error("Arquivo vazio ou ilegível."));
                }
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(new Error("Erro ao ler o arquivo."));
        };

        reader.readAsText(file);
    });
};
