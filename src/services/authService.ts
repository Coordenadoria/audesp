
import { TokenResponse } from '../types';

/**
 * AUTH SERVICE
 * Endpoint Oficial: https://audesp-piloto.tce.sp.gov.br/login
 * Proxied in dev via /proxy-piloto-login
 */

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocalhost
  ? "/proxy-piloto-login" 
  : "https://audesp-piloto.tce.sp.gov.br";

// Debug: Log environment detection
if (typeof window !== 'undefined') {
  console.log('[Auth Init]', {
    hostname: window.location.hostname,
    isLocalhost: isLocalhost,
    API_BASE: API_BASE,
    protocol: window.location.protocol,
    url: window.location.href
  });
}

const STORAGE_TOKEN_KEY = "audesp_token";
const STORAGE_EXPIRY_KEY = "audesp_expire";

export async function login(usuario: string, senha: string): Promise<TokenResponse> {
  const url = `${API_BASE}/login`;
  const cleanUsuario = usuario.trim();
  const cleanSenha = senha.trim();

  console.log(`[Auth] Iniciando login para: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-authorization": `${cleanUsuario}:${cleanSenha}`,
      },
      // Strictly following the Next.js snippet provided: 
      // Headers have Content-Type: application/json, but no body is sent.
      body: undefined, 
    });

    const responseText = await response.text();
    console.log(`[Auth] Resposta Body: ${responseText.substring(0, 50)}...`);
    
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText || "Erro não-JSON do servidor" };
    }

    if (!response.ok) {
      let errorMessage = data.message || data.error || "Falha na autenticação";
      
      if (response.status === 401) {
          errorMessage = "Credenciais inválidas ou usuário sem permissão.";
      } else if (response.status === 404) {
          errorMessage = "Endpoint de Login não encontrado (404).";
      } else if (response.status >= 500) {
          errorMessage = `Erro do Servidor Audesp (${response.status})`;
      }

      throw new Error(errorMessage);
    }

    const token = data.access_token || data.token;
    if (!token) throw new Error("Token não encontrado na resposta.");

    // Handle Expiry
    let expireTimestamp: number;
    if (data.expire_in) {
        // If it's a small number (unix timestamp in seconds), convert to ms
        if (typeof data.expire_in === 'number' && data.expire_in < 10000000000) {
            expireTimestamp = data.expire_in * 1000;
        } else {
            // Assume ISO string or ms timestamp
            expireTimestamp = new Date(data.expire_in).getTime();
        }
    } else {
        // Default 2 hours if not provided
        expireTimestamp = Date.now() + 7200000; 
    }

    const tokenData: TokenResponse = {
        token: token,
        expire_in: expireTimestamp,
        token_type: data.token_type || "bearer"
    };

    sessionStorage.setItem(STORAGE_TOKEN_KEY, tokenData.token);
    sessionStorage.setItem(STORAGE_EXPIRY_KEY, tokenData.expire_in.toString());

    return tokenData;

  } catch (error: any) {
    console.error("[Auth Error]", error);
    
    const wasUsingProxy = url.includes('/proxy-');
    const wasUsingDirectHttps = url.includes('https://');
    
    if (error.message && error.message.includes('Failed to fetch')) {
        const urlInfo = wasUsingProxy 
          ? "(via proxy - localhost)"
          : wasUsingDirectHttps
          ? "(CORS/direct HTTPS)"
          : "(unknown URL)";
        
        console.error("[Auth Debug]", {
          url: url,
          isProxyURL: wasUsingProxy,
          isDirectURL: wasUsingDirectHttps,
          windowHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
          errorMessage: error.message
        });
        
        throw new Error(`ERRO DE REDE LOCAL ${urlInfo}.\nFalha ao conectar via Proxy.\nVerifique se o servidor Audesp Piloto está online.`);
    }
    
    throw error;
  }
}

export function getToken(): string | null {
  return sessionStorage.getItem(STORAGE_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const expiry = sessionStorage.getItem(STORAGE_EXPIRY_KEY);
  if (expiry) {
      return Date.now() < parseInt(expiry, 10);
  }
  return true;
}

export function logout(): void {
  sessionStorage.clear();
}

/**
 * Extrai o CPF do token JWT Audesp
 * O CPF está no payload do token, geralmente em campos como 'cpf', 'sub', 'user_id', etc.
 */
export function extractCpfFromToken(token: string): string | null {
  try {
    // JWT tem 3 partes: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[Auth] Token format inválido para decodificação JWT');
      return null;
    }

    // Decodificar o payload (segunda parte)
    const payload = parts[1];
    // Adicionar padding se necessário
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));

    console.log('[Auth] JWT Payload decodificado:', {
      keys: Object.keys(decoded),
      sub: decoded.sub,
      cpf: decoded.cpf,
      user_id: decoded.user_id,
      email: decoded.email,
      name: decoded.name
    });

    // Procurar CPF em campos conhecidos
    const cpf = 
      decoded.cpf ||           // Campo direto CPF
      decoded.sub ||           // Subject (pode ser CPF)
      decoded.user_id ||       // ID do usuário
      decoded.usuario ||       // Campo usuario
      (decoded.email && decoded.email.includes('@') 
        ? null  // Se for email, não usar como CPF
        : decoded.email);      // Senão, pode ser identificador

    if (cpf && typeof cpf === 'string') {
      // Validar se parece um CPF (11 dígitos)
      const cpfClean = cpf.replace(/\D/g, '');
      if (cpfClean.length === 11) {
        console.log('[Auth] CPF extraído do token:', cpfClean);
        return cpfClean;
      }
    }

    console.warn('[Auth] Não foi possível extrair CPF válido do token');
    return null;
  } catch (error) {
    console.error('[Auth] Erro ao decodificar JWT:', error);
    return null;
  }
}
