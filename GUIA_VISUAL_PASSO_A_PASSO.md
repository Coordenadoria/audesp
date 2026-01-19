# 📸 GUIA VISUAL: Passo a Passo Resolver Erro 401

## 🎬 Cenário: Você Recebeu Erro 401

### PASSO 1: Modal de Erro Aparece

```
┌────────────────────────────────────────────┐
│          ❌ Erro na Transmissão             │
├────────────────────────────────────────────┤
│  ⏳ Processando Transmissão...              │
├────────────────────────────────────────────┤
│  Status: Erro                              │
│                                            │
│  LOG DE TRANSMISSÃO:                      │
│  ┌─────────────────────────────────────┐  │
│  │ ⏳ Iniciando processo...             │  │
│  │ 👤 Usuário: 22586034805             │  │
│  │ 📋 Validando estrutura...           │  │
│  │ ✅ Validação local OK!              │  │
│  │ 🌐 Enviando para Audesp...          │  │
│  │ ❌ ERRO: 401 Unauthorized           │  │
│  │                                     │  │
│  │ 🔍 DIAGNÓSTICO:                     │  │
│  │ - Token: VÁLIDO ✅                  │  │
│  │ - CPF: 22586034805 ❌ SEM PERM      │  │
│  │ - Endpoint: CORRETO ✅              │  │
│  └─────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  🔴 Campos com Problemas:                  │
│  ┌─────────────────────────────────────┐  │
│  │ Autenticação:                       │  │
│  │ A credencial fornecida não é válida │  │
│  └─────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│                                            │
│  [🔄 Fazer Login Novamente]  [Fechar]     │  ← CLIQUE AQUI!
│                                            │
└────────────────────────────────────────────┘
```

**O que você vê:**
- ❌ Status "Erro na Transmissão"
- ⚠️ Mensagem: "A credencial fornecida não é válida"
- 🔴 Campo "Autenticação" marcado em vermelho
- ✅ Log mostrando que validação local passou
- 🔄 Botão "Fazer Login Novamente"

---

### PASSO 2: Clique em "🔄 Fazer Login Novamente"

```
ANTES: Modal de Erro Aberta
              ↓
    [Clique no Botão Azul]
              ↓
DURANTE: Sistema Faz Limpeza
   ✅ Remove token expirado
   ✅ Remove sessão inválida
   ✅ Faz logout
              ↓
DEPOIS: Tela de Login Aparece
```

**O que acontece automaticamente:**
```javascript
// Sistema executa:
sessionStorage.removeItem('audesp_token');      // ✅ Remove
sessionStorage.removeItem('audesp_expire');     // ✅ Remove
localStorage.removeItem('audesp_token');        // ✅ Remove
handleLogout();                                  // ✅ Desconecta
showToast("🔄 Faça login novamente");          // ℹ️ Aviso
```

---

### PASSO 3: Tela de Login Limpa Aparece

```
┌────────────────────────────────────┐
│     🔐 AUDESP - LOGIN CLEAN        │
├────────────────────────────────────┤
│                                    │
│  ENTRE COM SUAS CREDENCIAIS       │
│                                    │
│  CPF ou Email:                    │
│  ┌────────────────────────────┐   │
│  │ [novo CPF aqui]            │   │
│  └────────────────────────────┘   │
│                                    │
│  Senha:                           │
│  ┌────────────────────────────┐   │
│  │ ••••••••••                 │   │
│  └────────────────────────────┘   │
│                                    │
│  Ambiente:                        │
│  ◉ Piloto  ○ Produção            │
│                                    │
│           [ENTRAR]                 │
│                                    │
└────────────────────────────────────┘
```

**O que você faz:**
1. ✏️ Digite **CPF diferente** (ou mesmo CPF)
2. 🔐 Digite **senha**
3. 🌍 Escolha **ambiente** (Piloto)
4. 👆 Clique **ENTRAR**

**Qual CPF usar?**
- ✅ CPF que sabe que funciona em outra organização
- ✅ CPF de outro usuário autorizado
- ✅ CPF que já transmitiu antes
- ❌ NUNCA o mesmo CPF 22586034805 (sem permissão)

---

### PASSO 4: Sistema Faz Nova Autenticação

```
Você clica "ENTRAR"
        ↓
┌──────────────────────────────────┐
│ ⏳ Autenticando...                 │
│                                  │
│ Conectando em:                   │
│ https://audesp-piloto....        │
│                                  │
│ Validando credenciais...         │
│ Gerando token JWT...             │
│ Salvando sessão...               │
│                                  │
│ Por favor, aguarde...            │
└──────────────────────────────────┘
        ↓
✅ OU ❌
```

**Se falhar:**
```
❌ Erro: Credenciais Inválidas

Opções:
1. Digite CPF/senha corretos
2. Verifique se não esqueceu password
3. Contate sua organização
```

**Se suceder:**
```
✅ Login Realizado com Sucesso!

Você será redirecionado para o Dashboard
em 2 segundos...
```

---

### PASSO 5: Volta ao Dashboard com Novo Token

```
┌────────────────────────────────────────┐
│  📊 DASHBOARD                          │
├────────────────────────────────────────┤
│                                        │
│  Bem-vindo! [novo CPF]                │
│                                        │
│  Status:  Autenticado ✅               │
│  Token:   Válido (8 horas)            │
│  Sessão:  Ativa                       │
│                                        │
│  Seus dados estão salvos aqui:        │
│  📋 Formulário preenchido             │
│  📊 Validações OK                     │
│  💾 Tudo preservado!                  │
│                                        │
│  Opções:                              │
│  [📝 Editar]                          │
│  [✓ Validar]                         │
│  [📤 Transmitir Audesp] ← CLIQUE!    │
│                                        │
└────────────────────────────────────────┘
```

