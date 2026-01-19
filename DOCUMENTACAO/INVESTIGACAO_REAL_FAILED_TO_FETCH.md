# 🔍 Investigação Real: O Verdadeiro Problema e Solução

## 📋 Resumo Executivo

**Erro Recebido**: `Failed to fetch`

**Causa Real Descoberta**: O endpoint correto da API é `/f5/enviar-prestacao-contas-convenio`, mas foi removido incorretamente.

**Solução**: RESTAURAR `/f5` no endpoint - ele é obrigatório e faz parte da API oficial.

---

## 🔬 Investigação Técnica

### Teste 1: Endpoint SEM /f5 (o que estava sendo usado)
```bash
curl -X POST https://audesp-piloto.tce.sp.gov.br/enviar-prestacao-contas-convenio
```
**Resultado**: 
```
404 Not Found
The requested URL /enviar-prestacao-contas-convenio was not found on this server.
```

❌ **ENDPOINT NÃO EXISTE!**

---

### Teste 2: Endpoint COM /f5 (o correto)
```bash
curl -X POST https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio \
  -H "Authorization: Bearer fake-token" \
  -H "Accept: application/json" \
  -F "documentoJSON=@/dev/null"
```
**Resultado**:
```json
{
  "timestamp": "2026-01-15T12:07:56.565790608-03:00",
  "status": 400,
  "error": "Parte da requisição ausente",
  "message": "A parte da requisição obrigatória 'documentoJSON' está ausente ou vazia.",
  "path": "/f5/enviar-prestacao-contas-convenio"
}
```

✅ **ENDPOINT EXISTE E ESTÁ RESPONDENDO!**

O erro 400 é esperado (JSON vazio), mas prova que:
1. Endpoint está correto
2. Servidor recebeu a requisição
3. Servidor está validando o conteúdo

---

## 🚨 O Que Deu Errado (Crônica dos Eventos)

### Commit 1: "Fix: Remove /f5 path from API endpoint..."
**Mudança**:
```typescript
// ANTES (CORRETO):
const API_BASE = "https://audesp-piloto.tce.sp.gov.br/f5";

// DEPOIS (ERRADO):
const API_BASE = "https://audesp-piloto.tce.sp.gov.br";
```

**Por que errou**: 
- Assumiu que `/f5` era a causa do 403
- Não testou para confirmar se `/f5` era realmente necessário
- Removeu um path que era OBRIGATÓRIO

**Resultado**: Transmissões agora retornam 404 (endpoint não encontrado)

---

### Commit 2: "Fix: Remove /f5 proxy path rewrite..."
**Mudança no setupProxy.js**:
```javascript
// ANTES (CORRETO):
pathRewrite: { '^/proxy-f5': '/f5' }

// DEPOIS (ERRADO):
pathRewrite: { '^/proxy-f5': '' }
```

**Por que errou**:
- Consistente com o erro anterior
- Em desenvolvimento, requisições agora iam para `/enviar-prestacao-contas-convenio`
- Em produção, também iam para endpoint errado

**Resultado**: "Failed to fetch" porque endpoint não existe (404)

---

## ✅ Solução Correta (Commit 3)

### Restaurar /f5 em AMBOS os lugares:

#### 1. transmissionService.ts
```typescript
// AGORA (CORRETO):
const API_BASE = process.env.NODE_ENV === 'development'
  ? "/proxy-f5"
  : "https://audesp-piloto.tce.sp.gov.br/f5";

// Resultado em produção:
// https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio ✅
```

#### 2. setupProxy.js
```javascript
// AGORA (CORRETO):
pathRewrite: {
  '^/proxy-f5': '/f5'
}

// Resultado em desenvolvimento:
// /proxy-f5/enviar-prestacao-contas-convenio
//     ↓ (rewrite)
// /f5/enviar-prestacao-contas-convenio ✅
```

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes (Errado) | Depois (Correto) |
|---------|---|---|
| **Endpoint** | `/enviar-prestacao-contas-convenio` | `/f5/enviar-prestacao-contas-convenio` |
| **Status HTTP** | 404 Not Found | 200 OK (sucesso) ou 400/401/403 (erro específico) |
| **Mensagem** | "Failed to fetch" (vago) | Resposta JSON com detalhes do erro |
| **setupProxy.js** | `'^/proxy-f5': ''` | `'^/proxy-f5': '/f5'` |
| **transmissionService.ts** | `.../tce.sp.gov.br` | `.../tce.sp.gov.br/f5` |

---

## 🎯 Fluxo Corrigido

```
PRODUÇÃO:
transmissionService.ts
  → POST https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
    → ✅ Endpoint existe e responde

DESENVOLVIMENTO:
transmissionService.ts
  → POST /proxy-f5/enviar-prestacao-contas-convenio
    → setupProxy.js rewrite: /proxy-f5 → /f5
      → https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
        → ✅ Endpoint existe e responde
```

---

## 📝 Conclusão

### Erro de Análise Anterior:
- Assumimos que `/f5` era problemático (sem testar)
- Removemos um path que era OBRIGATÓRIO
- Resultou em 404 (endpoint não encontrado)
- Usuário viu "Failed to fetch" (genérico)

### Análise Correta (Desta Vez):
- Testamos o endpoint diretamente com curl
- Descobrimos que `/f5` é NECESSÁRIO
- Confirmamos que o servidor responde quando usado corretamente
- Restauramos a configuração correta

### Lição Aprendida:
✅ Sempre testar endpoints diretamente antes de remover paths  
✅ "Failed to fetch" pode ser 404, CORS, timeout, ou rede  
✅ Logging detalhado ajuda a identificar o verdadeiro problema  
✅ API documentation ou reverse-engineering com curl é essencial

---

## 🧪 Como Verificar a Correção

### Teste em Desenvolvimento:
```bash
# Servidor local rodando em http://localhost:3000
# Ao tentar transmitir, DevTools mostra:
[Transmission] Endpoint: /proxy-f5/enviar-prestacao-contas-convenio
# setupProxy reescreve para:
/f5/enviar-prestacao-contas-convenio
# No servidor Audesp Piloto, chega como:
https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio ✅
```

### Teste em Produção:
```bash
# Verificar diretamente:
curl https://audesp.vercel.app
# Log de transmissão mostra:
[Transmission] Endpoint: https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio ✅
```

---

**Status**: ✅ Corrigido  
**Data da Correção**: 15/01/2026  
**Commits Envolvidos**: 1029339 (restauração de /f5)  
**Endpoint Correto Confirmado**: `https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio`
