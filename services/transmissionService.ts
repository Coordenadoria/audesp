
import { PrestacaoContas, AudespResponse, TipoDocumentoDescritor } from '../types';
import { saveProtocol } from './protocolService';

/**
 * TRANSMISSION SERVICE
 * Endpoint Oficial de Envio (Piloto): https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
 * Proxied in dev via /proxy-f5
 */

const API_BASE = process.env.NODE_ENV === 'development'
  ? "/proxy-f5"
  : "https://audesp-piloto.tce.sp.gov.br/f5";

const ROUTE_MAP: Record<TipoDocumentoDescritor, string> = {
    "Prestação de Contas de Convênio": "/enviar-prestacao-contas-convenio",
    "Prestação de Contas de Contrato de Gestão": "/enviar-prestacao-contas-contrato-gestao",
    "Prestação de Contas de Termo de Parceria": "/enviar-prestacao-contas-parceria",
    "Prestação de Contas de Termo de Fomento": "/enviar-prestacao-contas-termo-fomento",
    "Prestação de Contas de Termo de Colaboração": "/enviar-prestacao-contas-termo-colaboracao",
    "Declaração Negativa": "/enviar-prestacao-contas-declaracao-negativa"
};

/**
 * Envia a prestação de contas completa para o Audesp Piloto.
 * @param token Token JWT Bearer obtido no login
 * @param data Objeto PrestacaoContas completo
 */
export async function sendPrestacaoContas(token: string, data: PrestacaoContas): Promise<AudespResponse> {
  const tipoDoc = data.descritor.tipo_documento;
  const endpoint = ROUTE_MAP[tipoDoc];

  if (!endpoint) {
      throw new Error(`Tipo de documento não mapeado: ${tipoDoc}`);
  }

  const fullUrl = `${API_BASE}${endpoint}`;
  console.log(`[Transmission] Enviando para: ${fullUrl}`);

  // ERRO 400 FIX (Schema Validation): 
  // O servidor rejeitou o objeto envelopado em { prestacao_contas: ... }.
  // O Schema espera que as propriedades (descritor, empregados, etc) estejam na RAIZ do JSON.
  const payload = data; 

  // ERRO 400 FIX (Multipart): O servidor exige multipart/form-data.
  // Empacotamos o JSON como um arquivo 'documentoJSON' dentro de um FormData.
  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  
  // FIXED: Renamed 'arquivo' to 'documentoJSON' based on server error message
  formData.append('documentoJSON', jsonBlob, `prestacao_${data.descritor.entidade}_${data.descritor.mes}_${data.descritor.ano}.json`);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // NÃO definir Content-Type aqui. O browser define automaticamente como multipart/form-data; boundary=...
      },
      body: formData
    });

    const responseText = await response.text();
    console.log(`[Transmission] Status: ${response.status}`);
    
    let result: any;
    try {
        result = JSON.parse(responseText);
    } catch {
        throw new Error(`Erro não-JSON do servidor (${response.status}): ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
        // Formata erro JSON para exibição amigável
        const errorDetails = JSON.stringify(result, null, 2);
        throw new Error(errorDetails);
    }

    // Salvar no histórico local apenas se tiver protocolo
    if (result.protocolo) {
        saveProtocol({
            protocolo: result.protocolo,
            dataHora: result.dataHora,
            status: result.status,
            tipoDocumento: result.tipoDocumento
        });
    }

    return result as AudespResponse;

  } catch (error: any) {
    console.error("[Transmission Error]", error);
    throw error;
  }
}
