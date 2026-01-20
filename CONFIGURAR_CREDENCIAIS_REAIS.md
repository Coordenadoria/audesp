# 🔐 CONFIGURAÇÃO DE CREDENCIAIS REAIS - AUDESP

## ⚠️ IMPORTANTE

O sistema de login AUDESP requer **credenciais reais** do Tribunal de Contas do Estado de São Paulo (TCE-SP).

O erro que você está recebendo é porque:
1. ❌ As credenciais de teste não existem no servidor real
2. ❌ As variáveis de ambiente não estão configuradas
3. ❌ Falta o header `x-authorization` com as credenciais

---

## 📋 O QUE VOCÊ PRECISA

Para fazer login no AUDESP real, você precisa de:

- ✅ **Email de usuário autorizado** (exemplo: usuario@orgao.sp.gov.br)
- ✅ **Senha de acesso** do TCE-SP
- ✅ **Órgão registrado** no AUDESP
- ✅ **Permissão para enviar documentos**

Se você ainda não tem:
📞 **Contate o TCE-SP**: (11) 3886-6000
📧 **Email**: suporte-audesp@tce.sp.gov.br

---

## 🔧 COMO CONFIGURAR

### Passo 1: Edite o arquivo `.env.local`

```bash
# Navegue até /workspaces/audesp
cd /workspaces/audesp

# Abra o arquivo .env.local
nano .env.local
```

### Passo 2: Adicione suas credenciais reais

```env
# ============================================
# 🔐 AUDESP - CREDENCIAIS REAIS
# ============================================

# URL da API AUDESP
REACT_APP_AUDESP_URL=https://audesp-piloto.tce.sp.gov.br/api

# OU para produção:
# REACT_APP_AUDESP_URL=https://audesp.tce.sp.gov.br/api

# Credenciais do seu órgão
REACT_APP_AUDESP_EMAIL=seu-email@orgao.sp.gov.br
REACT_APP_AUDESP_SENHA=sua-senha-aqui

# Chave de API (se necessária)
REACT_APP_AUDESP_API_KEY=sua-chave-aqui-ou-deixar-em-branco

# Ambiente (piloto ou producao)
REACT_APP_AUDESP_ENVIRONMENT=piloto

# Timeout para requisições (em ms)
REACT_APP_API_TIMEOUT=60000
```

### Passo 3: Salve o arquivo

```bash
# Se usou nano:
# Pressione Ctrl+X
# Pressione Y (para confirmar)
# Pressione Enter (para salvar)
```

### Passo 4: Reinicie o servidor React

```bash
# Se o servidor está rodando, interrompa (Ctrl+C)
# Depois reinicie:
npm start
```

---

## ✅ TESTE SUAS CREDENCIAIS

### Teste 1: Via Terminal (curl)

```bash
curl -X POST https://audesp-piloto.tce.sp.gov.br/login \
  -H "Content-Type: application/json" \
  -H "x-authorization: seu-email@orgao.sp.gov.br:sua-senha" \
  -d '{"email":"seu-email@orgao.sp.gov.br","senha":"sua-senha"}'
```

**Resposta esperada (sucesso)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "email": "seu-email@orgao.sp.gov.br",
    "nome": "Seu Nome Completo",
    "perfil": "operador",
    "orgao": "Sua Organização"
  },
  "expire_in": 3600
}
```

**Resposta esperada (credenciais inválidas)**:
```json
{
  "success": false,
  "message": "Credenciais inválidas",
  "timestamp": "2026-01-20T16:00:00.000Z"
}
```

### Teste 2: Via Interface Web

1. Abra http://localhost:3000
2. Na tela de login, insira:
   - Email: `seu-email@orgao.sp.gov.br`
   - Senha: `sua-senha`
   - Ambiente: `Piloto (Teste)` ou `Produção`
3. Clique em "Entrar"
4. Se funcionar, você verá o dashboard!

---

## 🔍 TROUBLESHOOTING

### Erro: "Credenciais inválidas"
```
❌ Possível causa: Email ou senha incorretos
✅ Solução: 
   1. Verifique o email
   2. Verifique a senha
   3. Teste via curl primeiro
   4. Contate TCE-SP se persistir
```

### Erro: "403 Forbidden"
```
❌ Possível causa: Usuário não tem permissão
✅ Solução:
   1. Verifique se a conta está ativa no AUDESP
   2. Verifique se tem permissão para enviar documentos
   3. Contate o administrador do seu órgão
```

### Erro: "400 Bad Request"
```
❌ Possível causa: Falta o header x-authorization
✅ Solução:
   1. Verifique se está enviando o header correto
   2. Formato: email@orgao.sp.gov.br:senha
   3. Não coloque espaços
