
import { GoogleGenAI, Type } from "@google/genai";
import { sanitizeObject } from './dataSanitizer';

// Ensure usage of process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * OCR SERVICE (Gemini 2.0)
 * Maps uploaded documents to specific Audesp blocks.
 */

export async function extractBlockData(
  base64Data: string, 
  mimeType: string, 
  blockType: string
): Promise<any> {
  
  let prompt = "Analyze this document for Audesp Phase V. Extract data strictly to JSON. Dates YYYY-MM-DD. Numbers as floats.";
  let schemaType = Type.OBJECT;
  let schemaProps: any = {};

  // Mapeamento baseado nas novas Seções Oficiais
  switch (blockType) {
    // SEÇÃO 2: FINANCEIRO
    case 'documentos_fiscais':
        prompt += " Extract invoices (Notas Fiscais).";
        schemaProps = {
            documentos_fiscais: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        numero: { type: Type.STRING },
                        data_emissao: { type: Type.STRING },
                        valor_bruto: { type: Type.NUMBER },
                        credor: { 
                            type: Type.OBJECT, 
                            properties: { documento_numero: { type: Type.STRING }, nome: { type: Type.STRING } } 
                        },
                        descricao: { type: Type.STRING }
                    }
                }
            }
        };
        break;

    case 'contratos':
        prompt += " Extract contracts.";
        schemaProps = {
            contratos: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        numero: { type: Type.STRING },
                        data_assinatura: { type: Type.STRING },
                        valor_montante: { type: Type.NUMBER },
                        objeto: { type: Type.STRING },
                        credor: {
                            type: Type.OBJECT,
                            properties: { documento_numero: { type: Type.STRING }, nome: { type: Type.STRING } }
                        }
                    }
                }
            }
        };
        break;

    case 'pagamentos':
        prompt += " Extract payments (comprovantes, extratos).";
        schemaProps = {
            pagamentos: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        pagamento_data: { type: Type.STRING },
                        pagamento_valor: { type: Type.NUMBER },
                        identificacao_documento_fiscal: { type: Type.OBJECT, properties: { numero: { type: Type.STRING } } }
                    }
                }
            }
        };
        break;

    case 'empenhos':
        prompt += " Extract commitments (Empenhos).";
        schemaProps = {
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
        };
        break;

    // SEÇÃO 4: EMPREGADOS
    case 'relacao_empregados':
        prompt += " Extract payroll (Folha de Pagamento).";
        schemaProps = {
            relacao_empregados: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        cpf: { type: Type.STRING },
                        data_admissao: { type: Type.STRING },
                        salario_contratual: { type: Type.NUMBER },
                        cbo: { type: Type.STRING }
                    }
                }
            }
        };
        break;

    default:
        prompt += " Extract key fields.";
        schemaProps = { info: { type: Type.STRING } };
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
        responseSchema: { type: schemaType, properties: schemaProps }
      }
    });

    if (response.text) {
        return sanitizeObject(JSON.parse(response.text));
    }
    return null;

  } catch (error) {
    console.error("OCR Service Error:", error);
    throw error;
  }
}
