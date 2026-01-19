# Diagrama Visual: Solução do "Failed to Fetch"

## 1. ANTES: Fluxo Problemático

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Localhost)                        │
│                                                                 │
│  Usuário clica em "Validar e Enviar"                          │
│                    ↓                                            │
│  transmissionService.ts                                        │
│    - fetch(fullUrl, requestConfig)                            │
│    - SEM TIMEOUT ← ⚠️ PROBLEMA 1                              │
│    - SEM DIAGNOSTICO DETALHADO ← ⚠️ PROBLEMA 2                │
│                    ↓                                            │
└─────────────────────────────────────────────────────────────────┘
                      ↓ /proxy-f5/enviar-prestacao-contas-convenio
┌─────────────────────────────────────────────────────────────────┐
│               setupProxy.js (pathRewrite)                        │
│                                                                 │
│  '^/proxy-f5': '/f5' ← ⚠️ PROBLEMA 3                           │
│       ↓                                                         │
│  Converte:                                                      │
│  /proxy-f5/enviar-prestacao-contas-convenio                    │
│    ↓ (ADICIONA /f5 INDESEJADAMENTE)                            │
│  /f5/enviar-prestacao-contas-convenio                          │
│                    ↓                                            │
└─────────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│           AUDESP Piloto (audesp-piloto.tce.sp.gov.br)          │
│                                                                 │
│  POST /f5/enviar-prestacao-contas-convenio ← NÃO EXISTE!      │
│                    ↓                                            │
│  ❌ 403 Forbidden OU                                           │
│  ❌ 404 Not Found  OU                                          │
│  ❌ Failed to fetch (CORS)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Localhost)                        │
│                                                                 │
│  Mensagem genérica: "Failed to fetch"                         │
│  Usuário confuso: "O que significa? Como fix?"                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DEPOIS: Fluxo Correto

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Produção)                         │
│                    https://audesp.vercel.app                    │
│                                                                 │
│  Usuário clica em "Validar e Enviar"                          │
│                    ↓                                            │
│  transmissionService.ts                                        │
│    - AbortController + timeout 30s ✅ FIX 1                    │
│    - Logging detalhado ✅ FIX 2                                │
│    - Diagnóstico específico ✅ FIX 3                           │
│    - try/catch com mensagens úteis ✅ FIX 4                    │
│                    ↓                                            │
│  fetch(fullUrl, {                                             │
│    signal: controller.signal,  // Aborta se timeout           │
│    credentials: 'include',     // Para CORS                   │
│    body: formData               // Multipart                  │
│  })                                                            │
│                    ↓                                            │
└─────────────────────────────────────────────────────────────────┘
                      ↓
                ✅ EM PRODUÇÃO: Sem proxy (direto para API)
                
┌─────────────────────────────────────────────────────────────────┐
│           AUDESP Piloto (audesp-piloto.tce.sp.gov.br)          │
│                                                                 │
│  POST /enviar-prestacao-contas-convenio  ✅ CORRETO!          │
│                    ↓                                            │
│  ✅ 200 OK (Sucesso) com protocolo  OU                        │
│  ✅ 422 Unprocessable Entity (erro de validação específico)   │
│  ✅ 401 Unauthorized (token inválido/expirado)               │
│  ✅ 403 Forbidden (permissão insuficiente)                   │
│  ✅ Qualquer outra resposta específica                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Produção)                         │
│                                                                 │
│  SE SUCESSO (200 OK):                                         │
│  ✅ Protocolo: 2024.1234567                                  │
│  ✅ Status: Recebido                                          │
│  ✅ Salvo no histórico local                                  │
│                                                                 │
│  SE ERRO:                                                      │
│  Mensagem específica:                                          │
│    • "❌ TIMEOUT: Servidor offline"                           │
│    • "❌ ERRO DE CONEXÃO: Problemas CORS"                    │
│    • "❌ 401: Token inválido"                                │
│    • "❌ 403: Sem permissão"                                 │
│    • "❌ 422: Dados inválidos: [campo X, Y, Z]"            │
│  + Logs detalhados no Console do navegador                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Comparação: setupProxy.js

### ANTES (Errado):
```javascript
app.use('/proxy-f5',
  createProxyMiddleware({
    target: 'https://audesp-piloto.tce.sp.gov.br',
    pathRewrite: {
      '^/proxy-f5': '/f5'  // ⚠️ ADICIONA /f5
    }
  })
);

Exemplo de rewrite:
  /proxy-f5/enviar-prestacao-contas-convenio
       ↓ (pathRewrite)
  /f5/enviar-prestacao-contas-convenio ← ERRADO!
```

