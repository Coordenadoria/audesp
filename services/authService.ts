
import { TokenResponse } from '../types';

/**
 * AUTH SERVICE
 * Endpoint Oficial: https://audesp-piloto.tce.sp.gov.br/login
 * Proxied in dev via /proxy-piloto-login
 */

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "/proxy-piloto-login" 
  : "https://audesp-piloto.tce.sp.gov.br";

const STORAGE_TOKEN_KEY = "audesp_token";
const STORAGE_EXPIRY_KEY = "audesp_expire";

export async function login(usuario: string, senha: string): Promise<TokenResponse> {
  const url = `${API_BASE}/login`;
  const cleanUsuario = usuario.trim();
  const cleanSenha = senha.trim();

  console.log(`[Auth] Iniciando login para: ${url}`);
  console.log(`[Auth] Usuário: ${cleanUsuario}`);

  try {
    // Primeiro tenta com cabeçalho x-authorization (padrão AUDESP)
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-authorization": `${cleanUsuario}:${cleanSenha}`,
      },
      // Envia um body vazio (muitos servidores esperam POST com body)
      body: JSON.stringify({}),
    });

    console.log(`[Auth] Tentativa 1 (x-authorization header) - Status: ${response.status}`);

    // Se falhar com 401/403, tenta com Authorization header (fallback)
    if ((response.status === 401 || response.status === 403) && cleanSenha) {
      console.log(`[Auth] Tentando fallback com Authorization header...`);
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Basic ${btoa(`${cleanUsuario}:${cleanSenha}`)}`,
        },
        body: JSON.stringify({}),
      });
      console.log(`[Auth] Tentativa 2 (Authorization header) - Status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`[Auth] Resposta Body: ${responseText.substring(0, 100)}...`);
    
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText || "Erro não-JSON do servidor" };
    }

    if (!response.ok) {
      let errorMessage = data.message || data.error || "Falha na autenticação";
      
      if (response.status === 401) {
          errorMessage = "❌ Credenciais inválidas. Verifique email e senha.";
      } else if (response.status === 403) {
          errorMessage = "❌ Acesso proibido. Você pode não ter permissão no Ambiente Piloto.";
      } else if (response.status === 404) {
          errorMessage = "❌ Endpoint de Login não encontrado (404). Proxy pode estar desconfigurado.";
      } else if (response.status >= 500) {
          errorMessage = `❌ Erro do Servidor Audesp (${response.status}): ${data.message || 'Servidor indisponível'}`;
      }

      throw new Error(errorMessage);
    }

    // Tenta múltiplos formatos de token que o servidor pode usar
    const token = data.access_token || data.token || data.accessToken || data.jwt;
    if (!token) {
      console.error("[Auth] Resposta do servidor:", data);
      throw new Error("❌ Token não encontrado na resposta. Formato de resposta do servidor inesperado.");
    }

    // Handle Expiry
    let expireTimestamp: number;
    if (data.expire_in) {
        // Se for pequeno, assume segundos
        if (typeof data.expire_in === 'number' && data.expire_in < 10000000000) {
            expireTimestamp = data.expire_in * 1000;
        } else {
            // Assume timestamp em ms ou string ISO
            expireTimestamp = new Date(data.expire_in).getTime();
        }
    } else if (data.expires_in) {
        // Fallback para "expires_in"
        if (typeof data.expires_in === 'number' && data.expires_in < 10000000000) {
            expireTimestamp = data.expires_in * 1000;
        } else {
            expireTimestamp = new Date(data.expires_in).getTime();
        }
    } else {
        // Default 2 horas se não fornecido
        expireTimestamp = Date.now() + 7200000; 
    }

    const tokenData: TokenResponse = {
        token: token,
        expire_in: expireTimestamp,
        token_type: data.token_type || "bearer"
    };

    sessionStorage.setItem(STORAGE_TOKEN_KEY, tokenData.token);
    sessionStorage.setItem(STORAGE_EXPIRY_KEY, tokenData.expire_in.toString());

    console.log(`[Auth] ✅ Login bem-sucedido! Token expira em ${new Date(expireTimestamp).toLocaleString()}`);
    return tokenData;

  } catch (error: any) {
    console.error("[Auth Error]", error);
    
    if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error("❌ ERRO DE REDE LOCAL.\nFalha ao conectar via Proxy.\nVerifique se:\n1. npm start está rodando\n2. O proxy foi reiniciado após mudanças\n3. Não há firewall bloqueando localhost:3000");
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
