# 📚 Índice de Documentação - Erro 401 e Transmissão

## 🎯 Para Começar Rapidamente

Se recebeu **erro 401**, comece por aqui:

1. **[GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md)** ⭐ **COMECE AQUI**
   - Diagramas visuais de cada etapa
   - Onde clicar
   - O que esperar
   - Tempo: 5 minutos

2. **[COMO_RESOLVER_ERRO_401.md](COMO_RESOLVER_ERRO_401.md)**
   - Solução em 3 passos
   - FAQ com perguntas frequentes
   - Checklist de resolução

---

## 📖 Documentação Detalhada

### Teste e Validação

**[TESTE_TRANSMISSAO_RESULTADO.md](TESTE_TRANSMISSAO_RESULTADO.md)**
- ✅ Validação do JSON contra schema Audesp
- ✅ Análise completa do erro 401
- ✅ Teste com arquivo real (2.4 KB)
- 🔍 Diagnóstico técnico
- 📊 Resumo de validação

### Resolução de Problemas

**[SOLUCAO_ERRO_401.md](SOLUCAO_ERRO_401.md)**
- 🔐 Modal de credenciais
- 🔄 Botão "Fazer Login Novamente"
- 🧹 Limpeza automática de tokens
- 📞 Informações de suporte

**[GUIA_RESOLVER_ERRO_401.md](GUIA_RESOLVER_ERRO_401.md)** (versão anterior)
- Passo a passo para limpeza manual
- Opções de suporte técnico
- Dicas importantes

---

## 🔄 Fluxo Completo de Transmissão

```
1️⃣ LOGIN
   └─ Credenciais validadas ✅

2️⃣ PREENCHIMENTO
   └─ Dados do formulário ✅

3️⃣ VALIDAÇÃO
   └─ Schema JSON verificado ✅

4️⃣ CONFIRMAÇÃO DE CREDENCIAIS
   └─ CPF/Email reconfirmado ✅

5️⃣ TRANSMISSÃO
   └─ POST para Audesp ✅

6️⃣ RESPOSTA
   ├─ ✅ 200 OK: Protocolo gerado
   ├─ ❌ 400: JSON inválido
   ├─ ❌ 401: CPF sem permissão ← VOCÊ ESTÁ AQUI
   ├─ ❌ 403: Acesso proibido
   └─ ❌ 500: Servidor indisponível
```

---

## 🎬 Scenario: Erro 401

### Causa Raiz
```
CPF 22586034805 NÃO tem permissão para transmitir
Prestação de Contas de Convênio na Audesp Piloto
```

### Sinais de Aviso
- ❌ Mensagem: "A credencial fornecida não é válida"
- ❌ Status: 401 Unauthorized
- ✅ Token: Válido
- ✅ JSON: Correto
- ✅ Endpoint: Correto

### Solução
```
1. Clique "🔄 Fazer Login Novamente"
2. Sistema limpa tokens
3. Digite CPF autorizado
4. Tente transmitir novamente
5. ✅ Sucesso!
```

---

## 📞 Contato de Suporte

| Necessidade | Contato | Tempo |
|-------------|---------|-------|
| **Erro técnico** | Veja guias neste repositório | 5 min |
| **CPF sem permissão** | sua organização | <1 dia |
| **Permissão Audesp** | suporte@audesp.tce.sp.gov.br | 1-7 dias |
| **Servidor indisponível** | suporte@audesp.tce.sp.gov.br | 1 hora |

---

## 🛠️ Implementação Técnica

### Modificações no Código

**Arquivos Alterados:**
- `src/App.tsx` - Adicionado `handleRetryWithNewLogin()`
- `src/components/CredentialsModal.tsx` - Modal de credenciais
- `src/services/transmissionService.ts` - Diagnóstico melhorado

### Funcionalidades Adicionadas

```typescript
// 1. Botão de Retry com Novo Login
const handleRetryWithNewLogin = () => {
    sessionStorage.removeItem('audesp_token');
    sessionStorage.removeItem('audesp_expire');
    localStorage.removeItem('audesp_token');
    handleLogout();
};

// 2. Modal de Credenciais antes de Transmitir
const handleTransmit = () => {
    setShowCredentialsModal(true);  // ← Mostra modal antes
};

// 3. Diagnóstico Detalhado de Erro 401
if (response.status === 401) {
    const userMessage = `❌ Erro de Autenticação (401)...`;
    throw new Error(userMessage);
}
```

---

## ✅ Checklist de Resolução

