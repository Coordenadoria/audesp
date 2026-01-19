# 📄 Visualizador JSON com Highlighting de Erros

## O Que É

Um novo componente interativo que mostra seu JSON com highlighting dos erros exatos, permitindo você:
- ✅ Ver onde estão os problemas
- ✅ Entender por que é erro
- ✅ Editar os campos diretamente
- ✅ Testar correções antes de reenviar

---

## 🎯 Como Funciona

### 1. Painel de Diagnóstico Aparece
Quando há erro na transmissão, o sistema mostra:
```
🔍 Diagnóstico de Erro
├─ 📋 Resumo
├─ ▶ Ver JSON com Erros  ← CLIQUE AQUI
└─ ❌ Lista de Problemas
```

### 2. Clique "Ver JSON com Erros"
O painel se expande mostrando:
```
📄 JSON com Highlighting de Erros
{
  "pagamentos": [
    {
      "identificacao_credor": {
        "cpf_cnpj": "123",
        "nome": "Empresa"  ← 🔴 DESTACADO EM VERMELHO
      }
    }
  ]
}
```

### 3. Campos com Erro Aparecem em Vermelho

```
⚠️ Erro:
Campo "nome" não é definido no schema

Solução:
Remova o campo "nome" do seu JSON
```

### 4. Clique [editar] para Corrigir

```
"nome": "Empresa XYZ"
          [editar] ← Clique

Apareça input para editar:
[___________________]
[✓ Salvar] [✕ Cancelar]
```

### 5. Salve e Teste

```
Após edição:
├─ [✓ Salvar]
└─ JSON atualizado no sistema

Depois:
├─ [✨ Usar JSON Corrigido]
└─ Tentativa de transmissão automática
```

---

## 🔴 Exemplo Visual

### Erro Original
```json
{
  "pagamentos": [
    {
      "identificacao_documento_fiscal": {
        "identificacao_credor": {
          "cpf_cnpj": "12345678901234",
          "nome": "Empresa XYZ",     ← 🔴 ERRO 1: Campo extra
          "razao_social": "XYZ Ltd"  ← 🔴 ERRO 2: Excesso de props
        }
      }
    }
  ]
}
```

### Visualização no Sistema
```
$ pagamentos
  ▼ [1 item]
    [0]:
      ▼ identificacao_documento_fiscal
        ▼ identificacao_credor        (BG: VERMELHO - tem erros)
          ✓ "cpf_cnpj": "12345..."
          🔴 "nome": "Empresa"
             ⚠️ Erro: Campo não definido no schema
             Solução: Remover o campo "nome"
             [editar]
          🔴 "razao_social": "XYZ Ltd"
             ⚠️ Erro: Excesso de propriedades
             Solução: Remover este campo (máximo 2 props)
             [editar]
```

### Após Corrigir
```json
{
  "pagamentos": [
    {
      "identificacao_documento_fiscal": {
        "identificacao_credor": {
          "cpf_cnpj": "12345678901234"  ← ✓ CORRETO (apenas necessário)
        }
      }
    }
  ]
}
```

---

## 🎮 Funcionalidades

### 1. Navegação Expandível
```
▶ pagamentos     ← Clique para expandir
▼ pagamentos
  [0]:
    ▶ {...}
    ▼ {...}
```

### 2. Highlighting por Erro
- 🟢 **Verde**: Sem erro
- 🔴 **Vermelho**: Campo com problema
- 🟡 **Amarelo**: Edição em progresso

### 3. Edição Inline
```
"campo": "valor"
         [editar] ← Transforma em input
[novo_valor______]
[✓ Salvar] [✕ Cancelar]
```

### 4. Botões de Ação
```
[✨ Usar JSON Corrigido]  ← Aplicar mudanças
[↺ Resetar]              ← Voltar ao original
```

---

## 📋 Passo a Passo Completo

### Cenário: Você tem erro de transmissão

**Passo 1:** Sistema retorna erro 400
```
❌ ERRO: Campo "nome" não permitido
```

**Passo 2:** ErrorHelpPanel aparece com botão
```
🔍 Diagnóstico de Erro
[▶ Ver JSON com Erros]
```

**Passo 3:** Clique para expandir
```
[▼ Ver JSON com Erros]
(JSON apareça abaixo)
```

**Passo 4:** Localizar erro no JSON
```
"identificacao_credor": {
  🔴 "nome": "Empresa"    ← Encontrado!
}
```

**Passo 5:** Ler a sugestão
```
⚠️ Erro: Campo "nome" não é definido no schema
Solução: Remova o campo "nome" do seu JSON
```

**Passo 6:** Clique [editar]
```
Input aparece:
"Empresa"
[______________]
[✓ Salvar]
```

**Passo 7:** Delete o conteúdo e salve
```
"" ← Vazio
[✓ Salvar]
```

