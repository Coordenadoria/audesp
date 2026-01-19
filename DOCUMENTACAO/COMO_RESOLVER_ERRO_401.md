# 🔧 COMO RESOLVER: Erro 401 na Transmissão

## ⏱️ Resposta Rápida (5 minutos)

### O Problema
```
❌ Erro 401: "A credencial fornecida não é válida."
```

### A Solução em 3 Passos

**Passo 1:** Na modal de erro, clique em **"🔄 Fazer Login Novamente"**
```
┌──────────────────────────────────┐
│   ❌ Erro na Transmissão         │
├──────────────────────────────────┤
│   401 Unauthorized               │
│   A credencial fornecida não...  │
├──────────────────────────────────┤
│  [🔄 Fazer Login Novamente]      │  ← CLIQUE AQUI
│  [Fechar]                        │
└──────────────────────────────────┘
```

**Passo 2:** Sistema fará:
- ✅ Limpar tokens antigos
- ✅ Fazer logout automático
- ✅ Retornar à tela de login

**Passo 3:** Tente novamente com CPF diferente:
- Insira CPF que você sabe que funciona
- Se não sabe nenhum, contate sua organização
- Peça um CPF que já fez transmissão antes

---

## 🎯 Objetivo Final
```
CPF Autorizado → Login → Token Novo → Transmissão ✅
```

---

## ❓ FAQ - Perguntas Frequentes

### **P: Por que "A credencial fornecida não é válida"?**
**R:** Seu CPF (22586034805) não tem permissão para transmitir Prestação de Contas na Audesp.

### **P: Posso usar CPF de outro usuário?**
**R:** SIM! Se tiver autorização, outro CPF com permissão funcionará.

### **P: Meus dados vão ser perdidos?**
**R:** NÃO! Seus dados ficam salvos. Apenas faça login novamente.

### **P: Quanto tempo demora para ter permissão?**
**R:** Depende de quem autoriza (gestão, Audesp). Pode ser instantâneo ou levar dias.

### **P: E se nenhum CPF na minha organização funcionar?**
**R:** Contate Audesp: suporte@audesp.tce.sp.gov.br

### **P: O arquivo JSON está correto?**
**R:** SIM! 100% correto conforme schema. O problema é apenas autorização.

### **P: Preciso fazer tudo de novo?**
**R:** NÃO! Seus dados estão salvos. Apenas login novamente + transmit.

---

## 🔑 Como Conseguir Permissão

### Opção A: Contatar Sua Organização
1. Procure seu gestor/supervisor
2. Diga: "Preciso de um CPF que tenha permissão para transmitir Prestação de Contas no Audesp"
3. Eles podem:
   - Fornecer um CPF existente
   - Solicitar nova permissão
   - Orientar próximos passos

### Opção B: Contatar Audesp Diretamente
**Email:** suporte@audesp.tce.sp.gov.br

**Mensagem:**
```
Assunto: Solicitar Permissão de Transmissão

Corpo:
Olá,

Sou representante da entidade 10048 (município 7107).
Gostaria de solicitar permissão para transmitir Prestação de Contas de Convênio.

CPF: [seu CPF]
Nome: [seu nome]
Função: [sua função]

Por favor, informar como proceder.

Obrigado.
```

---

## 📱 Interface de Resolução

### Antes (❌ Erro 401)
```
┌─────────────────────────────┐
│  ❌ Erro na Transmissão     │
├─────────────────────────────┤
│  401 Unauthorized           │
│  A credencial fornecida...  │
│                             │
│  ⏳ ProcessandoProcessando...│
│  📊 Validação Local OK!     │
│  🌐 Enviando para Audesp... │
│  ❌ ERRO: 401 Unauthorized  │
├─────────────────────────────┤
│  🔴 Campos com Problemas:   │
│  • Autenticação: Token      │
│    não autorizado           │
├─────────────────────────────┤
│ [🔄 Fazer Login Novamente]  │
│ [Fechar]                    │
└─────────────────────────────┘
```

### Depois (✅ Autorizado)
```
┌─────────────────────────────┐
│  ✅ Transmissão Completa    │
├─────────────────────────────┤
│  SUCESSO: Documento Recebido│
│                             │
│  ✅ Validação Local OK!     │
│  ✅ Enviando para Audesp... │
│  ✅ Documento Recebido!     │
├─────────────────────────────┤
│  📄 Protocolo:              │
│  F5ABC71071004801           │
│                             │
│  📅 Data/Hora:              │
│  19/01/2026 12:30           │
├─────────────────────────────┤
│ [Fechar]                    │
└─────────────────────────────┘
```

---

## 🛠️ Se Tiver Dúvidas Técnicas

### Verificar Estrutura do JSON
```bash
# Ver tamanho
du -h arquivo.json

# Validar JSON
jq . arquivo.json

# Ver primeiras linhas
head -20 arquivo.json
```

### Verificar Token
O sistema automaticamente:
- ✅ Valida token
- ✅ Adiciona prefix "Bearer"
- ✅ Envia com credenciais
- ✅ Mostra erros detalhados

---

## ⚡ Checklist Rápido

- [ ] Clicou "Fazer Login Novamente"?
- [ ] Sistema limpou tokens?
- [ ] Fez login com novo CPF?
- [ ] Voltou para transmitir?
- [ ] Transmissão funcionou?

---

## 📞 Precisa de Ajuda?

| Situação | Ação |
|----------|------|
| **JSON está errado** | Veja validação em `TESTE_TRANSMISSAO_RESULTADO.md` |
| **CPF sem permissão** | Contate sua organização ou Audesp |
| **Token expirou** | Clique "Fazer Login Novamente" |
| **Erro 400** | JSON não conforme schema |
| **Erro 403** | Acesso proibido (entidade/município) |
| **Erro 500** | Servidor Audesp indisponível |

---

## 🎓 Educativo: Por que 401?

```
HTTP 401 = Unauthorized
Significa: "Você não tem permissão para isto"

Diferente de:
- 400 Bad Request: JSON inválido
- 403 Forbidden: Acesso bloqueado
- 404 Not Found: Endpoint não existe
- 500 Server Error: Servidor quebrado
```

---

**Última Atualização:** 19/01/2026  
**Status:** ✅ Pronto para produção  
**Próxima Ação:** Use CPF autorizado
