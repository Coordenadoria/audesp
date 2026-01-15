
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { sanitizeObject } from "./dataSanitizer";

// Ensure usage of process.env.API_KEY
// NOTE: Gemini API calls should be made from backend only
// This is a frontend placeholder that requires a backend proxy
let ai: any = null;

if (typeof window === 'undefined' && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// --- SCHEMAS DEFINITIONS (Reusable) ---

const CREDOR_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        documento_numero: { type: Type.STRING, description: "CNPJ or CPF numbers only" },
        nome: { type: Type.STRING },
        documento_tipo: { type: Type.NUMBER, description: "2 for CNPJ, 1 for CPF" }
    }
};

const DOC_FISCAL_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        numero: { type: Type.STRING },
        data_emissao: { type: Type.STRING, description: "YYYY-MM-DD" },
        valor_bruto: { type: Type.NUMBER },
        credor: CREDOR_SCHEMA,
        descricao: { type: Type.STRING },
        categoria_despesas_tipo: { type: Type.NUMBER }
    }
};

const EMPREGADO_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        cpf: { type: Type.STRING },
        data_admissao: { type: Type.STRING },
        salario_contratual: { type: Type.NUMBER },
        cbo: { type: Type.STRING },
        periodos_remuneracao: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    mes: { type: Type.NUMBER },
                    carga_horaria: { type: Type.NUMBER },
                    remuneracao_bruta: { type: Type.NUMBER }
                }
            }
        }
    }
};

const CONTRATO_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        numero: { type: Type.STRING },
        objeto: { type: Type.STRING },
        data_assinatura: { type: Type.STRING },
        valor_montante: { type: Type.NUMBER },
        vigencia_data_inicial: { type: Type.STRING },
        credor: CREDOR_SCHEMA
    }
};

const PAGAMENTO_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        pagamento_data: { type: Type.STRING },
        pagamento_valor: { type: Type.NUMBER },
        numero_transacao: { type: Type.STRING },
        identificacao_documento_fiscal: {
            type: Type.OBJECT,
            properties: { numero: { type: Type.STRING } }
        },
        meio_pagamento_tipo: { type: Type.NUMBER }
    }
};

const BEM_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        numero_patrimonio: { type: Type.STRING },
        descricao: { type: Type.STRING },
        data_aquisicao: { type: Type.STRING },
        valor_aquisicao: { type: Type.NUMBER }
    }
};

const SALDO_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        banco: { type: Type.NUMBER },
        agencia: { type: Type.NUMBER },
        conta: { type: Type.STRING },
        saldo_bancario: { type: Type.NUMBER },
        saldo_contabil: { type: Type.NUMBER }
    }
};

const RECEITA_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        data_repasse: { type: Type.STRING },
        valor: { type: Type.NUMBER },
        data_prevista: { type: Type.STRING }
    }
};

const CEDIDO_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        cpf: { type: Type.STRING },
        cargo_publico_ocupado: { type: Type.STRING },
        data_inicial_cessao: { type: Type.STRING },
        onus_pagamento: { type: Type.NUMBER }
    }
};

// --- MAIN EXTRACTOR FUNCTIONS ---

/**
 * Extracts data from a single image or PDF page for a specific section.
 */