```

### Erro: "Connection refused"
```
❌ Possível causa: Não consegue conectar ao servidor
✅ Solução:
   1. Verifique internet
   2. Teste: ping audesp-piloto.tce.sp.gov.br
   3. Pode ser firewall da empresa bloqueando
   4. Tente em rede diferente para testar
```

### Erro: "Timeout"
```
❌ Possível causa: Servidor lento ou indisp onível
✅ Solução:
   1. Aumente REACT_APP_API_TIMEOUT para 120000
   2. Tente novamente depois
   3. Verifique se AUDESP está funcionando
```

---

## 📊 ESTRUTURA DAS CREDENCIAIS

### Email (Identificação do Usuário)
```
Formato: usuario@orgao.sp.gov.br
Exemplo: joao.silva@prefeitura.sp.gov.br
         maria.santos@camara.sp.gov.br
         auditoria@tce.sp.gov.br
```

### Senha (Autenticação)
```
Formato: Senha segura fornecida por TCE-SP
Mínimo: 8 caracteres
Contém: Maiúsculas, minúsculas, números, símbolos
Segurança: NUNCA compartilhe ou comite no GitHub!
```

### API Key (Opcional, se necessária)
```
Formato: Chave fornecida por TCE-SP
Uso: Autenticação adicional ou rate limiting
Local: Header x-api-key
```

---

## 🔒 SEGURANÇA

### ⚠️ NÃO FAÇA ISSO:

```javascript
// ❌ NUNCA comita credenciais reais no GitHub!
const email = "usuario@orgao.sp.gov.br";
const senha = "minha-senha-123";

// ❌ NUNCA coloque em localStorage sem encriptar!
localStorage.setItem('audesp_password', 'minha-senha');

// ❌ NUNCA envie credenciais em query string!
window.location = `/login?email=user@org&password=pass`;
```

### ✅ FAÇA ISSO:

```javascript
// ✅ Use variáveis de ambiente
const email = process.env.REACT_APP_AUDESP_EMAIL;
const senha = process.env.REACT_APP_AUDESP_SENHA;

// ✅ Armazene token, não a senha
localStorage.setItem('audesp_token', jwtToken);

// ✅ Use HTTPS sempre
const url = 'https://audesp-piloto.tce.sp.gov.br/api';

// ✅ Remova credenciais do console em produção
console.log(`Login com ${email}`); // ✅ Seguro
console.log(`Senha: ${senha}`); // ❌ NUNCA!
```

---

## 📱 AMBIENTES

### Ambiente PILOTO (Teste)
```
URL: https://audesp-piloto.tce.sp.gov.br
Uso: Testes, desenvolvimento
Dados: Dados de teste, pode apagar/modificar
Credenciais: Credenciais de teste do órgão
```

### Ambiente PRODUÇÃO
```
URL: https://audesp.tce.sp.gov.br
Uso: Sistema em produção
Dados: Dados reais, cuidado ao modificar!
Credenciais: Credenciais reais do órgão
```

---

## 🧪 TESTE PASSO A PASSO

### 1. Verificar conectividade
```bash
ping audesp-piloto.tce.sp.gov.br
```

### 2. Testar endpoint sem autenticação
```bash
curl https://audesp-piloto.tce.sp.gov.br
# Deve retornar 302 Redirect (esperado)
```

### 3. Testar login com credenciais
```bash
curl -X POST https://audesp-piloto.tce.sp.gov.br/login \
  -H "Content-Type: application/json" \
  -H "x-authorization: usuario@orgao.sp.gov.br:senha" \
  -d '{"email":"usuario@orgao.sp.gov.br","senha":"senha"}'
```

### 4. Se receber token, teste no React
```bash
# 1. Configure .env.local
# 2. npm start
# 3. Tente fazer login na interface
```

---

## 📞 SUPORTE

### Se continuar não funcionando:

1. **Verifique .env.local**
   ```bash
   cat .env.local | grep REACT_APP_AUDESP
   ```

2. **Verifique credenciais com curl**
   ```bash
   curl -X POST ... (ver teste acima)
   ```

3. **Abra DevTools (F12) e procure por erros**
   - Console
   - Network (veja a requisição POST)

4. **Contate TCE-SP**
   - Telefone: (11) 3886-6000
   - Email: suporte-audesp@tce.sp.gov.br

---

## ✅ CHECKLIST FINAL

- [ ] Tenho credenciais reais do TCE-SP?
- [ ] Email e senha estão corretos?
- [ ] Configurei .env.local?
- [ ] Testei com curl e funcionou?
- [ ] Reiniciei o servidor React (npm start)?
- [ ] Consegui fazer login na interface?
- [ ] Token foi armazenado em sessionStorage?
- [ ] Consegui acessar o dashboard?

---

**Assim que todas essas etapas forem concluídas, seu login funcionará perfeitamente!**

Se tiver dúvidas, compartilhe:
1. Sua credencial de teste (sem senha!)
2. O erro específico que recebe
3. O resultado do curl test
