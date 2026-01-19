# 🚀 Guia Rápido: Resolver Erro 401 na Transmissão

## ❌ Você recebeu este erro?

```
401 Unauthorized
"A credencial fornecida não é válida."
```

## ✅ Solução em 3 Passos

### **Passo 1: Clique em "🔄 Fazer Login Novamente"**
Quando a modal de transmissão mostrar erro 401, você verá este botão.

```
┌─────────────────────────────────────┐
│  ❌ Erro na Transmissão             │
├─────────────────────────────────────┤
│  401 Unauthorized                   │
│  A credencial fornecida não...      │
├─────────────────────────────────────┤
│  [🔄 Fazer Login Novamente] [Fechar]│
└─────────────────────────────────────┘
```

### **Passo 2: Sistema vai Limpar Tokens Antigos**
- ✅ Remove token expirado
- ✅ Remove sessão inválida
- ✅ Faz logout automático
- ✅ Retorna à tela de login

### **Passo 3: Faça Login Novamente**
- 🔐 Insira CPF com permissão
- 🔑 Insira senha
- 🌍 Escolha ambiente (Piloto/Produção)
- ✅ Clique em "Entrar"

## 🎯 O que Fazer Depois

### Se Funcionou! ✅
1. Volte para a prestação de contas
2. Clique em "Transmitir Audesp"
3. Confirme suas credenciais
4. Transmissão deve funcionar agora!

### Se Ainda Receber 401 ❌
1. Verifique se você está usando CPF correto
2. Confirme que o CPF tem permissão:
   - Contate Audesp: **suporte@audesp.tce.sp.gov.br**
   - Solicite permissão para "Prestação de Contas de Convênio"
3. Inclua o código de erro: **TRANS-401-XXXXXX**

## 📋 Checklist de Verificação

- [ ] Clicou em "Fazer Login Novamente"?
- [ ] Sistema limpou os tokens?
- [ ] Você refez o login?
- [ ] Voltou à transmissão?
- [ ] Confirmou as credenciais?
- [ ] Transmissão funcionou? ✅

## 🆘 Se Ainda Não Funcionar

### Opção A: Limpar Manualmente o Cache

**No Firefox/Chrome:**
1. Abra Developer Tools (F12)
2. Vá para "Application" (Chrome) ou "Storage" (Firefox)
3. Limpe:
   - `audesp_token` 
   - `audesp_expire`
4. Recarregue a página (F5)
5. Faça login novamente

### Opção B: Contatar Suporte Audesp

**Informações necessárias:**
```
Assunto: Erro 401 na Transmissão de Prestação de Contas

Corpo do Email:
- CPF que está recebendo erro: [seu CPF]
- Código de erro: TRANS-401-XXXXXX
- Ambiente: Piloto ou Produção
- Data/Hora: [data e hora do erro]
```

**Email:** suporte@audesp.tce.sp.gov.br

## 🔧 O Que Mudou

A aplicação agora:
1. ✅ Valida suas credenciais antes de transmitir
2. ✅ Oferece botão para fazer login novamente se houver erro 401
3. ✅ Limpa tokens antigos automaticamente
4. ✅ Fornece código único para cada erro
5. ✅ Suporta trocar de CPF sem fechar aplicação

## 💡 Dicas Importantes

✅ **USE CPF COM PERMISSÃO**
- Nem todo CPF tem permissão para transmitir
- Se receber 401 repetidamente, é provável que seu CPF não tenha permissão
- Solicite à Audesp ou use CPF autorizado

✅ **RENOVE SEU TOKEN**
- Se receber 401 e já usou este CPF antes, pode ser token expirado
- Use botão "Fazer Login Novamente" para renovar
- Novo token durará 8 horas

✅ **AMBIENTE CORRETO**
- Verifique se está em Piloto ou Produção
- Ambiente correto deve estar configurado no login
- Um ambiente pode ter permissões diferentes

## 📞 Suporte

| Questão | Resposta |
|---------|----------|
| **Meu CPF funcionava antes, por que 401 agora?** | Token expirou. Clique "Fazer Login Novamente" |
| **Como sei se meu CPF tem permissão?** | Contate Audesp: suporte@audesp.tce.sp.gov.br |
| **Posso trocar de CPF sem sair?** | Sim! Clique "Fazer Login Novamente" |
| **Preciso dos dados antigos?** | Não! Clique "Fechar" mantém seus dados |
| **O código TRANS-401 para quê?** | Facilita suporte técnico rastrear seu erro |

---

**Versão:** 1.0  
**Atualizado:** 19/01/2026  
**Status:** ✅ Implementado e Testado
