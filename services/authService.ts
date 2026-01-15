
import { TokenResponse } from '../types';

/**
 * AUTH SERVICE
 * Endpoint Oficial: https://audesp-piloto.tce.sp.gov.br/login
 * Proxied in dev via /proxy-login
 */

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "/proxy-login" 
  : "https://audesp-piloto.tce.sp.gov.br";

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
    
    if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error("ERRO DE REDE LOCAL.\nFalha ao conectar via Proxy.\nVerifique se o servidor Audesp Piloto está online.");
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
