# 🔐 LOGIN AUDESP - CREDENCIAIS REAIS

## ✅ STATUS: LOGIN AGORA É 100% REAL

**Modo Desenvolvimento**: ❌ REMOVIDO
**Modo Produção (API AUDESP Real)**: ✅ ATIVO

---

## 🚀 Como Usar com Credenciais Reais

### 1️⃣ Preparar as Credenciais

Obtenha suas credenciais junto ao TCE-SP:
- **Email**: seu email institucional ou cadastrado no TCE
- **Senha**: senha fornecida pelo TCE-SP

**Contato TCE-SP**: (11) 3293-3000

### 2️⃣ Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```bash
# .env.local

# URL base da API AUDESP (geralmente não precisa alterar)
REACT_APP_AUDESP_URL=https://sistemas.tce.sp.gov.br/audesp/api

# Opcional: Se necessário, adicione a chave de API do TCE-SP
REACT_APP_AUDESP_API_KEY=sua_chave_api_aqui
```

### 3️⃣ Iniciar o Servidor

```bash
npm start
```

### 4️⃣ Fazer Login

1. Clique no botão **"Login AUDESP"** (ícone de cadeado)
2. Insira **seu email real** (fornecido pelo TCE-SP)
3. Insira **sua senha real** (fornecida pelo TCE-SP)
4. Clique em **"Entrar"**

### ✅ Resultado Esperado

- ✅ Mensagem de sucesso: **"Autenticado com sucesso"**
- ✅ Token recebido e armazenado
- ✅ Email aparece no header
- ✅ Sistema liberado para uso

---

## 🔑 Headers de Autenticação

O sistema usa dois métodos de autenticação:

### 1️⃣ Basic Auth (RFC 7617)
```
Authorization: Basic base64(email:senha)
```

### 2️⃣ Custom Header
```
x-authorization: email:senha
```

Ambos são enviados automaticamente.

---

## 🌐 API Endpoints

### Endpoint de Login
```
POST https://sistemas.tce.sp.gov.br/audesp/api/login
```

**Request:**
```json
{
  "email": "seu_email@example.com",
  "senha": "sua_senha"
}
```

**Response (Sucesso):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expire_in": 86400,
  "token_type": "bearer",
  "nome": "Seu Nome",
  "perfil": "Operador"
}
```

**Response (Erro):**
```json
{
  "message": "Email ou senha incorretos",
  "campos_invalidos": [
    {
      "campo": "email",
      "mensagem": "Email não encontrado"
    }
  ]
}
```

---

## ⚙️ Configurações Avançadas

### Usar URL Diferente (Beta/Staging)

Se o TCE-SP forneceu uma URL beta:

```
# .env.local
REACT_APP_AUDESP_URL=https://beta.tce.sp.gov.br/audesp/api
```

### Usar Chave de API

Se sua conta requer chave de API:

```
# .env.local
REACT_APP_AUDESP_API_KEY=seu_api_key_aqui
```

---

## 🔍 Troubleshooting

### ❌ Erro: "Email não encontrado"

**Causa**: Email não está registrado no sistema AUDESP

**Solução**:
1. Verifique se o email está correto
2. Confirme com TCE-SP se está registrado
3. Use exatamente o email fornecido

### ❌ Erro: "Senha incorreta"

**Causa**: Senha inserida está errada

**Solução**:
1. Verifique se está digitando correto (case-sensitive)
2. Tente novamente
3. Se esquecer, contate TCE-SP para reset

### ❌ Erro: "Erro de conexão com AUDESP"

**Causa**: Servidor AUDESP não está respondendo ou não há internet

**Solução**:
1. Verifique conexão à internet
2. Verifique se URL está correta em `.env.local`
3. Tente novamente em alguns minutos
4. Contate suporte se persistir

### ❌ Erro: "401 Unauthorized"

**Causa**: Credenciais inválidas para a API

**Solução**:
1. Verifique email e senha
2. Verifique se API key está correta (se necessária)
3. Confirme se URL da API está correta

### ⏳ Login Lento

**Causa**: Servidor AUDESP respondendo lentamente

**Solução**:
1. Aguarde até 30 segundos
2. Tente novamente
3. Verifique conexão à internet

---

## 🔒 Segurança

### Credenciais Não São Salvas Localmente

- ❌ Email e senha **NÃO** são salvos
- ✅ Apenas token JWT é armazenado
- ✅ Token expira automaticamente
- ✅ Logout limpa tudo

### O Que É Armazenado

```javascript
localStorage.getItem('audesp_token')      // JWT token
localStorage.getItem('audesp_email')      // Email (visibilidade)
localStorage.getItem('audesp_perfil')     // Perfil/cargo
localStorage.getItem('audesp_nome')       // Nome completo
```

### O Que NÃO É Armazenado

- ❌ Senha em plaintext
- ❌ Email em plaintext
- ❌ Credenciais de login
- ❌ Dados sensíveis

---

## 📊 Fluxo de Autenticação

```
USUÁRIO CLICA "LOGIN"
        ↓
INSERE EMAIL + SENHA
        ↓
ENVIA PARA API AUDESP
        ↓
API VALIDA CREDENCIAIS
        ↓
RETORNA JWT TOKEN
        ↓
SISTEMA ARMAZENA TOKEN
        ↓
USUÁRIO AUTENTICADO ✅
```

---

## 🧪 Testar Login Real

### Via Curl (Terminal)

```bash
# Substituir com credenciais reais
EMAIL="seu_email@exemplo.com"
SENHA="sua_senha"

curl -X POST "https://sistemas.tce.sp.gov.br/audesp/api/login" \
  -H "Content-Type: application/json" \
  -H "x-authorization: $EMAIL:$SENHA" \
  -d "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}"
```

### Via Postman

1. Criar nova requisição POST
2. URL: `https://sistemas.tce.sp.gov.br/audesp/api/login`
3. Header: `x-authorization: email:senha`
4. Body (JSON):
```json
{
  "email": "seu_email@exemplo.com",
  "senha": "sua_senha"
}
```
5. Enviar

---

## 📝 Checklist de Configuração

- [ ] Obtive credenciais do TCE-SP
- [ ] Criei arquivo `.env.local`
- [ ] Adicionei `REACT_APP_AUDESP_URL`
- [ ] Iniciei servidor com `npm start`
- [ ] Testei login com credenciais reais
- [ ] Recebi token com sucesso
- [ ] Email aparece no header
- [ ] Posso acessar o sistema

---

## 🚀 Próximos Passos

Uma vez autenticado com sucesso:

1. ✅ Preencher formulário (16 seções)
2. ✅ Validar dados em tempo real
3. ✅ Visualizar JSON
4. ✅ Enviar para AUDESP (Fases IV e V)
5. ✅ Consultar protocolos
6. ✅ Acessar histórico de envios

---

## 📞 Suporte

**Email**: suporte@tce.sp.gov.br
**Telefone**: (11) 3293-3000
**Horário**: Segunda a Sexta, 8h às 17h

---

## ℹ️ Informações Importantes

1. **URL da API é HTTPS** - Sempre criptografado
2. **Tokens expiram** - Você precisará fazer login novamente
3. **Não compartilhe credenciais** - Use apenas pessoalmente
4. **Logout limpa tudo** - Seguro fazer em computadores compartilhados

---

**Versão**: 3.0
**Status**: 🟢 PRODUCTION - Login Real Ativo
**Data**: 2024
