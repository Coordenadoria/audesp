# 🔍 DEBUG DE LOGIN - PASSO A PASSO

## 1️⃣ TESTE RÁPIDO COM CURL

Substitua `seu_email@test.com` e `sua_senha` com suas credenciais **REAIS**:

```bash
curl -v -X POST "https://sistemas.tce.sp.gov.br/audesp/api/login" \
  -H "Content-Type: application/json" \
  -H "x-authorization: seu_email@test.com:sua_senha" \
  -d '{"email":"seu_email@test.com","senha":"sua_senha"}'
```

**O que procurar:**
- ✅ Status `200` = API respondeu
- ❌ Status `401` = Credenciais erradas
- ❌ Status `403` = Não autorizado
- ❌ Status `500` = Erro no servidor
- ❌ Status `ECONNREFUSED` = API offline

## 2️⃣ TESTE NO NAVEGADOR (Console)

1. Abra a aplicação em `http://localhost:3000`
2. Pressione `F12` para abrir Console
3. Procure por mensagens com prefixo `[Login]`

**Esperado após tentar login:**
```
[Login] Iniciando autenticação para: seu_email@test.com
[Login] URL: https://sistemas.tce.sp.gov.br/audesp/api/login
[Login] Status: 200
[Login] ✅ Sucesso: Token recebido!
```

**Se não aparecer nada:**
- Significa que a função não foi chamada
- Verifique se o botão "Entrar" foi clicado

## 3️⃣ TESTE NA ABA NETWORK

1. Abra `F12` → Aba `Network`
2. Limpe os logs clicando no botão de lixeira
3. Tente fazer login na aplicação
4. Procure por uma requisição `POST /login` ou `POST` com URL `sistemas.tce.sp.gov.br`
5. Clique nela e veja:
   - **Headers**: Verificar se `x-authorization` está lá
   - **Request Body**: Deve conter `email` e `senha`
   - **Response**: Deve conter o token

## 4️⃣ RESPOSTAS ESPERADAS

### ✅ Sucesso (200)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nome": "Seu Nome",
  "perfil": "auditor",
  "expire_in": 3600
}
```

### ❌ Erro (401)
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### ❌ Erro (CORS)
```
Access to XMLHttpRequest at 'https://...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

## 5️⃣ AMBIENTE (.env.local)

Verifique se `.env.local` existe com:
```
REACT_APP_AUDESP_URL=https://sistemas.tce.sp.gov.br/audesp/api
```

Se não existir, criar com:
```bash
echo 'REACT_APP_AUDESP_URL=https://sistemas.tce.sp.gov.br/audesp/api' > .env.local
```

## 6️⃣ APÓS TESTES

**Copie e cole aqui:**
- Resultado do CURL (status + response)
- Mensagens do console `[Login]`
- Erro da Network tab se houver
- Qualquer erro que ver

Assim consigo identificar exatamente o problema!

---

## 🚀 SOLUÇÃO RÁPIDA (Se encontrar problema)

**Se a resposta da API usar outro nome para o token:**
```
Resposta API: {"accessToken": "xxx"}
Código espera: data.token

Solução: Editar LoginService.ts linha ~90
```

**Se CORS blocar:**
```
Adicionar ao navegador:
Instalar extensão CORS ou testar em produção (Vercel)
```

**Se credenciais erradas:**
```
Testar no curl primeiro para confirmar credenciais
Se funcionar no curl, problema é na aplicação
```
