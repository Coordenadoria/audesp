
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  
  // 1. PROXY LOGIN 
  // Target: https://audesp-piloto.tce.sp.gov.br/login
  app.use(
    '/proxy-login',
    createProxyMiddleware({
      target: 'https://audesp-piloto.tce.sp.gov.br',
      changeOrigin: true,
      secure: false, // Ignore SSL errors for government servers
      pathRewrite: {
        '^/proxy-login': '', // Remove prefix
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // Standard headers
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        proxyReq.setHeader('Connection', 'close');
        proxyReq.setHeader('Origin', 'https://audesp-piloto.tce.sp.gov.br');
        proxyReq.setHeader('Referer', 'https://audesp-piloto.tce.sp.gov.br/');
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error] Login:', err);
        if (!res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
              message: `Erro de conexão com Audesp (Proxy Login): ${err.message}`,
              code: err.code 
          }));
        }
      }
    })
  );

  // 2. PROXY TRANSMISSÃO
  // Target: https://audesp-piloto.tce.sp.gov.br/f5/...
  app.use(
    '/proxy-f5',
    createProxyMiddleware({
      target: 'https://audesp-piloto.tce.sp.gov.br',
      changeOrigin: true, // Auto-updates Host header
      secure: false,
      proxyTimeout: 60000,
      timeout: 60000,
      pathRewrite: {
        '^/proxy-f5': '/f5', 
      },
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // Standard headers
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        proxyReq.setHeader('Connection', 'close');
        
        // Force Origin to match target to bypass CSRF/WAF checks
        proxyReq.setHeader('Origin', 'https://audesp-piloto.tce.sp.gov.br');
        proxyReq.setHeader('Referer', 'https://audesp-piloto.tce.sp.gov.br/f5/');
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error] Transmission:', err);
        if (!res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
              status: 'Rejeitado',
              protocolo: 'ERRO-REDE',
              tipoDocumento: 'Erro de Conexão',
              erros: [{
                  mensagem: `Erro de conexão: ${err.message}`,
                  classificacao: 'Impedittivo',
                  codigoErro: 'NET-001',
                  campo: 'Proxy',
                  origem: 'Localhost'
              }]
          }));
        }
      }
    })
  );
};
