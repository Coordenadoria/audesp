import { VercelRequest, VercelResponse } from '@vercel/node';
import * as https from 'https';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, senha, ambiente = 'piloto' } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    console.log(`[Login API] Email: ${email}, Ambiente: ${ambiente}`);

    // URL da API AUDESP
    const baseUrl = ambiente === 'producao'
      ? 'https://audesp.tce.sp.gov.br'
      : 'https://audesp-piloto.tce.sp.gov.br';

    const path = '/login';
    const authHeader = `${email}:${senha}`;
    const bodyStr = JSON.stringify({ email, senha });

    // Fazer request HTTPS
    return new Promise((resolve) => {
      const options = {
        hostname: new URL(baseUrl).hostname,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'x-authorization': authHeader,
        }
      };

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log(`[Login API] Response status: ${response.statusCode}`);
          
          let responseData: any = {};
          
          // Tentar parsear JSON
          try {
            responseData = JSON.parse(data);
          } catch {
            responseData = { raw: data };
          }

          // Tratamento de erro
          if (response.statusCode && response.statusCode >= 400) {
            return resolve(res.status(response.statusCode).json({
              success: false,
              message: responseData.message || responseData.mensagem || `HTTP ${response.statusCode}`,
            }));
          }

          // Sucesso
          return resolve(res.status(200).json({
            success: true,
            token: responseData.token || responseData.access_token,
            expire_in: responseData.expire_in || 86400,
            token_type: responseData.token_type || 'bearer',
            message: 'Autenticado com sucesso',
            usuario: {
              email,
              nome: responseData.nome || email.split('@')[0],
              perfil: responseData.perfil || 'Usuário',
            },
          }));
        });
      });

      request.on('error', (error) => {
        console.error('[Login API] Request error:', error);
        return resolve(res.status(500).json({
          success: false,
          message: `Erro ao conectar: ${error.message}`,
        }));
      });

      request.write(bodyStr);
      request.end();
    });

  } catch (error) {
    console.error('[Login API] Exception:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      message: `Erro: ${msg}`,
    });
  }
}
