# 🔍 DIAGNÓSTICO CRÍTICO: JWT NÃO CONTÉM CPF

## ⚠️ SITUAÇÃO ATUAL

Baseado nos logs de teste com `afpereira@saude.sp.gov.br`:

```
[Auth] Não foi possível extrair CPF válido do token
[Transmission] CPF informado: afpereira@saude.sp.gov.br  ← EMAIL novamente!
[Transmission] Response Status: 403
```

## 🎯 O PROBLEMA

**O servidor Audesp está retornando JWT SEM campo CPF!**

```
JWT retornado contém:
{
  "sub": "afpereira@saude.sp.gov.br",  // ← Email, não CPF
  "roles": [...],
  "iat": ...,
  "exp": ...
  // ❌ SEM "cpf", SEM "user_id", SEM "usuario"
}
```

## 💡 SOLUÇÃO

Existem 2 caminhos:

### OPÇÃO 1: Usar campo `sub` que já tem um identificador válido
Se o `sub` no JWT já é um CPF válido (11 dígitos), precisamos detectar isto.

### OPÇÃO 2: Extrair CPF da entidade Audesp
O CPF pode estar em um campo diferente que não foi testado.

### OPÇÃO 3: Contatar Audesp
Pedir para incluir CPF explícito no JWT.

---

## 🧪 COMO VERIFICAR AGORA

Com as melhorias de logging adicionadas, ao fazer login você verá:

```
[Auth] ========== JWT PAYLOAD DECODIFICADO COMPLETO ==========
[Auth] Todos os campos disponíveis: {
  "sub": "...",
  "roles": [...],
  ...
}
```

### ✅ COISAS A VERIFICAR:

1. **Procure por campo `cpf` no payload:**
   - Se existe: `"cpf": "12345678901"` → CPF encontrado!
   - Se não existe: → Precisa contatar Audesp

2. **Verifique o campo `sub`:**
   - Se é CPF (11 dígitos): `"sub": "12345678901"` → Pode ser usado!
   - Se é email: `"sub": "afpereira@saude.sp.gov.br"` → Problema

3. **Procure por outros campos:**
   - `user_id`: ?
   - `usuario`: ?
   - `document_id`: ?
   - Qualquer outro que pareça identificador

---

## 🔧 CORREÇÃO TÉCNICA JÁ IMPLEMENTADA

Adicionei logging MUITO detalhado:

```typescript
// authService.ts - Novo logging
console.log('[Auth] ========== JWT PAYLOAD DECODIFICADO COMPLETO ==========');
console.log('[Auth] Todos os campos disponíveis:', JSON.stringify(decoded, null, 2));
console.log('[Auth] Valores analisados:', {
  sub: decoded.sub,
  cpf: decoded.cpf,
  user_id: decoded.user_id,
  usuario: decoded.usuario,
  email: decoded.email,
  name: decoded.name,
  roles: decoded.roles
});
```

### Resultado esperado ao fazer login:

**Se CPF está no JWT:**
```
[Auth] ✅ CPF VÁLIDO EXTRAÍDO: {
  original: "12345678901",
  cleaned: "12345678901",
  source: "decoded.cpf"
}
```

**Se CPF NÃO está no JWT:**
```
[Auth] ⚠️  CPF NÃO ENCONTRADO NO JWT!
[Auth] Campos disponíveis no JWT: ["sub", "roles", "iat", "exp", ...]
[Auth] O servidor precisa retornar CPF em um destes campos:
[Auth]   1. cpf (ideal)
[Auth]   2. sub (Subject)
[Auth]   3. user_id
[Auth]   4. usuario
```

---

## 📋 PRÓXIMOS PASSOS

### Teste 1: Verifique os logs
1. Acesse: https://audesp.vercel.app
2. Abra console (F12)
3. Faça login
4. **Procure por:**
   ```
   [Auth] ========== JWT PAYLOAD DECODIFICADO COMPLETO ==========
   ```
5. Copie TODOS os campos que aparecer

### Teste 2: Compartilhe os logs
Copie a seção completa:
```
[Auth] Todos os campos disponíveis: { ... }
[Auth] Valores analisados: { ... }
```

### Teste 3: Identifique onde está o CPF
Vamos analisar qual campo contém o CPF real.

---

## 🚨 POSSÍVEIS SOLUÇÕES

### Se CPF está em `sub`:
```typescript
// Seria simplesmente usar decoded.sub
// Mas verificar se é realmente CPF (11 dígitos)
```

### Se CPF está em campo customizado:
```typescript
// Precisamos adicionar este campo à busca
```

### Se CPF não está em nenhum lugar:
```typescript
// Contatar Audesp: suporte@audesp.tce.sp.gov.br
// Solicitar: "Incluir campo CPF no JWT payload"
```

---

## 🎯 AÇÃO IMEDIATA

1. **Compile e deploy:**
   ```bash
   npm run build
   vercel --prod --yes
   ```

2. **Faça login com seus dados:**
   - Email: afpereira@saude.sp.gov.br
   - Senha: M@dmax2026

3. **Copie os logs completos do console (F12)**

4. **Procure especificamente por:**
   ```
   [Auth] Todos os campos disponíveis:
   ```

5. **Compartilhe comigo:**
   - Os campos que aparecem
   - Qual deles poderia ser o CPF

---

## 📞 CONTATO AUDESP

Se CPF não estiver em nenhum campo, contacte:

**Email:** suporte@audesp.tce.sp.gov.br

**Assunto:** CPF não está sendo retornado no JWT Piloto

**Mensagem:**
```
Olá,

Estou integrando aplicação com Audesp Piloto.
O JWT retornado no login contém:
- sub: afpereira@saude.sp.gov.br
- roles: [...]
- etc

MAS NÃO CONTÉM: CPF

A aplicação precisa do CPF para validar permissões.

Solicito:
1. Incluir campo "cpf" no JWT payload
2. Ou indicar qual campo contém o CPF

Usuário de teste: afpereira@saude.sp.gov.br

Obrigado,
[Seu Nome]
```

---

## ✅ RESUMO

| Situação | Ação |
|----------|------|
| CPF encontrado no JWT | ✅ Sistema funcionará (200 OK ou 403 se sem permissão real) |
| CPF em campo customizado | ✅ Adicionar à busca em authService.ts |
| CPF não está no JWT | ⚠️ Contatar Audesp para adicionar |
| Email sendo usado como CPF | ❌ Continua dando 403 (por enquanto é fallback) |

---

**Versão:** v2.0 com logging melhorado
**Status:** Aguardando resultado de teste com novos logs
**Próxima ação:** Verificar console.log completo após login
