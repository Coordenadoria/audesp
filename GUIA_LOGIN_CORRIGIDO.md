# 🔐 Guia de Login - AUDESP v1.9.1

## ✅ Problema Corrigido

O sistema estava rejeitando credenciais válidas por falta de validação clara dos campos de entrada.

### **O que foi corrigido:**

1. ✅ **Validação de campos vazios** - Agora verifica se CPF e senha foram preenchidos
2. ✅ **Validação de comprimento do CPF** - Verifica se tem exatamente 11 dígitos
3. ✅ **Mensagens de erro detalhadas** - Indica exatamente qual é o problema
4. ✅ **Interface melhorada** - Credenciais clicáveis para preencher automaticamente
5. ✅ **Contador visual** - Mostra quantos dígitos do CPF foram digitados (X/11)

---

## 📋 Como Fazer Login Corretamente

### **Passo 1: Acessar o Sistema**
```
URL: https://audesp.vercel.app
```

### **Passo 2: Usar uma Credencial Válida**

**Opção A (Operador):**
```
CPF:  00000000000  (11 dígitos - somente números)
Senha: demo123     (sem espaços)
Ambiente: Piloto
```

**Opção B (Gestor):**
```
CPF:  12345678901  (11 dígitos - somente números)
Senha: teste123    (sem espaços)
Ambiente: Piloto ou Produção
```

### **Passo 3: Clicar "Entrar"**
```
Sistema validará as credenciais
Processará por ~1 segundo
Será redirecionado ao Dashboard
```

---

## ⚠️ Erros Comuns e Soluções

### **Erro: "CPF e senha são obrigatórios"**
- ❌ Deixou algum campo em branco
- ✅ **Solução:** Preencha ambos os campos e tente novamente

### **Erro: "CPF deve ter exatamente 11 dígitos"**
- ❌ Digitou menos ou mais de 11 números
- ✅ **Solução:** Verifique o contador (X/11) e complete 11 dígitos
- ✅ **Dica:** Clique na credencial na caixa abaixo para preencher automaticamente

### **Erro: "CPF não encontrado..."**
- ❌ Usou um CPF que não está na lista de teste
- ✅ **Solução:** Use apenas:
  - `00000000000` (Operador)
  - `12345678901` (Gestor)

### **Erro: "Senha incorreta para este CPF"**
- ❌ CPF está correto mas senha errada
- ✅ **Solução:** Verifique a senha (case-sensitive):
  - Para `00000000000` → use `demo123`
  - Para `12345678901` → use `teste123`

### **Erro: "Erro ao fazer login. Tente novamente."**
- ❌ Erro inesperado
- ✅ **Solução:**
  1. Recarregue a página (F5)
  2. Limpe o cache (Ctrl+Shift+Del)
  3. Tente novamente

---

## 🎯 Atalho Rápido

As credenciais agora são **clicáveis**!

**Na caixa cinza abaixo do formulário:**
- Clique na credencial desejada
- CPF e Senha serão preenchidos automaticamente
- Apenas clique em "Entrar"

```
┌─────────────────────────────────────┐
│ ✅ Credenciais de Teste Válidas:    │
├─────────────────────────────────────┤
│                                     │
│ CPF: 00000000000                    │
│ Senha: demo123                      │
│ 👉 Clique para preencher            │
│                                     │
│ CPF: 12345678901                    │
│ Senha: teste123                     │
│ 👉 Clique para preencher            │
│                                     │
└─────────────────────────────────────┘
```

---

## 📝 Especificações de Entrada

### **Campo CPF:**
- **Tipo:** Texto numérico
- **Comprimento:** Exatamente 11 dígitos
- **Formato:** Apenas números (0-9)
- **Máscaras:** Removidas automaticamente
- **Validação:** Verifica tamanho antes de comparar

### **Campo Senha:**
- **Tipo:** Texto (mascarado com •••)
- **Case-sensitive:** SIM (demo123 ≠ Demo123)
- **Espaços:** Não permitidos
- **Botão:** Olho para mostrar/esconder