export async function extractDataFromImage(
  base64Data: string, 
  mimeType: string, 
  section: string
): Promise<any> {
  
  let prompt = "Analyze this document. Extract the data strictly into the specified JSON structure. Normalize dates to YYYY-MM-DD and numbers to floats. Ignore currency symbols.";
  let schema: any = {};

  switch (section) {
    case 'documentos_fiscais':
      prompt += " Extract invoices/receipts.";
      schema = { type: Type.OBJECT, properties: { documentos_fiscais: { type: Type.ARRAY, items: DOC_FISCAL_SCHEMA } } };
      break;
    case 'relacao_empregados':
      prompt += " Extract payroll/employee list.";
      schema = { type: Type.OBJECT, properties: { empregados: { type: Type.ARRAY, items: EMPREGADO_SCHEMA } } };
      break;
    case 'contratos':
      prompt += " Extract contracts.";
      schema = { type: Type.OBJECT, properties: { contratos: { type: Type.ARRAY, items: CONTRATO_SCHEMA } } };
      break;
    case 'pagamentos':
      prompt += " Extract payments/bank transfers.";
      schema = { type: Type.OBJECT, properties: { pagamentos: { type: Type.ARRAY, items: PAGAMENTO_SCHEMA } } };
      break;
    case 'empenhos':
        schema = {
            type: Type.OBJECT,
            properties: {
                empenhos: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            numero: { type: Type.STRING },
                            data_emissao: { type: Type.STRING },
                            valor: { type: Type.NUMBER },
                            historico: { type: Type.STRING }
                        }
                    }
                }
            }
        };
        break;
    case 'relacao_bens':
        prompt += " Extract asset list (bens patrimoniais).";
        schema = { type: Type.OBJECT, properties: { relacao_bens_moveis_adquiridos: { type: Type.ARRAY, items: BEM_SCHEMA } } };
        break;
    case 'disponibilidades':
        prompt += " Extract bank balances (extrato bancário/conciliação).";
        schema = { type: Type.OBJECT, properties: { saldos: { type: Type.ARRAY, items: SALDO_SCHEMA } } };
        break;
    case 'receitas':
        prompt += " Extract revenue/transfers received.";
        schema = { type: Type.OBJECT, properties: { repasses_recebidos: { type: Type.ARRAY, items: RECEITA_SCHEMA } } };
        break;
    case 'servidores_cedidos':
        prompt += " Extract list of ceded public servants.";
        schema = { type: Type.OBJECT, properties: { servidores_cedidos: { type: Type.ARRAY, items: CEDIDO_SCHEMA } } };
        break;
    default:
        // Fallback for simple fields
        prompt += " Extract key information.";
        schema = { type: Type.OBJECT, properties: { info: { type: Type.STRING } } };
        break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
        const raw = JSON.parse(response.text);
        // If the schema wrapped in a root property, check logic
        const keys = Object.keys(raw);
        if (keys.length === 1 && Array.isArray(raw[keys[0]])) {
            return sanitizeObject(raw[keys[0]]); // Return the array directly if needed by logic
        }
        // Special Case: relacao_bens needs nested object structure
        if(section === 'relacao_bens' && raw.relacao_bens_moveis_adquiridos) {
            return sanitizeObject(raw);
        }
        
        return sanitizeObject(raw);
    }
    return null;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
}

/**
 * MASSIVE EXTRACTION: Reads a full PDF and maps to the entire Audesp Schema.
 * This is Module 2 of the requirement.
 */
export async function extractFullReport(base64Data: string, mimeType: string): Promise<any> {
    const prompt = `
    You are an expert accountant and auditor for TCESP Audesp Phase V.
    Analyze this ENTIRE document (Accountability Report / Prestação de Contas).
    
    Your task is to identify and extract ALL relevant sections into a single JSON structure.
    
    1. Identify the 'Descritor' (Year, Month, Entity, City).
    2. Identify 'Empregados' (Payroll).
    3. Identify 'Contratos' (Contracts).
    4. Identify 'Documentos Fiscais' (Invoices, Receipts).
    5. Identify 'Pagamentos' (Bank transfers, checks).
    6. Identify 'Empenhos' (Commitments).
    7. Identify 'Repasses' (Transfers received).
    
    If a section is not found, return an empty array for it.
    Normalize all dates to YYYY-MM-DD.
    Normalize all values to float (e.g. 1250.50).
    Clean CPF/CNPJ (numbers only).
    `;

    // A monolithic schema covering the main arrays
    const FULL_SCHEMA: Schema = {
        type: Type.OBJECT,
        properties: {
            descritor: {
                type: Type.OBJECT,
                properties: {
                    ano: { type: Type.NUMBER },
                    mes: { type: Type.NUMBER },
                    entidade: { type: Type.NUMBER },
                    municipio: { type: Type.NUMBER }
                }
            },
            relacao_empregados: { type: Type.ARRAY, items: EMPREGADO_SCHEMA },
            contratos: { type: Type.ARRAY, items: CONTRATO_SCHEMA },
            documentos_fiscais: { type: Type.ARRAY, items: DOC_FISCAL_SCHEMA },
            pagamentos: { type: Type.ARRAY, items: PAGAMENTO_SCHEMA },
            empenhos: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        numero: { type: Type.STRING },
                        data_emissao: { type: Type.STRING },
                        valor: { type: Type.NUMBER },
                        historico: { type: Type.STRING }
                    }
                }
            },
            repasses: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        data_repasse: { type: Type.STRING },
                        valor_repasse: { type: Type.NUMBER },
                        numero_documento: { type: Type.STRING }
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: FULL_SCHEMA
            }
        });

        if (response.text) {
            const raw = JSON.parse(response.text);
            return sanitizeObject(raw);
        }
        return null;
    } catch (error) {
        console.error("Full Report Extraction Error:", error);
        throw error;
    }
}
