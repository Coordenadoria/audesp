# 🚀 INSTRUÇÕES PARA PRODUÇÃO - LOGIN AUDESP

## ⚠️ IMPORTANTE

As correções implementadas funcionam perfeitamente em **DESENVOLVIMENTO** (localhost).

Para desploy em **PRODUÇÃO**, ajustes simples são necessários.

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### 1. **Ambiente: PILOTO vs PRODUÇÃO**

**Para Ambiente PILOTO (Testes):**
```typescript
// Arquivo: services/authService.ts
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "/proxy-piloto-login"  // ← Localhost com proxy
  : "https://audesp-piloto.tce.sp.gov.br";  // ← Produção piloto
```

**Para Ambiente PRODUÇÃO (Real):**
```typescript
// Arquivo: services/authService.ts
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "/proxy-producao-login"  // ← Localhost com proxy para produção
  : "https://audesp.tce.sp.gov.br";  // ← Produção real
```

### 2. **Atualizar setupProxy.js para Produção**

Confirmar que ambos proxies estão configurados (já estão, mas verificar):

```javascript
// /proxy-piloto-login → https://audesp-piloto.tce.sp.gov.br
// /proxy-producao-login → https://audesp.tce.sp.gov.br
```

✅ Já está configurado no arquivo `setupProxy.js`

### 3. **Variáveis de Ambiente**

Criar arquivo `.env.production`:

```env
# Produção - Ambiente AUDESP Real
REACT_APP_API_ENV=producao
REACT_APP_API_URL=https://audesp.tce.sp.gov.br
REACT_APP_API_TIMEOUT=30000
```

Criar arquivo `.env.development`:

```env
# Desenvolvimento - Ambiente AUDESP Piloto
REACT_APP_API_ENV=piloto
REACT_APP_API_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=10000
```

---

## 📋 CHECKLIST PRE-PRODUÇÃO

Antes de fazer o deploy:

- [ ] Testar login em PILOTO (localhost)
- [ ] Testar transmissão de dados
- [ ] Verificar logs em F12 > Console
- [ ] Confirmar que erro mensagens são claras
- [ ] Testar com múltiplos usuários/credenciais
- [ ] Verificar compatibilidade de navegadores
- [ ] Testar link de recuperação de senha (se houver)
- [ ] Verificar HTTPS em produção
- [ ] Validar certificados SSL
- [ ] Testar em rede real (não apenas localhost)

---

## 🔒 SEGURANÇA

### Verificações Obrigatórias

1. **HTTPS em Produção**
   ```
   ✅ Obrigatório: https://audesp.tce.sp.gov.br
   ❌ Nunca: http://audesp.tce.sp.gov.br
   ```

2. **Tokens em Segurança**
   ```typescript
   // ✅ Correto: sessionStorage (não persiste)
   sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
   
   // ❌ Errado: localStorage (persiste, menos seguro)
   localStorage.setItem(STORAGE_TOKEN_KEY, token);
   
   // ❌ Perigoso: Cookie sem flags
   // Use: HttpOnly, Secure, SameSite
   ```

3. **Headers de Segurança**
   ```
   Verify no servidor:
   - Strict-Transport-Security
   - X-Content-Type-Options
   - X-Frame-Options
   - Content-Security-Policy
   ```

4. **Logging Seguro**
   ```typescript
   // ✅ Seguro: Log apenas email
   console.log(`[Auth] Usuário: ${cleanUsuario}`);
   
   // ❌ Inseguro: Log de senha
   console.log(`[Auth] Senha: ${cleanSenha}`);  // ← NUNCA!
   ```

---

## 🚢 DEPLOY CHECKLIST

### Passo 1: Build para Produção
```bash
cd /workspaces/audesp
npm run build
# Aguarde: build completa sem erros
```

### Passo 2: Validar Build
```bash
# Verificar pasta build foi criada
ls -la build/

# Verificar tamanho (deve estar ~3-5MB)
du -sh build/

# Verificar arquivos principais
ls -la build/static/
```

### Passo 3: Testar Build Localmente
```bash
npm install -g serve
serve -s build -l 3000
# Abra http://localhost:3000
```

### Passo 4: Verificar Ambiente de Produção
```bash
# Verificar conectividade
curl -I https://audesp.tce.sp.gov.br

# Testar login endpoint
curl -X POST https://audesp.tce.sp.gov.br/login \
  -H "Content-Type: application/json" \
  -H "x-authorization: user@email.com:password" \
  -d '{}' \
  -v
```

### Passo 5: Deploy
```bash
# Vercel (se usando)
vercel deploy --prod

# Ou outro platform (AWS, Azure, etc)
# Seguir instruções específicas da plataforma
```

### Passo 6: Validação Pós-Deploy
```bash
1. Abrir https://seu-dominio.com
2. Testar login com credenciais válidas
3. Verificar Console (F12) para logs
4. Testar transmissão de dados
5. Verificar HTTPS/SSL ativado
```

---

## 🔍 MONITORAMENTO EM PRODUÇÃO

### Logs a Acompanhar

```
[Auth] Iniciando login para: https://audesp.tce.sp.gov.br/login
[Auth] Usuário: xxx@email.com
[Auth] Tentativa 1 (x-authorization header) - Status: 200
[Auth] ✅ Login bem-sucedido! Token expira em 2026-01-19...
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| HTTP 404 | Proxy desconfigurado | Verificar setupProxy.js |
| HTTP 401 | Credenciais inválidas | Verificar usuário/senha |
| HTTP 403 | Sem permissão | Verificar permissões AUDESP |
| HTTP 503 | Servidor offline | Contatar suporte AUDESP |
| CORS error | Política CORS | Verificar headers no servidor |
| SSL error | Certificado inválido | Renovar certificado SSL |

---

## 📊 ROLLBACK

Se houver problemas em produção:

### Plan A: Rollback Rápido
```bash
# Se usando Vercel
vercel rollback

# Se usando Git/Docker
git revert <commit-hash>
docker build . -t audesp:v1.8
docker run -d -p 3000:3000 audesp:v1.8
```

### Plan B: Hotfix
1. Identifique o problema
2. Implemente correção
3. Teste em dev (localhost)
4. Deploy novamente

---

## 📞 SUPORTE

### Se houver problemas após deploy:

1. **Verifique logs:**
   ```bash
   # Ver logs da aplicação
   tail -f /var/log/audesp/app.log
   
   # Ver logs de erro
   tail -f /var/log/audesp/error.log
   ```

2. **Teste conectividade:**
   ```bash
   curl -v https://audesp.tce.sp.gov.br/login
   ```

3. **Verifique certificados:**
   ```bash
   openssl s_client -connect audesp.tce.sp.gov.br:443
   ```

4. **Contate suporte:**
   - TCESP: suporte-audesp@tce.sp.gov.br
   - Desenvolvedor: DevOps/Engenharia

---

## ✅ CONCLUSÃO

Com as correções implementadas no `authService.ts`, o login está **pronto para produção**.

**Próximas etapas:**
1. ✅ Testar em PILOTO
2. ✅ Configurar variáveis de ambiente
3. ✅ Executar build production
4. ✅ Deploy em produção
5. ✅ Monitorar e manter

---

**🚀 Sistema Pronto para Produção!**
