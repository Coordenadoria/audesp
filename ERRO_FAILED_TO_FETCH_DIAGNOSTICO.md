# Diagnóstico e Solução: Erro "Failed to Fetch"

## O Que É "Failed to Fetch"?

"Failed to fetch" é um erro genérico do navegador que ocorre quando o JavaScript não consegue completar uma requisição HTTP. É como um "não consegui conectar" - pode ter várias causas diferentes.

### Causas Comuns:
1. **Servidor indisponível** - Audesp Piloto offline
2. **CORS bloqueado** - Navegador não permite requisição cross-origin
3. **Timeout** - Servidor demorou demais para responder
4. **Rede/Conectividade** - Problema de internet
5. **Configuração incorreta** - URL, token ou headers inválidos

---

## Onde Estava o Problema?

### ❌ ANTES (Problemático):

#### setupProxy.js:
```javascript
pathRewrite: {
  '^/proxy-f5': '/f5',  // ← PROBLEMA: Adicionava /f5 indesejadamente
}
```

#### transmissionService.ts:
```typescript
const response = await fetch(fullUrl, requestConfig);
// ← SEM TIMEOUT: Se servidor não responde, fica preso indefinidamente
// ← SEM DIAGNOSTICO: Erro "Failed to fetch" sem contexto útil
```

### Fluxo Problemático:
```
Localhost → /proxy-f5/enviar-prestacao-contas-convenio
  ↓ (setupProxy reescreve)
Localhost → https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
  ↓ (ERRADO! /f5 não existe)
Servidor → ❌ 403 ou Failed to fetch
```

---

## ✅ Soluções Implementadas

### 1. Corrigir o Proxy Path Rewrite

**setupProxy.js - ANTES:**
```javascript
pathRewrite: {
  '^/proxy-f5': '/f5',  // Adicionava /f5
}
```

**setupProxy.js - DEPOIS:**
```javascript
pathRewrite: {
  '^/proxy-f5': '',  // Remove o prefix, nada mais adicionado
}
```

**Efeito:**
```
Localhost → /proxy-f5/enviar-prestacao-contas-convenio
  ↓ (setupProxy reescreve corretamente)
https://audesp-piloto.tce.sp.gov.br/enviar-prestacao-contas-convenio
  ↓ (CORRETO!)
Servidor → ✅ 200 OK ou erro específico
```

### 2. Adicionar Timeout com AbortController

**transmissionService.ts - ANTES:**
```typescript
const response = await fetch(fullUrl, requestConfig);
// Sem proteção contra travamento
```

**transmissionService.ts - DEPOIS:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos

const response = await fetch(fullUrl, {
  ...requestConfig,
  signal: controller.signal  // Aborta se timeout
});

clearTimeout(timeout);  // Limpa se respondeu
```

**Efeito:**
- Se servidor não responder em 30s → Erro claro: "TIMEOUT"
- Se responder a tempo → Sucesso normal

### 3. Melhorar Diagnóstico de Erros

**transmissionService.ts - NOVO:**

```typescript
} catch (error: any) {
  if (error.name === 'AbortError') {
    // ❌ TIMEOUT (30s): Servidor não respondeu...
  } else if (error.message?.includes('Failed to fetch')) {
    // ❌ ERRO DE CONEXÃO (CORS/Network): Servidor offline ou CORS bloqueado
  } else if (error.message?.includes('NetworkError')) {
    // ❌ ERRO DE REDE: Problema de internet
  } else if (error.message?.includes('TypeError')) {
    // ❌ ERRO DE TIPO/CONFIGURAÇÃO: Problema na requisição
  }
}
```

**Efeito:**
Usuário agora vê mensagem específica explicando o problema e sugestões de solução.

---

## O Erro "Failed to Fetch" Explicado Por Tipo

### 1️⃣ **Tipo: TIMEOUT**
```
Mensagem: ❌ TIMEOUT (30s): Servidor não respondeu em tempo hábil
Causa: audesp-piloto.tce.sp.gov.br está offline ou muito lento
Solução:
  • Verifique se https://audesp-piloto.tce.sp.gov.br está online
  • Tente novamente em alguns segundos
```

### 2️⃣ **Tipo: CORS/Network**
```
Mensagem: ❌ ERRO DE CONEXÃO (CORS/Network)
Causas Possíveis:
  • Servidor indisponível
  • CORS não está configurado no servidor
  • Domínio audesp.vercel.app não autorizado no CORS
  • Bloqueio de firewall/proxy
