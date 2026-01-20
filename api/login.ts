import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { email, senha, ambiente } = req.body;

    if (!email || !senha) {
      return res.status(400).send('Email e senha obrigatórios');
    }

    console.log(`[Login] Received: email=${email}, ambiente=${ambiente}`);

    // Resposta simples de teste
    return res.status(200).json({
      success: true,
      message: 'Teste OK - função invocada corretamente',
      received: { email, senha, ambiente }
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    return res.status(500).send('Internal error');
  }
}