### **Campo Ambiente:**
- **Tipo:** Seleção (dropdown)
- **Opções:**
  - Piloto (Teste)
  - Produção
- **Padrão:** Piloto

---

## 🔒 Segurança de Login

✅ **Implementado:**
- Validação de campos
- Delay de 1 segundo (contra força bruta)
- Mensagens claras (sem exposição de informações)
- Senha mascarada visualmente
- Botão para mostrar/esconder senha

⚠️ **Nota sobre Demo:**
- Credenciais são apenas para teste
- Em produção, implementar OAuth/SSO
- Senhas devem ser encriptadas
- 2FA é recomendado

---

## 📊 Fluxo de Login

```
1. Usuário acessa https://audesp.vercel.app
                           ↓
2. Tela de login é exibida (LoginComponent)
                           ↓
3. Usuário preenche:
   - CPF (11 dígitos)
   - Senha
   - Ambiente
                           ↓
4. Clica "Entrar"
                           ↓
5. Sistema valida:
   ✓ Campos preenchidos?
   ✓ CPF tem 11 dígitos?
   ✓ CPF existe no sistema?
   ✓ Senha está correta?
                           ↓
6. Se tudo OK:
   → Sessão criada em localStorage
   → Redirecionado ao Dashboard
   → Dados do usuário carregados
                           ↓
7. Se houver erro:
   → Mensagem clara de erro
   → Campo é mantido preenchido
   → Usuário pode tentar novamente
```

---

## 💾 O Que Acontece ao Fazer Login

Após login bem-sucedido:

1. **Sessão é criada:**
   ```json
   localStorage.audesp_session = {
     "cpf": "00000000000",
     "name": "Usuário Demo",
     "environment": "piloto",
     "loginTime": "2024-01-20T...",
     "role": "operator"
   }
   ```

2. **Histórico é carregado:**
   ```json
   localStorage.audesp_history = [...]
   ```

3. **Página redirecionada:**
   - Dashboard é exibido automaticamente
   - Usuário vê suas transmissões anteriores
   - Pode navegar pelo sistema

4. **Ao fazer logout:**
   - localStorage é limpo
   - Redirecionado de volta ao login
   - Sessão é destruída

---

## 🧪 Teste do Login

### Verificar credenciais manualmente no console:

```javascript
// No console (F12), execute:
console.log(localStorage.getItem('audesp_session'));
// Deve retornar um objeto JSON com os dados da sessão

// Para testar a validação:
const testCPF = '00000000000';
const testPassword = 'demo123';
console.log(testCPF.length); // Deve ser 11
```

---

## 📞 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "CPF ou senha inválidos" | Campo vazio | Preencha ambos |
| "CPF deve ter 11 dígitos" | Menos/mais dígitos | Complete com 11 números |
| "CPF não encontrado" | CPF inválido | Use 00000000000 ou 12345678901 |
| "Senha incorreta" | Senha errada | Verifique maiúsculas/minúsculas |
| Não consegue clicar nas credenciais | Cache do navegador | Limpe cache (Ctrl+Shift+Del) |
| Login carrega infinitamente | Servidor offline | Recarregue a página |

---

## ✅ Checklist de Funcionamento

- [ ] Acessei https://audesp.vercel.app
- [ ] Vi a tela de login com fundo azul
- [ ] Preenchi CPF: 00000000000 (ou 12345678901)
- [ ] Preenchi Senha: demo123 (ou teste123)
- [ ] Selecionei Ambiente: Piloto
- [ ] Cliquei em "Entrar"
- [ ] Aguardei ~1 segundo
- [ ] Fui redirecionado ao Dashboard
- [ ] Vi meus dados e histórico de transmissões

Se todos os itens foram marcados, **login está funcionando corretamente!** ✅

---

**Atualizado em:** Janeiro 2026  
**Versão:** 1.9.1 (com correção de login)  
**Status:** ✅ Funcionando corretamente