Solução:
  • Confirme https://audesp-piloto.tce.sp.gov.br acessível
  • Use produção (https://audesp.vercel.app), não localhost
  • Verifique se CORS permite audesp.vercel.app
```

### 3️⃣ **Tipo: NetworkError**
```
Mensagem: ❌ ERRO DE REDE
Causa: Problemas de conectividade (internet, firewall)
Solução:
  • Verifique conexão de internet
  • Tente novamente em alguns segundos
  • Se persistir, contate administrador de rede
```

### 4️⃣ **Tipo: TypeError**
```
Mensagem: ❌ ERRO DE TIPO/CONFIGURAÇÃO
Causa: Problema na construção da requisição
Solução:
  • Verifique se token é válido
  • Verifique se dados são válidos
  • Verifique console do navegador para mais detalhes
```

---

## Fluxo de Diagnóstico

### Quando você vir "Failed to fetch":

```
┌─ Tentar transmitir
│
├─ ERRO: Failed to fetch
│
├─ Abrir DevTools (F12) → Console
│
├─ Procurar logs com [Transmission Diagnostic]
│  ├─ Se disser "TIMEOUT" → Servidor offline
│  ├─ Se disser "CORS/Network" → Verifique conectividade
│  ├─ Se disser "ERRO DE REDE" → Problema de internet
│  └─ Se disser "TIPO/CONFIGURAÇÃO" → Problema de requisição
│
├─ Se ainda não souber:
│  ├─ Verifique se audesp-piloto.tce.sp.gov.br está online
│  ├─ Tente em produção (não localhost)
│  ├─ Verifique logs detalhados em DevTools → Console
│  └─ Contate suporte com logs do console
│
└─ Tente novamente
```

---

## Como Ver os Logs Detalhados

### 1. Abra o DevTools do Navegador:
- **Chrome/Edge**: Pressione `F12` ou `Ctrl+Shift+I`
- **Firefox**: Pressione `F12` ou `Ctrl+Shift+I`
- **Safari**: Menu → Develop → Show Web Inspector

### 2. Vá para a aba **Console**

### 3. Procure por logs `[Transmission...]`:
```
[Transmission] Enviando para: https://audesp-piloto.tce.sp.gov.br/enviar-prestacao-contas-convenio
[Transmission] Token prefix: eyJhbGciOiJIUzI1...
[Transmission] Request headers: {...}
[Transmission] Endpoint: https://...
[Transmission] Method: POST
[Transmission] Environment: production

[Transmission Diagnostic]
❌ TIMEOUT (30s): Servidor não respondeu em tempo hábil
...

[Transmission Debug Info]
{
  url: "https://audesp-piloto.tce.sp.gov.br/enviar-prestacao-contas-convenio",
  method: "POST",
  tokenPrefix: "eyJhbGci...",
  environment: "production",
  errorName: "AbortError",
  errorMessage: "The operation was aborted",
  errorStack: "..."
}
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `setupProxy.js` | Removeu `/f5` do pathRewrite | Eliminava path inválido |
| `transmissionService.ts` | Adicionou AbortController com timeout de 30s | Evita travamento infinito |
| `transmissionService.ts` | Expandiu tratamento de erros | Diagnóstico específico |
| `transmissionService.ts` | Adicionou logging detalhado | Facilita debugging |

---

## Próximas Etapas

### Teste Imediato:
1. ✅ Sistema já está deployado em produção
2. 🧪 Tente transmitir novamente
3. 📊 Se erro persistir, veja os logs no Console (F12)
4. 📋 Compartilhe o log `[Transmission Diagnostic]` com o suporte

### Se Continuar com Problemas:
- [ ] Verifique se https://audesp-piloto.tce.sp.gov.br está online
- [ ] Tente em https://audesp.vercel.app (produção)
- [ ] Não use localhost
- [ ] Abra DevTools (F12) → Console antes de tentar
- [ ] Copie todos os logs `[Transmission...]` 
- [ ] Envie para suporte técnico

---

## Referências Técnicas

### AbortController API:
- Permite abortar requisições fetch
- Perfeito para implementar timeouts
- Compatível com navegadores modernos

### CORS (Cross-Origin Resource Sharing):
- Mecanism de segurança do navegador
- Bloqueia requisições para domínios diferentes
- Requer headers especiais do servidor

### Proxy Setup:
- `setupProxy.js` redireciona requisições em desenvolvimento
- Em produção, requisições vão direto para audesp-piloto.tce.sp.gov.br
- Path rewrite deve ser exato (não adicionar segmentos inválidos)

---

**Última Atualização**: 15/01/2026  
**Status**: ✅ Implementado e Deployado  
**Ambiente**: Production (https://audesp.vercel.app)
