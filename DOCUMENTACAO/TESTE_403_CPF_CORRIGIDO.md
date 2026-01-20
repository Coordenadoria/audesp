# 🧪 TESTE: Correção do Erro 403 - CPF Inválido

## 📋 Problema Identificado

**Erro 403 Forbidden** ao transmitir Prestação de Contas

```
transmissionService.ts:164 [Transmission] ✅ Response Status: 403
"O usuário não possui autorização para realizar esta operação."
```

**Causa Raiz:** Email sendo enviado como CPF no header `X-User-CPF`

```
Login:        afpereira@saude.sp.gov.br
CPF Enviado:  afpereira@saude.sp.gov.br ❌ (EMAIL, não CPF!)
Esperado:     12345678901 ✓ (11 dígitos)
```

---

## ✅ Correção Implementada

### 1. **Nova Função: `extractCpfFromToken()`**
   - Arquivo: `src/services/authService.ts`
   - Decodifica JWT automaticamente
   - Busca CPF em múltiplos campos: `cpf`, `sub`, `user_id`, `usuario`
   - Valida formato (11 dígitos)
   - **Retorna CPF real em vez de email**

### 2. **Modificado: `EnhancedLoginComponent.tsx`**
   - Importa `extractCpfFromToken()`
   - Chama função durante login
   - Passa CPF válido para transmissão

### 3. **Melhorado: `transmissionService.ts`**
   - Logging detalhado do CPF
   - Mostra: `cpfLength`, `isCpfValidFormat`
   - Facilita debug no console

---

## 🧪 Como Testar

### Pré-requisitos
- URL: https://audesp.vercel.app
- Credentials: 
  - Email: `afpereira@saude.sp.gov.br`
  - Senha: `M@dmax2026`
  - Ambiente: **Piloto**

### Passo-a-Passo

#### 1️⃣ Acesse a Aplicação
```
https://audesp.vercel.app
```

#### 2️⃣ Abra o Console de Desenvolvedor
```
F12 (Windows/Linux) ou Cmd+Option+I (Mac)
→ Aba "Console"
→ Ctrl+L para limpar logs anteriores
```

#### 3️⃣ Faça Login
```
Email:    afpereira@saude.sp.gov.br
Senha:    M@dmax2026
Ambiente: Piloto
Clique: "Entrar"
```

#### 4️⃣ Verifique Logs de Extração de CPF
No console, procure por: `[Auth] CPF extraído:`

**Esperado:**
```javascript
[Auth] CPF extraído: {
  cpfFromToken: "12345678901",
  email: "afpereira@saude.sp.gov.br",
  finalCpf: "12345678901"
}

[Auth] JWT Payload decodificado: {
  keys: ["cpf", "email", "sub", ...],
  sub: "12345678901",
  cpf: "12345678901",
  ...
}
```

✅ **Se mostrar CPF com 11 dígitos:** Tudo OK!
❌ **Se mostrar null ou email:** Contacte suporte Audesp

#### 5️⃣ Preencha o Formulário
- Selecione: "Prestação de Contas de Convênio"
- Preencha todos os campos obrigatórios

#### 6️⃣ Clique em "Transmitir"
Aguarde a resposta do servidor

#### 7️⃣ Verifique Logs de Transmissão
No console, procure por: `[Transmission] Token info:`

**Esperado:**
```javascript
[Transmission] Token info: {
  hasToken: true,
  tokenLength: 311,
  cpf: "12345678901",
  cpfType: "string",
  cpfLength: 11,
  isCpfValidFormat: true  ← CRÍTICO!
}
```

✅ **isCpfValidFormat: true** = CPF válido!
❌ **isCpfValidFormat: false** = CPF inválido ou com formato incorreto

#### 8️⃣ Verifique Resposta do Servidor
No console, procure por: `[Transmission] ✅ Response Status:`

---

## 📊 Possíveis Resultados

### ✅ Resultado 1: Status 200 OK
```javascript
[Transmission] ✅ Response Status: 200

Response: {
  "protocolo": "F5ABC123...",
  "mensagem": "Documento enviado com sucesso"
}
```

**Significado:** 🎉 **PROBLEMA RESOLVIDO!**
- Sistema funcionando corretamente
- CPF extraído corretamente
- Transmissão aceita pela Audesp

---

### ⚠️ Resultado 2: Status 400 Bad Request
```javascript
[Transmission] ✅ Response Status: 400

Response: {
  "status": 400,
  "error": "Bad Request",
  "message": "Campos obrigatórios faltando..."
}
```

**Significado:** Erro na validação de dados (schema)

**Ação:**
1. Verifique no console: `cpfLength` deve ser 11
2. Se `cpfLength: 11` e `isCpfValidFormat: true`:
   - Problema está nos dados do formulário
   - Preencha todos os campos obrigatórios
   - Verifique formato dos dados

---

### ⛔ Resultado 3: Status 403 Forbidden COM CPF Correto
```javascript
[Transmission] Token info: {
  cpf: "12345678901",
  cpfLength: 11,
  isCpfValidFormat: true  ← CPF está CORRETO!
}

[Transmission] ✅ Response Status: 403

Response: {
  "status": 403,
  "error": "Forbidden",
  "message": "O usuário não possui autorização..."
}
```

