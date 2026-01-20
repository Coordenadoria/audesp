# 🔧 TROUBLESHOOTING - LOGIN NÃO ESTÁ FUNCIONANDO

## ✅ Passos para Debugar

### 1️⃣ Abrir Console do Navegador (F12)

Pressione **F12** e vá para a aba **Console**

### 2️⃣ Tentar Login

- Email: seu email real
- Senha: sua senha real
- Clique "Entrar"

### 3️⃣ Procurar por Logs no Console

Você deve ver mensagens como:

```
[Login] POST https://sistemas.tce.sp.gov.br/audesp/api/login
[Login] Status: 200
[Login] Response: {"token": "eyJ..."}
[Login] Sucesso!
```

---

## ❌ Se VER ERRO:

### Erro: "Erro de conexão com AUDESP"
```
[Login] Erro de conexão: fetch failed
```

**Solução**:
1. Verifique sua internet
2. URL está correta em `.env.local`?
3. API AUDESP está respondendo? Teste com curl

### Teste com CURL:
```bash
curl -X POST "https://sistemas.tce.sp.gov.br/audesp/api/login" \
  -H "Content-Type: application/json" \
  -H "x-authorization: seu_email@exemplo.com:sua_senha" \
  -d '{"email":"seu_email@exemplo.com","senha":"sua_senha"}'
```

---

### Erro: "Email inválido"
```
[Login] Falha: Email inválido
```

**Solução**:
- Email precisa ter formato válido: `usuario@dominio.com`
- Sem espaços
- Sem caracteres especiais (exceto ponto e hífen)

---

### Erro: "Email não encontrado" ou "Credenciais inválidas"
```
[Login] Falha: Email não encontrado
```

**Solução**:
1. Verifique email está correto (case-sensitive às vezes)
2. Confirme com TCE-SP se está registrado no sistema
3. Tente com email diferente

---

### Erro: "Senha incorreta"
```
[Login] Falha: Senha incorreta
```

**Solução**:
1. Verifique se digit corretamente (case-sensitive)
2. Sem espaços no começo/fim
3. Solicite reset de senha ao TCE-SP

---

### Erro: "HTTP 403" ou "HTTP 401"
```
[Login] Status: 403
[Login] Falha: Erro: Forbidden
```

**Solução**:
1. Credenciais inválidas
2. Usuário sem permissão
3. Contate TCE-SP para confirmar acesso

---

### Erro: "Erro ao parsear JSON"
```
[Login] Erro ao parsear JSON: SyntaxError...
```

**Solução**:
- API retornou resposta não-JSON
- Pode ser HTML (erro no servidor)
- Verifique URL em `.env.local`
- API está realmente respondendo?

---

## 🔍 Verificar Variáveis de Ambiente

### No Console do Navegador:
```javascript
// Ver se .env.local foi carregado
console.log(process.env.REACT_APP_AUDESP_URL)
console.log(process.env.REACT_APP_AUDESP_API_KEY)
```

Deve mostrar:
```
https://sistemas.tce.sp.gov.br/audesp/api
(vazio ou sua chave)
```

---

## ⚙️ Verificar Configuração

### Arquivo `.env.local` deveria ter:
```
REACT_APP_AUDESP_URL=https://sistemas.tce.sp.gov.br/audesp/api
```

### Se estiver errado:
1. Edite `.env.local`
2. Parar servidor: `Ctrl+C`
3. Reiniciar: `npm start`
4. Tentar login novamente

---

## 🔐 Verificar localStorage Após Login Bem-Sucedido

### No Console:
```javascript
localStorage.getItem('audesp_token')    // Deve ter token
localStorage.getItem('audesp_email')    // Seu email
localStorage.getItem('audesp_perfil')   // Seu perfil
localStorage.getItem('audesp_nome')     // Seu nome
```

Se retornar `null`, login falhou e tokens não foram salvos.

---

## 📊 Fluxo Esperado

```
1. Clica "Login AUDESP"
   └─ Modal abre

2. Insere email + senha
   └─ Console: [Login] POST...

3. Clica "Entrar"
   └─ Console: [Login] Status: 200

4. Se sucesso (HTTP 200)
   └─ Console: [Login] Sucesso!
   └─ localStorage recebe token
   └─ Modal fecha após 2s

5. Header mostra email autenticado
   └─ ✅ Você está logado!
```

---

## 🆘 Se Nada Acima Funcionar

### Informações para Debug:
```javascript
// Abra Console (F12) e execute:

console.log('URL:', process.env.REACT_APP_AUDESP_URL)
console.log('API Key:', process.env.REACT_APP_AUDESP_API_KEY)
console.log('localStorage:', localStorage)
console.log('Ambiente:', process.env.NODE_ENV)
```

**Copie a saída e envie para suporte@tce.sp.gov.br junto com**:
- Email tentado
- Mensagem de erro exata
- Saída do console (F12)

---

## 📞 Contato TCE-SP

**Email**: suporte@tce.sp.gov.br
**Telefone**: (11) 3293-3000
**Horário**: Seg-Sex, 8h-17h

---

## ✅ Checklist de Verificação

- [ ] Tenho credenciais reais do TCE-SP?
- [ ] `.env.local` foi criado?
- [ ] `REACT_APP_AUDESP_URL` está certo?
- [ ] Servidor foi reiniciado após `.env.local`?
- [ ] Console mostra logs `[Login]`?
- [ ] Email tem formato válido?
- [ ] localStorage recebe token após sucesso?

---

**Última atualização**: 2024
**Versão**: 3.0