**Passo 8:** Ou remova via auto-fix
```
[✨ Usar JSON Corrigido]
```

**Passo 9:** Sistema tenta novamente
```
Transmitindo com JSON corrigido...
✅ Sucesso!
```

---

## 🎨 Interface Visual

### Cores e Símbolos

| Elemento | Cor | Símbolo | Significado |
|----------|-----|---------|------------|
| Sem erro | Verde | ✓ | Campo OK |
| Com erro | Vermelho | 🔴 | Problema encontrado |
| Edição | Amarelo | ✏️ | Editando |
| Salvo | Verde | ✓ | Alteração aplicada |

### Níveis de Profundidade

```
$ Root (nível 0)
  └─ $.pagamentos (nível 1)
     └─ $.pagamentos[0] (nível 2)
        └─ $.pagamentos[0].identificacao_credor (nível 3)
           └─ $.pagamentos[0].identificacao_credor.nome (nível 4)
```

Cada nível tem indentação visual para facilitar leitura.

---

## 💡 Dicas de Uso

### Dica 1: Começar por Cima
Expanda primeiro os níveis superiores (`pagamentos`, depois `[0]`, etc)

### Dica 2: Procurar por Vermelho
Campos com erro sempre ficam em vermelho com BG vermelho claro

### Dica 3: Ler a Sugestão
Cada erro tem uma sugestão específica de como corrigir

### Dica 4: Editar Direto
Não precisa copiar/colar - clique [editar] no campo problemático

### Dica 5: Resetar se Necessário
Se errar ao editar, clique [↺ Resetar] para voltar ao original

---

## 🔧 Erros Comuns Detectados

### 1. Campo Extra Não Permitido
```
"nome": "value"  → Campo não definido no schema

❌ Detectado:
  Campo: $.pagamentos[0].identificacao_credor.nome
  Problema: is not defined in the schema

✅ Solução:
  Remova o campo [editar] → deletar → [✓ Salvar]
```

### 2. Excesso de Propriedades
```
{
  "prop1": "val1",
  "prop2": "val2",
  "prop3": "val3"  ← Excesso!
}

❌ Detectado:
  Objeto pode ter máximo 2, tem 3

✅ Solução:
  Remova propriedades extras
```

### 3. Campo Obrigatório Faltando
```
{
  // "cpf_cnpj" ausente!
  "nome": "Empresa"
}

❌ Detectado:
  "cpf_cnpj" é obrigatório

✅ Solução:
  Adicione o campo: [editar] → inserir → [✓ Salvar]
```

---

## 📱 Funciona em

- ✅ Desktop (navegadores modernos)
- ✅ Tablet
- ✅ Mobile (com scroll)
- ✅ Modo escuro (suportado)

---

## 🎓 Exemplos de Correção

### Exemplo 1: Remover Campo Extra

**Antes:**
```json
{
  "cpf_cnpj": "123",
  "nome": "Empresa",
  "razao_social": "Ltd"
}
```

**Passos:**
1. Clique [editar] em "razao_social"
2. Delete o conteúdo
3. Clique [✓ Salvar]
4. Resultado: campo vazio ou removido

**Depois:**
```json
{
  "cpf_cnpj": "123",
  "nome": "Empresa"  ← Apenas 2 props
}
```

### Exemplo 2: Corrigir Valor

**Antes:**
```json
{
  "data": "32/13/2024"  ← Inválido
}
```

**Passos:**
1. Clique [editar] em "data"
2. Mude para: "15/12/2024"
3. Clique [✓ Salvar]

**Depois:**
```json
{
  "data": "15/12/2024"  ← Válido
}
```

### Exemplo 3: Usar Auto-Fix

**Antes:**
```json
{
  "cpf_cnpj": "123",
  "nome": "Empresa",
  "tipo": "PJ"
}
```

**Passos:**
1. Clique [✨ Usar JSON Corrigido]
2. Sistema remove automaticamente campos extras

**Depois:**
```json
{
  "cpf_cnpj": "123"  ← Auto-fix fez a limpeza
}
```

---

## 🚀 Integração Automática

O visualizador já está integrado ao sistema:

1. **Erro na transmissão** → ErrorHelpPanel aparece
2. **Clique "Ver JSON"** → JSONErrorViewer é renderizado
3. **Visualize os erros** → Campos em vermelho aparecem
4. **Edite ou auto-fix** → Corrija conforme necessário
5. **Tente novamente** → Transmita com JSON corrigido

---

## 📊 Status

- ✅ Componente `JSONErrorViewer.tsx` criado
- ✅ Integrado em `ErrorHelpPanel.tsx`
- ✅ Build compilado (sem erros)
- ✅ Pronto para uso

---

**Versão:** 2.2.1 | **Status:** ✅ Production Ready | **Data:** 2024
