# 🔧 Sistema de Diagnóstico de Erros de Transmissão

## Erro Reportado

```json
{
  "timestamp": "09:37:59.327178979",
  "status": "400",
  "error": "Bad Request",
  "message": {
    "mensagem": "O arquivo JSON não foi validado pelo Schema!",
    "erros": [
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor.nome: is not defined in the schema and the schema does not allow additional properties",
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor: may only have a maximum of 2 properties",
      "$.pagamentos[1].identificacao_documento_fiscal.identificacao_credor.nome: is not defined in the schema and the schema does not allow additional properties",
      "$.pagamentos[1].identificacao_documento_fiscal.identificacao_credor: may only have a maximum of 2 properties"
    ]
  },
  "path": "/f5/enviar-prestacao-contas-convenio"
}
```

---

## 🔍 Análise do Erro

### Problema Principal
O objeto `identificacao_credor` está com **campos extras** que não são permitidos pelo schema do Audesp.

### Detalhes
- **Campo problemático:** `$.pagamentos[].identificacao_documento_fiscal.identificacao_credor`
- **Propriedades extras:** `nome` (não definida no schema)
- **Limite:** máximo de 2 propriedades permitidas
- **Status:** 400 Bad Request

---

## ✅ Solução

### Passo 1: Identificar Estrutura Correta

**Errado ❌**
```json
{
  "identificacao_credor": {
    "cpf_cnpj": "12345678901234",
    "nome": "Empresa XYZ"  // ← Campo extra, não permitido!
  }
}
```

**Correto ✓**
```json
{
  "identificacao_credor": {
    "cpf_cnpj": "12345678901234"
    // Apenas 1 propriedade permitida
  }
}
```

### Passo 2: Remover Campo `nome`

Se seu JSON tem campo `nome` em `identificacao_credor`, **remova-o**.

### Passo 3: Validar Propriedades

Máximo de propriedades permitidas: **2**
- Exemplo com 2: `{ "cpf_cnpj": "...", "identificacao_pessoa": "..." }`

### Passo 4: Reenviar

Após correção, tente enviar novamente a prestação de contas.

---

## 📋 Guia Completo de Erros

### Erro 1: Campo Não Definido no Schema

**Mensagem:**
```
is not defined in the schema and the schema does not allow additional properties
```

**Causa:** Campo existe no JSON mas não está definido no schema Audesp

**Solução:**
1. Identifique o campo mencionado (ex: `nome`)
2. Remova do JSON
3. Reenvie

**Exemplo:**
```javascript
// Antes
const json = {
  pagamentos: [{
    identificacao_documento_fiscal: {
      identificacao_credor: {
        cpf_cnpj: "12345",
        nome: "Empresa"  // ❌ Remove isso
      }
    }
  }]
};

// Depois
const json = {
  pagamentos: [{
    identificacao_documento_fiscal: {
      identificacao_credor: {
        cpf_cnpj: "12345"  // ✓ Apenas o necessário
      }
    }
  }]
};
```

---

### Erro 2: Excesso de Propriedades

**Mensagem:**
```
may only have a maximum of X properties
```

**Causa:** Objeto tem mais campos que o permitido pelo schema

**Solução:**
1. Identifique o objeto mencionado
2. Verifique quantas propriedades tem
3. Remova as extras
4. Deixe apenas o necessário

**Exemplo:**
```javascript
// Antes (3 propriedades, máximo é 2)
{
  cpf_cnpj: "123",
  identificacao_pessoa: "PJ",
  nome: "Empresa"  // ❌ Remove
}

// Depois (2 propriedades)
{
  cpf_cnpj: "123",
  identificacao_pessoa: "PJ"
}
```

---

### Erro 3: Campo Obrigatório Ausente

**Mensagem:**
```
is required and must be supplied
```

**Causa:** Campo obrigatório não foi fornecido

**Solução:**
1. Adicione o campo mencionado
2. Preencha com valor correto
3. Reenvie

---

### Erro 4: Formato Inválido

**Mensagem:**
```
does not conform to the specified format
```

**Causa:** Valor não está no formato esperado

**Solução:**
1. Identifique o campo
2. Verifique o formato esperado
3. Corrija o valor
4. Reenvie

---

## 🎯 Guia de Correção Rápida

| Erro | Causa | Solução |
|------|-------|---------|
| **Campo não definido** | Campo extra não permitido | Remova o campo |
| **Excesso de propriedades** | Muitos campos no objeto | Reduza para o máximo |
| **Campo obrigatório** | Falta campo necessário | Adicione o campo |
| **Formato inválido** | Valor em formato errado | Corrija o formato |
| **Tipo incorreto** | Campo é string mas esperava número | Use tipo correto |

---

## 📊 Estrutura Schema Esperada

```json
{
  "pagamentos": [
    {
      "identificacao_documento_fiscal": {
        "identificacao_credor": {
          "cpf_cnpj": "string (obrigatório)",
          "identificacao_pessoa": "string (opcional)"
          // Máximo: 2 propriedades
          // Não permitido: nome, razao_social, etc
        }
      },
      // ... outros campos
    }
  ]
}
```

---

## 🚨 Checklist de Validação

Antes de enviar prestação de contas, verifique:

- [ ] Nenhum campo extra em `identificacao_credor`
- [ ] Máximo 2 propriedades em `identificacao_credor`
- [ ] `cpf_cnpj` presente e preenchido
- [ ] Nenhum campo `nome` em `identificacao_credor`
- [ ] Todos os campos obrigatórios preenchidos
- [ ] Formatos corretos (datas, números, strings)
- [ ] JSON válido (sem erros de sintaxe)
- [ ] Validado contra schema Audesp

---

## 🔗 Referências

- [Schema Audesp Completo](https://audesp.tce.sp.gov.br/schema)
- [Documentação de Erros](./DIAGNOSTICO_FINAL_FAILED_TO_FETCH.md)
- [Guia Transmissão](./QUICK_START_TRANSMISSAO.md)
- [FAQ Erros](./COMO_RESOLVER_ERRO_401.md)

---

**Sistema de Diagnóstico** | Versão 1.0 | Audesp Connect
