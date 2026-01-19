
import { PrestacaoContas, AudespResponse, TipoDocumentoDescritor } from '../types';
import { saveProtocol } from './protocolService';
import { AuditLogger } from './auditService';

/**
 * TRANSMISSION SERVICE
 * Endpoint Oficial de Envio (Piloto): https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
 * Proxied in dev via /proxy-piloto-f5 (rewritten to /f5)
 * IMPORTANTE: /f5 é NECESSÁRIO - faz parte da API oficial
 */

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocalhost
  ? "/proxy-piloto-f5"
  : "https://audesp-piloto.tce.sp.gov.br/f5";

// Debug: Log environment detection
if (typeof window !== 'undefined') {
  console.log('[Transmission Init]', {
    hostname: window.location.hostname,
    isLocalhost: isLocalhost,
    API_BASE: API_BASE,
    protocol: window.location.protocol,
    url: window.location.href
  });
}

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
 * @param cpf CPF do usuário autenticado
 */
export async function sendPrestacaoContas(token: string, data: PrestacaoContas, cpf?: string): Promise<AudespResponse> {
  const tipoDoc = data.descritor.tipo_documento;
  const endpoint = ROUTE_MAP[tipoDoc];

  if (!endpoint) {
      throw new Error(`Tipo de documento não mapeado: ${tipoDoc}`);
  }

  const fullUrl = `${API_BASE}${endpoint}`;
  console.log(`[Transmission] Enviando para: ${fullUrl}`);
  console.log(`[Transmission] Token prefix: ${token.substring(0, 20)}...`);

  const payload = data; 

  // ERRO 400 FIX (Multipart): O servidor exige multipart/form-data.
  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  
  formData.append('documentoJSON', jsonBlob, `prestacao_${data.descritor.entidade}_${data.descritor.mes}_${data.descritor.ano}.json`);

  try {
    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const requestConfig: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Accept': 'application/json',
        ...(cpf && { 'X-User-CPF': cpf })
      },
      body: formData,
      signal: controller.signal
    };

    console.log(`[Transmission] Request headers:`, {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data (auto)'
    });
    console.log(`[Transmission] Endpoint: ${fullUrl}`);
    console.log(`[Transmission] Method: POST`);
    console.log(`[Transmission] Environment: ${process.env.NODE_ENV}`);

    let response: Response;
    try {
      response = await fetch(fullUrl, requestConfig);
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await response.text();
    console.log(`[Transmission] Status: ${response.status}`);
    console.log(`[Transmission] Response headers:`, {
      'content-type': response.headers.get('content-type'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin')
    });
    
    let result: any;
    try {
        result = JSON.parse(responseText);
    } catch {
        throw new Error(`Erro não-JSON do servidor (${response.status}): ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
        // Formata erro JSON para exibição amigável
        const errorDetails = JSON.stringify(result, null, 2);
        
        // Adicionar contexto de debugging para erro 403
        if (response.status === 403) {
            console.error(`[Transmission] 403 Forbidden - Verificar:
1. Token de autenticação válido: ${token ? 'SIM' : 'NÃO'}
2. Permissões do usuário no Audesp Piloto
3. Endpoint correto: ${fullUrl}
4. CORS configurado no servidor`);
        }
        
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
        
        // Log transmission success in audit
        AuditLogger.logTransmission(
            tipoDoc,
            result.protocolo,
            'SUCCESS'
        );
    }

    return result as AudespResponse;

  } catch (error: any) {
    console.error("[Transmission Error]", error);
    
    // Log transmission failure in audit
    AuditLogger.logTransmission(
      tipoDoc,
      null,
      'FAILED',
      error.message
    );
    
    // Detailed error diagnostics for "Failed to fetch"
    let diagnosticMessage = "";
    
    // CRITICAL: Check which URL was actually used
    const wasUsingProxy = fullUrl.includes('/proxy-');
    const wasUsingDirectHttps = fullUrl.includes('https://');
    
    if (error.name === 'AbortError') {
      diagnosticMessage = `❌ TIMEOUT (30s): Servidor não respondeu em tempo hábil\n• Verifique se https://audesp-piloto.tce.sp.gov.br está online\n• Tente novamente em alguns segundos`;
    } else if (error.message?.includes('Failed to fetch')) {
      // "Failed to fetch" can mean CORS, network error, or request failure
      const urlInfo = wasUsingProxy 
        ? "(via proxy - localhost)"
        : wasUsingDirectHttps
        ? "(CORS/direct HTTPS)"
        : "(unknown URL)";
      
      diagnosticMessage = `❌ ERRO DE CONEXÃO (CORS/Network) ${urlInfo}:\n• Servidor pode estar indisponível\n• Verificar se domínio está acessível: https://audesp-piloto.tce.sp.gov.br\n• Pode ser bloqueio de CORS do navegador\n• Tente em produção (não localhost)`;
    } else if (error.message?.includes('NetworkError')) {
      diagnosticMessage = `❌ ERRO DE REDE:\n• Verifique sua conexão de internet\n• Tente novamente em alguns segundos\n• Se persistir, contate o administrador da rede`;
    } else if (error.message?.includes('TypeError')) {
      diagnosticMessage = `❌ ERRO DE TIPO/CONFIGURAÇÃO:\n• Problema na construção da requisição\n• Verifique token e formato de dados`;
    } else {
      diagnosticMessage = `❌ ERRO DESCONHECIDO: ${error.message}`;
    }
    
    console.error(`[Transmission Diagnostic]\n${diagnosticMessage}`);
    console.error(`[Transmission Debug Info]`, {
      url: fullUrl,
      isProxyURL: wasUsingProxy,
      isDirectURL: wasUsingDirectHttps,
      method: 'POST',
      tokenPrefix: token?.substring(0, 10) + '...',
      windowHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      environment: process.env.NODE_ENV,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    throw new Error(diagnosticMessage);
  }
}
