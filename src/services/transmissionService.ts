
import { PrestacaoContas, AudespResponse, TipoDocumentoDescritor } from '../schemas/type-definitions';
import { saveProtocol } from './protocolService';
import { gerarJsonAudesp } from './jsonTransformerService';

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

export async function sendPrestacaoContas(token: string, data: PrestacaoContas): Promise<AudespResponse> {
  const tipoDoc = data.descritor.tipo_documento;
  const endpoint = ROUTE_MAP[tipoDoc];

  if (!endpoint) throw new Error(`Tipo de documento não mapeado: ${tipoDoc}`);

  const fullUrl = `${API_BASE}${endpoint}`;
  
  // TRANSFORMER: Convert App State to Strict Audesp JSON
  const payload = gerarJsonAudesp(data);

  // Multipart wrapper
  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  formData.append('documentoJSON', jsonBlob, `prestacao.json`);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: formData
    });

    const responseText = await response.text();
    let result: any;
    try {
        result = JSON.parse(responseText);
    } catch {
        throw new Error(`Erro não-JSON do servidor (${response.status})`);
    }

    if (!response.ok) {
        throw new Error(JSON.stringify(result, null, 2));
    }

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
