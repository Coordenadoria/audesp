# 🚀 Guia de Transmissão - Sistema de Erros Detalhado

## Como Funciona a Nova Transmissão?

### ✅ Passo a Passo

1. **Clique em "Transmitir"** (botão no Sidebar)
   - Modal abre mostrando o progresso

2. **Sistema valida seus dados**
   - Verifica campos obrigatórios
   - Valida consistência entre seções
   - Extrai TODOS os erros encontrados

3. **Se houver erros:**
   - Modal muda para vermelho (❌ Erro na Transmissão)
   - Seção vermelha aparece com lista de problemas
   - Você vê EXATAMENTE qual campo está errado

4. **Se tudo OK:**
   - Envia documento para Audesp Piloto
   - Mostra protocolo de recebimento
   - Documento pronto para análise

---

## 🔴 Interpretando Mensagens de Erro

### Erro: "Campo obrigatório não preenchido"

**Significa**: Você precisa preencher este campo

**Solução**: 
1. Feche a modal de transmissão
2. Navegue até a seção do campo
3. Preencha o campo com dados válidos
4. Tente transmitir novamente

**Exemplo**:
```
descritor.municipio
Campo obrigatório não preenchido
```
→ Você esqueceu de selecionar o município

---

### Erro: "Mínimo X necessário"

**Significa**: Você precisa ter pelo menos X registros nesta seção

**Solução**: Adicione mais registros até atingir o mínimo

**Exemplo**:
```
relacao_empregados
Mínimo 1 empregado necessário
```
→ Você não cadastrou nenhum empregado. Adicione pelo menos 1.

---

### Erro: "Referência cruzada inválida"

**Significa**: Um documento referencia outro que não existe

**Solução**: Verifique se o documento que deveria existir está realmente cadastrado

**Exemplo**:
```
pagamentos[0].identificacao_documento_fiscal.numero
Documento fiscal "12345" não encontrado na seção 7
```
→ Você tem um pagamento referenciando a nota fiscal "12345", mas essa nota não está cadastrada

---

### Erro: "Formato inválido"

**Significa**: O valor tem um formato que o sistema não aceita

**Solução**: Corrija o formato do valor

**Exemplos**:
```
CPF inválido: 123.456.789-10
→ CPF deve ser válido (11 dígitos com check-digit correto)

CNPJ inválido: 12.345.678/0000-00
→ CNPJ deve ser válido (14 dígitos com check-digit correto)

Data inválida: 31/02/2024
→ Data deve estar no formato YYYY-MM-DD e ser válida
```

---

## 📋 Checklist Antes de Transmitir

- [ ] Preencheu **Descritor** (Ano, Mês, Município, Entidade)?
- [ ] Cadastrou pelo menos **1 Empregado**?
- [ ] Cadastrou **Documentos Fiscais** (se houver despesas)?
- [ ] Cada pagamento referencia uma **Nota Fiscal válida**?
- [ ] Preencheu **Disponibilidades** (saldos bancários)?
- [ ] Validou todos os **CPFs e CNPJs** (sem erros)?

---

## 🎯 Fluxo Comum de Erros

### Cenário 1: Documentos Relacionados

```
ERROR: Documento fiscal "001" não encontrado

✅ FIX:
1. Vá até "Documentos Fiscais"
2. Adicione a nota fiscal com número "001"
3. Tente transmitir novamente
```

### Cenário 2: Dados Inconsistentes

```
ERROR: Saldo bancário (R$ 5.000) < Total gasto (R$ 8.000)

✅ FIX:
1. Verifique se somou todos os pagamentos corretamente
2. Aumente o saldo disponível OU
3. Reduza o total de pagamentos
4. Tente transmitir novamente
```

### Cenário 3: Validação de Documento

```
ERROR: CPF inválido: 123.456.789-99

✅ FIX:
1. Copie o CPF incorreto: 123.456.789-99
2. Localize na tabela de empregados
3. Corrija para CPF válido
4. Tente transmitir novamente
```

---

## 💡 Dicas Úteis

### ✨ Ver Todos os Erros de Uma Vez

Não tente corrigir um erro por vez! O sistema mostra **TODOS** os erros na mesma tela. Leia a lista completa e corrija tudo de uma vez.

### ✨ Ordem de Correção Recomendada

1. **Primeiro**: Campos obrigatórios do Descritor
2. **Segundo**: Cadastros de funcionários/contratos
3. **Terceiro**: Validação de documentos e referências cruzadas
4. **Quarto**: Verificação de totalizadores e saldos

### ✨ Salvar Seu Progresso

Antes de transmitir, clique em **"Salvar Rascunho"** para garantir que seus dados não sejam perdidos.

---

## 📞 Ainda Com Problemas?

Se receber uma mensagem de erro não listada aqui:

1. **Anote o campo e a mensagem exata**
2. **Tente buscar o campo no formulário**
3. **Verifique se o valor está no formato correto**
4. **Contacte o suporte TCESP com a mensagem e o campo**

---

## 🟢 Status de Transmissão

| Status | Significado | Ação |
|--------|-------------|------|
| ⏳ Processando | Sistema validando | Aguarde |
| ❌ Erro | Dados inválidos | Corrija campos listados |
| ⚠️ Alerta | Aceito com ressalvas | Revise dados |
| ✅ Sucesso | Aceito e processado | Anote protocolo |

---

**Versão**: 2.1 - Sistema de Erros Detalhado  
**Data**: Janeiro 2026  
**Status**: ✅ Ativo em Produção