### DEPOIS (Correto):
```javascript
app.use('/proxy-f5',
  createProxyMiddleware({
    target: 'https://audesp-piloto.tce.sp.gov.br',
    pathRewrite: {
      '^/proxy-f5': ''  // ✅ APENAS REMOVE /proxy-f5
    }
  })
);

Exemplo de rewrite:
  /proxy-f5/enviar-prestacao-contas-convenio
       ↓ (pathRewrite)
  /enviar-prestacao-contas-convenio ← CORRETO!
```

---

## 4. Comparação: Error Handling

### ANTES (Genérico):
```typescript
try {
  const response = await fetch(fullUrl, requestConfig);
  // ... processa resposta
} catch (error: any) {
  console.error("[Transmission Error]", error);
  throw error;  // ← Erro genérico: "Failed to fetch"
}

❌ Resultado: Mensagem obscura para o usuário
```

### DEPOIS (Específico):
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(fullUrl, {
    ...requestConfig,
    signal: controller.signal  // ← Timeout protection
  });
  clearTimeout(timeout);
  
  // ... processa resposta
  
} catch (error: any) {
  if (error.name === 'AbortError') {
    // Timeout específico
    throw new Error("❌ TIMEOUT (30s): Servidor não respondeu...");
  } else if (error.message?.includes('Failed to fetch')) {
    // CORS ou Network específico
    throw new Error("❌ ERRO DE CONEXÃO (CORS/Network): ...");
  } else if (error.message?.includes('NetworkError')) {
    // Problema de rede específico
    throw new Error("❌ ERRO DE REDE: ...");
  } else {
    // Outros erros com contexto
    throw new Error("❌ ERRO DESCONHECIDO: " + error.message);
  }
}

✅ Resultado: Mensagem específica + sugestões de solução
```

---

## 5. Fluxo de Diagnóstico com as Novas Mensagens

```
┌─────────────────────────────────────────────────────────────┐
│         Usuário tenta transmitir em Produção                │
│         https://audesp.vercel.app                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  transmissionService.ts
                   │  .sendPrestacaoContas()
                   └────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  Inicia fetch com AbortController      │
        │  Timeout: 30 segundos                 │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  POST https://audesp-piloto...        │
        │  /enviar-prestacao-contas-convenio    │
        └───────────────────────────────────────┘
                            ↓
        ┌─────────────────────────────────────────────────────┐
        │           Aguarda resposta...                        │
        │  0s ────────────── 15s ────────────── 30s ────────  │
        │     ✅ OK (Sucesso)                   |  ❌ ABORT   │
        └─────────────────────────────────────────────────────┘
                            ↓
            ┌───────────────────────┬───────────────────────┐
            │                       │                       │
        ✅ SUCESSO           🕐 TIMEOUT            ❌ ERRO REDE
            ↓                   ↓                       ↓
    Status 200-299     AbortError triggered      Failed to fetch
            ↓                   ↓                       ↓
    "Protocolo:        "❌ TIMEOUT (30s):       "❌ ERRO DE
     2024.123..."        Servidor offline"       CONEXÃO (CORS)"
                                ↓                       ↓
                    Tente em alguns            Verifique internet
                    segundos ou               Tente em produção
                    verifique conectividade   Não use localhost
```

---

## 6. Tabela de Decisão: O Que Significa Cada Erro

| Mensagem | Causa Provável | O Que Fazer |
|----------|---|---|
| **✅ Protocolo: 20XX.XXXXX** | Sucesso! | Nada, está funcionando |
| **❌ TIMEOUT (30s)** | Servidor offline/lento | Tente em alguns segundos |
| **❌ ERRO DE CONEXÃO (CORS)** | CORS/Network blocked | Use produção, não localhost |
| **❌ ERRO DE REDE** | Internet desconectada | Verifique internet |
| **❌ 401 Unauthorized** | Token inválido/expirado | Faça login novamente |
| **❌ 403 Forbidden** | Sem permissão | Verifique permissões |
| **❌ 422 Unprocessable** | Dados inválidos | Verifique campos |
| **❌ TIPO/CONFIGURAÇÃO** | Problema técnico | Verifique console |

---

## 7. Checklist: Teste a Solução

- [ ] Acesse https://audesp.vercel.app (produção)
- [ ] Faça login com suas credenciais
- [ ] Preencha os formulários (ou carregue amostra)
- [ ] Clique em "Validar e Enviar"
- [ ] Abra DevTools com F12
- [ ] Vá para Console
- [ ] Procure por logs com `[Transmission`
- [ ] Se erro, anote a mensagem `[Transmission Diagnostic]`
- [ ] Se timeout após 30s, é erro de servidor
- [ ] Se "CORS/Network", pode ser problema de conectividade
- [ ] Compartilhe logs com suporte se problema persistir

---

**Versão**: 2.0 (Com Timeout e Diagnóstico)  
**Data**: 15/01/2026  
**Status**: ✅ Implementado e Deployado