**Significado:**
- ✅ CPF está sendo enviado CORRETAMENTE
- ❌ Mas permissões NÃO estão ativadas na Audesp

**Ação:**
1. Anote o CPF exato: `12345678901`
2. Contate suporte Audesp: `suporte@audesp.tce.sp.gov.br`
3. Compartilhe:
   - CPF: `12345678901`
   - Tipo de Documento: `Prestação de Contas de Convênio`
   - Timestamp: `2026-01-19T...`
   - Mencione: "Erro 403 mesmo com X-User-CPF correto"

**Diferença IMPORTANTE:**
- **ANTES:** CPF = email → 403 (CPF inválido)
- **DEPOIS:** CPF = 12345678901 → 403 (Permissão real negada)

---

### 🔌 Resultado 4: Failed to Fetch
```javascript
[Transmission] Failed to fetch
```

**Significado:** Problema de rede ou proxy

**Ação:**
1. Verifique URL: https://audesp.vercel.app
2. Teste em navegador diferente
3. Limpe cache: Ctrl+Shift+Delete
4. Tente novamente em 5 minutos

---

## 💾 Capturando Evidência

Para enviar evidência de teste bem-sucedido:

### Opção 1: Screenshot
```
1. Abra console (F12)
2. Clique com botão direito → "Copy log"
3. Cole em arquivo .txt
4. Faça screenshot
```

### Opção 2: Save Console
```
1. Abra console (F12)
2. Clique com botão direito → "Save as..."
3. Salve como: console_test_afpereira.txt
```

### Logs Importantes a Compartilhar
```
1. [Auth] CPF extraído: { ... }
2. [Transmission] Token info: { cpfLength: 11, isCpfValidFormat: true }
3. [Transmission] Response Status: [200 ou 400 ou 403]
4. Response body completo
```

---

## ❓ Troubleshooting

### P: Vejo `cpfFromToken: null` no console
**R:** O JWT não contém CPF em nenhum dos campos esperados

**Solução:**
1. Contate Audesp: `suporte@audesp.tce.sp.gov.br`
2. Peça para incluir campo `cpf` no payload do token JWT
3. Ou confirme em qual campo está o CPF

---

### P: Vejo `isCpfValidFormat: false`
**R:** CPF extraído não tem 11 dígitos

**Solução:**
1. Verifique se realmente é um CPF (não email)
2. Contate Audesp para confirmar formato do JWT
3. Audesp pode estar retornando formato diferente

---

### P: Ainda recebo 403 mesmo com CPF correto
**R:** Permissão real não ativada na Audesp

**Solução:**
1. Faça screenshot do console mostrando `isCpfValidFormat: true`
2. Contate `suporte@audesp.tce.sp.gov.br`
3. Compartilhe: CPF, tipo de documento, timestamp
4. Mencione: "Erro 403 mesmo com header X-User-CPF correto (11 dígitos)"

---

### P: Failed to fetch no console
**R:** Problema de rede ou proxy

**Solução:**
1. ✅ Verifique se está em: https://audesp.vercel.app
2. ✅ Teste em navegador diferente (Chrome, Firefox, Safari)
3. ✅ Limpe cache: Ctrl+Shift+Delete
4. ✅ Tente novamente em 5 minutos

---

## 📝 Resumo das Mudanças

### Arquivos Modificados
```
✅ src/services/authService.ts
   - Adicionado: function extractCpfFromToken(token)
   - Decodifica JWT automaticamente
   - Busca CPF em múltiplos campos
   - ~50 linhas adicionadas

✅ src/components/EnhancedLoginComponent.tsx
   - Importado: extractCpfFromToken
   - Modificado: handleLogin()
   - const cpf = extractCpfFromToken(token.token) || email
   - 5 linhas modificadas

✅ src/services/transmissionService.ts
   - Melhorado: console.log para CPF
   - Adicionados: cpfType, cpfLength, isCpfValidFormat
   - 5 linhas modificadas
```

### Git Commit
```
Commit: 4f2011f
Mensagem: 🔧 Fix: CPF sendo enviado como EMAIL no header X-User-CPF
Branch: main
Push: Sucesso
Deploy: Vercel (https://audesp.vercel.app)
```

---

## 🎯 Próxima Ação

1. ✅ Acesse: https://audesp.vercel.app
2. ✅ Faça login com `afpereira@saude.sp.gov.br`
3. ✅ Abra console (F12)
4. ✅ Verifique logs de CPF extraído
5. ✅ Tente transmitir uma Prestação de Contas
6. ✅ Compartilhe resultado + logs completos

**Qualquer dúvida:** Envie os logs do console (F12) completos!

---

## 📞 Suporte

- **Aplicação:** https://audesp.vercel.app
- **Suporte Audesp:** suporte@audesp.tce.sp.gov.br
- **GitHub:** https://github.com/Coordenadoria/audesp
- **Commit:** 4f2011f

---

**Data do Teste:** 2026-01-19
**Status:** Pronto para Teste ✅
**Build:** Compiled successfully (ZERO errors)