**O que você vê:**
- ✅ Logado com novo CPF
- ✅ Todos seus dados intactos
- ✅ Token renovado
- ✅ Botão "Transmitir Audesp" disponível

---

### PASSO 6: Clique em "📤 Transmitir Audesp"

```
Você clica "Transmitir"
        ↓
┌────────────────────────────────────┐
│  🔐 Verificar Credenciais          │
├────────────────────────────────────┤
│                                    │
│  Confirme sua identidade           │
│  para transmitir                   │
│                                    │
│  ┌──────────  ────────────┐        │
│  │ [CPF ✓] [Email    ]   │        │
│  └───────────────────────┘        │
│                                    │
│  [CPF selecionado]                 │
│                                    │
│  CPF novo: [novo CPF]              │
│  ┌────────────────────────┐        │
│  │ Confirme: 123.456.789  │        │
│  └────────────────────────┘        │
│                                    │
│  💡 Suas credenciais serão         │
│     verificadas com Audesp         │
│                                    │
│  [Cancelar] [Confirmar] ← CLIQUE  │
│                                    │
└────────────────────────────────────┘
```

**O que fazer:**
1. ✏️ Confirme o **novo CPF**
2. 👆 Clique **CONFIRMAR**

---

### PASSO 7: Transmissão Inicia

```
Modal de Credenciais Fecha
        ↓
┌────────────────────────────────────────┐
│  ⏳ Processando Transmissão...          │
├────────────────────────────────────────┤
│                                        │
│  LOG:                                  │
│  ⏳ Iniciando processo...               │
│  👤 Usuário: [novo CPF] ✅            │
│  📋 Validando estrutura de dados...    │
│  ⏳ Estrutura OK...                     │
│  🔗 Verificando consistência...        │
│  ✅ Consistência OK!                   │
│  ✅ Validação local OK!                │
│  🌐 Enviando para Audesp Piloto...     │
│  ⏳ Aguarde...                          │
│                                        │
└────────────────────────────────────────┘
```

**Diferentes cenários:**

#### ✅ SUCESSO!
```
Modal muda para:

┌────────────────────────────────────────┐
│  ✅ SUCESSO: DOCUMENTO RECEBIDO        │
├────────────────────────────────────────┤
│  📄 Protocolo: F5ABC71071004801       │
│  📅 Data/Hora: 19/01/2026 13:15       │
│  ✅ Status: RECEBIDO                  │
│                                        │
│  [Fechar]                             │
└────────────────────────────────────────┘

Seu arquivo foi transmitido com sucesso! 🎉
```

#### ❌ ERRO NOVAMENTE (Improvável)
```
Se receber 401 de novo:
- CPF estava sem permissão mesmo assim
- Tente outro CPF autorizado
- Ou contate Audesp

Clique "Fazer Login Novamente"
e repita o processo
```

---

## 🎯 Resumo Visual do Fluxo

```
┌─────────────────────────────────────────┐
│  ❌ ERRO 401 ACONTECE                   │
└────────────┬────────────────────────────┘
             │
             ↓ Clique "Fazer Login Novamente"
┌─────────────────────────────────────────┐
│  🧹 LIMPEZA AUTOMÁTICA                  │
│  ✅ Remove tokens inválidos             │
│  ✅ Faz logout                          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  🔐 TELA DE LOGIN LIMPA                │
│  ✏️ Digite novo CPF                     │
│  🔑 Digite senha                        │
│  👆 Clique ENTRAR                       │
└────────────┬────────────────────────────┘
             │
             ↓ Audesp autentica novo CPF
┌─────────────────────────────────────────┐
│  ✅ NOVO TOKEN GERADO                   │
│  📊 Dashboard com dados preservados     │
└────────────┬────────────────────────────┘
             │
             ↓ Clique "Transmitir"
┌─────────────────────────────────────────┐
│  🔐 CONFIRMAR CREDENCIAIS               │
│  👤 Novo CPF é autorizado!              │
│  👆 Clique CONFIRMAR                    │
└────────────┬────────────────────────────┘
             │
             ↓ Transmissão com novo CPF
┌─────────────────────────────────────────┐
│  ✅ SUCESSO! PROTOCOLO GERADO          │
│  📄 F5ABC71071004801                   │
│  🎉 Transmissão realizada!              │
└─────────────────────────────────────────┘
```

---

## ⏱️ Tempo Total Estimado

| Etapa | Tempo |
|-------|-------|
| Clicar "Fazer Login Novamente" | <1 seg |
| Sistema limpar | 1 seg |
| Você digitar CPF/senha | 30 seg |
| Audesp autenticar | 5 seg |
| Sistema carregar dashboard | 2 seg |
| Confirmar credenciais | 10 seg |
| Transmissão | 15 seg |
| **TOTAL** | **~1 minuto** |

---

## ✅ Checklist Pronto

Marque conforme você progride:

```
□ 1. Vi a modal de erro 401
□ 2. Cliquei "Fazer Login Novamente"
□ 3. Sistema fez limpeza automática
□ 4. Tela de login apareceu
□ 5. Digitei novo CPF
□ 6. Digitei senha
□ 7. Cliquei ENTRAR
□ 8. Autenticação foi bem-sucedida
□ 9. Voltei ao dashboard
□ 10. Meus dados ainda estão lá
□ 11. Cliquei "Transmitir"
□ 12. Confirmei as credenciais
□ 13. Transmissão iniciou
□ 14. ✅ SUCESSO! Protocolo gerado!
```

---

**Versão:** 1.0  
**Tipo:** Visual Guide  
**Atualizado:** 19/01/2026  
**Status:** ✅ Pronto para uso