### Diagnóstico Inicial
- [ ] Recebi erro 401?
- [ ] Mensagem: "A credencial fornecida não é válida"?
- [ ] Token é válido (não expirado)?

### Solução
- [ ] Cliquei "Fazer Login Novamente"?
- [ ] Sistema limpou tokens?
- [ ] Fiz login com novo CPF?
- [ ] Tive sucesso na autenticação?
- [ ] Voltei para transmitir?
- [ ] Confirmei as credenciais?
- [ ] ✅ Transmissão funcionou?

### Se Não Funcionar
- [ ] Tentei CPF diferente?
- [ ] Verifiquei com minha organização?
- [ ] CPF tem permissão confirmada?
- [ ] Tentei contatar Audesp?

---

## 📊 Informações Técnicas

### Endpoint
```
POST https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
```

### Headers Obrigatórios
```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
Content-Type: multipart/form-data
Accept: application/json
```

### Body
```
Form Field: documentoJSON
Type: Blob (application/json)
Content: JSON conforme schema Audesp
```

### Respostas Possíveis
```
200 OK: {
  "protocolo": "F5ABC71071004801",
  "mensagem": "Documento recebido com sucesso!"
}

400 Bad Request: JSON inválido
401 Unauthorized: CPF sem permissão ← AQUI
403 Forbidden: Acesso bloqueado
404 Not Found: Endpoint não existe
500 Internal Server Error: Servidor quebrado
```

---

## 🚀 Deploy Status

| Componente | Status | Commit |
|-----------|--------|--------|
| Modal Credenciais | ✅ Live | aebea87 |
| Botão Retry | ✅ Live | db1122c |
| Diagnóstico 401 | ✅ Live | db1122c |
| Documentação | ✅ Live | 6649c10 |
| Vercel | ✅ Ativo | Auto-deploy |

---

## 📚 Documentação Relacionada

- `README.md` - Visão geral do projeto
- `AUDESP_V2_1_COMPLETO.md` - Documentação v2.1
- `PYTHON_OCR_README.md` - Integração OCR
- `DEPLOYMENT_FINAL_CHECK.md` - Checklist deploy

---

## 🎓 Aprendizado

### Por que 401?
```
HTTP 401 Unauthorized = Sem permissão

Diferente de:
- 400: Dados inválidos (JSON malformado)
- 403: Acesso proibido (entidade bloqueada)
- 404: Não encontrado (endpoint errado)
- 500: Servidor com erro
```

### Por que "A credencial fornecida não é válida"?
```
Significa que o servidor Audesp reconheceu sua
requisição, validou o token, MAS o CPF não tem
permissão para esta operação específica.

Solução: Use CPF autorizado
```

---

## 💡 Dicas Importantes

✅ **SIM:**
- Use CPF com permissão confirmada
- Faça login novamente se receber erro
- Clique "Fazer Login Novamente" automaticamente
- Contate sua organização ou Audesp
- Preserve seus dados (estão salvos)

❌ **NÃO:**
- Não tente o mesmo CPF repetidamente
- Não reinicie a página (perderá dados)
- Não delete localStorage (perderá tokens)
- Não compartilhe tokens
- Não use CPF de terceiros sem autorização

---

## 📞 Próximos Passos

1. **Imediato:** Leia `GUIA_VISUAL_PASSO_A_PASSO.md`
2. **Curto prazo:** Clique "Fazer Login Novamente"
3. **Médio prazo:** Tente CPF autorizado
4. **Longo prazo:** Solicite permissão à Audesp se necessário

---

## 📈 Estatísticas

- 📄 Documentos criados: 5
- 🎯 Guias rápidos: 2
- 📋 Documentação técnica: 2
- 🎬 Diagramas visuais: 30+
- ✅ Testes executados: 1
- 🚀 Deploy status: Live

---

**Versão:** 1.0  
**Última Atualização:** 19/01/2026  
**Status:** ✅ Pronto para Produção  
**Próxima Revisão:** Quando Audesp mudar API

---

## 🔗 Links Rápidos

- 📍 Você está em: `INDICE_ERRO_401.md`
- ▶️ Começar: [GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md)
- ❓ FAQ: [COMO_RESOLVER_ERRO_401.md](COMO_RESOLVER_ERRO_401.md)
- 🔧 Técnico: [TESTE_TRANSMISSAO_RESULTADO.md](TESTE_TRANSMISSAO_RESULTADO.md)
- 📖 Detalhes: [SOLUCAO_ERRO_401.md](SOLUCAO_ERRO_401.md)
