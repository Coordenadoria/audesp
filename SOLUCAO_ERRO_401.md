# Solução para Erro 401 na Transmissão

## Problema Identificado
Ao tentar transmitir, o usuário recebe erro `401 Unauthorized` com a mensagem:
> "A credencial fornecida não é válida."

## Causa Raiz
O erro 401 indica que:
1. ✅ Token JWT é válido (comprimento e formato corretos)
2. ✅ Requisição alcança o servidor Audesp
3. ❌ Mas a credencial (CPF/Email) não tem permissão para transmitir

## Soluções Implementadas

### 1. **Modal de Credenciais Aprimorada**
- Adicionada validação de CPF (11 dígitos)
- Adicionada validação de Email
- Permite alternar entre CPF e Email
- Mensagens de erro claras
- Dicas de suporte

### 2. **Botão "Fazer Login Novamente"**
Ao receber erro 401, o usuário pode:
- Clicar no botão "🔄 Fazer Login Novamente"
- Isto irá:
  - Limpar tokens expirados/inválidos
  - Fazer logout
  - Retornar à tela de login
  - Permitir uso de credenciais diferentes

**Fluxo:**
```
❌ ERRO 401
    ↓
[🔄 Fazer Login Novamente] ou [Fechar]
    ↓
Limpa tokens antigos
    ↓
Retorna à tela de login
    ↓
Faça login com CPF autorizado
    ↓
✅ Transmissão funcionará
```

### 3. **Mensagens de Diagnóstico Melhoradas**
A modal de transmissão agora mostra:
- ✅ Status do token
- ✅ CPF utilizado
- ✅ Endpoint da requisição
- ✅ Sugestões de ação

### 4. **Código de Erro Único**
Cada tentativa de transmissão com erro 401 gera:
- Código TRANS-401-XXXXXX único
- Permite rastreamento de tentativas
- Facilita suporte técnico

## Como Resolver o Erro 401

### Opção 1: Usar CPF Autorizado ✅ **Recomendado**
```
1. Clique em "Fazer Login Novamente"
2. Use credenciais de um CPF que tem permissão
3. Tente transmitir novamente
```

### Opção 2: Verificar Permissões
Contate Audesp:
- Email: suporte@audesp.tce.sp.gov.br
- Solicite: Verificar permissão de "Prestação de Contas de Convênio" para CPF XXXXX
- Verifique se CPF está ativo/autorizado

### Opção 3: Limpar Cache de Login
```
1. Abra DevTools (F12)
2. SessionStorage → Remova: audesp_token, audesp_expire
3. LocalStorage → Remova: audesp_token
4. Recarregue a página (F5)
5. Faça login novamente
```

## Fluxo Técnico da Transmissão

```
┌─────────────────────────┐
│  Clica "Transmitir"     │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Modal Credenciais       │
│ - Confirma CPF/Email    │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Modal Transmissão       │
│ - Validação Local       │
│ - Envia Token + CPF     │
└────────────┬────────────┘
             ↓
        ┌────┴────┐
        ↓         ↓
    ✅ OK     ❌ 401
        ↓         ↓
   Protocolo  [🔄 Fazer Login]
                  ↓
              Limpa Tokens
                  ↓
              Retorna Login
```

## Código Implementado

### App.tsx - handleRetryWithNewLogin()
```typescript
const handleRetryWithNewLogin = () => {
    // Limpa tokens antigos
    sessionStorage.removeItem('audesp_token');
    sessionStorage.removeItem('audesp_expire');
    localStorage.removeItem('audesp_token');
    
    // Fecha modal
    setShowTransmissionModal(false);
    setTransmissionLog([]);
    setTransmissionErrors([]);
    
    // Faz logout
    handleLogout();
    setActiveSection('dashboard');
    showToast("🔄 Faça login novamente", "info");
};
```

### transmissionService.ts - Diagnóstico 401
```typescript
if (response.status === 401) {
    const userMessage = `❌ Erro de Autenticação (401):
${result.message}

⚠️ Verifique:
• Suas credenciais estão corretas?
• Seu CPF tem permissão para transmitir?

💡 SOLUÇÃO:
• Clique em "Fazer Login Novamente"
• Use CPF autorizado
• Se persistir, contate Audesp

Código: TRANS-401-${Date.now().toString().slice(-6)}`;
    
    throw new Error(userMessage);
}
```

## Checklist de Resolução

- [ ] Recebeu erro 401?
- [ ] Clicou em "🔄 Fazer Login Novamente"?
- [ ] Limpou tokens expirados?
- [ ] Tentou com CPF diferente?
- [ ] Ainda recebendo erro?
  - [ ] Contate: suporte@audesp.tce.sp.gov.br
  - [ ] Inclua código TRANS-401-XXXXX
  - [ ] Mencione o CPF que está recebendo rejeição

## Deploy

- ✅ Commit: `aebea87`
- ✅ GitHub: Sincronizado
- ✅ Vercel: Deploy automático acionado
- ✅ Build: Sucesso

## Testes

Para testar:
1. `npm run build` - Verifica compilação ✅
2. Use credenciais válidas no login
3. Tente transmitir
4. Se 401, clique em "Fazer Login Novamente"
5. Tente com CPF autorizado

## Próximas Melhorias

- [ ] API de verificação de permissão antes da transmissão
- [ ] Cache de CPFs autorizados
- [ ] Integração com API Audesp para listar permissões
- [ ] Webhook de notificação de erro
- [ ] Dashboard de histórico de erros
