module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { email, senha, ambiente } = req.body;

    if (!email || !senha) {
      return res.status(400).send('Email e senha obrigatórios');
    }

    console.log(`[Login API] Request received: ${email}, ${ambiente}`);

    // Resposta de teste
    return res.status(200).json({
      success: true,
      message: 'Login API funcionando',
      data: { email, ambiente }
    });

  } catch (error) {
    console.error('[Login API] Error:', error);
    return res.status(500).send('Internal error: ' + error.message);
  }
};
