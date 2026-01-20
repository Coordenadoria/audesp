import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy API para Login AUDESP
 * Resolves CORS issues by making requests from server-side
 * 
 * POST /api/login
 * Body: { email: string, senha: string, ambiente: 'piloto' | 'producao' }
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, senha, ambiente = 'piloto' } = req.body;

    // Validar entrada
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Determinar URL baseado no ambiente
    const baseUrl = ambiente === 'producao'
      ? 'https://audesp.tce.sp.gov.br'
      : 'https://audesp-piloto.tce.sp.gov.br';

    const apiUrl = `${baseUrl}/login`;
    const authHeader = `${email}:${senha}`;

    console.log(`[API Proxy] Login attempt for: ${email}`);
    console.log(`[API Proxy] URL: ${apiUrl}`);
    console.log(`[API Proxy] Ambiente: ${ambiente}`);

    // Fazer requisição para API AUDESP
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization': authHeader,
      },
      body: JSON.stringify({ email, senha }),
    });

    console.log(`[API Proxy] Response status: ${response.status}`);

    // Ler resposta
    let data: any = {};
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[API Proxy] Error parsing JSON:', parseError);
        const text = await response.text();
        data = { raw: text };
      }
    } else {
      const text = await response.text();
      data = { raw: text };
    }

    // Erro na resposta
    if (!response.ok) {
      console.error(`[API Proxy] Error response:`, data);
      return res.status(response.status).json({
        success: false,
        message: data.message || data.mensagem || data.msg || `HTTP ${response.status} ${response.statusText}`,
        campos_invalidos: data.campos_invalidos || data.campos_inválidos || data.erros,
      });
    }

    // Sucesso
    console.log('[API Proxy] Login successful');
    return res.status(200).json({
      success: true,
      token: data.token || data.access_token || data.jwt,
      expire_in: data.expire_in || data.expires_in || 86400,
      token_type: data.token_type || 'bearer',
      message: 'Autenticado com sucesso',
      usuario: {
        email,
        nome: data.nome || data.usuario || data.name || email.split('@')[0],
        perfil: data.perfil || data.role || data.permission || 'Usuário',
        cpf: data.cpf || data.document,
      },
    });

  } catch (error) {
    console.error('[API Proxy] Critical error:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    return res.status(500).json({
      success: false,
      message: `Erro ao conectar com AUDESP: ${message}`,
      error: process.env.NODE_ENV === 'development' ? message : undefined,
    });
  }
}
