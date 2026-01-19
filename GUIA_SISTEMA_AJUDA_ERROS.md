# 🆘 Sistema de Ajuda e Diagnóstico de Erros

## Visão Geral

O Audesp Connect v2.2 agora inclui um **sistema inteligente de diagnóstico de erros** que analisa falhas de transmissão e oferece soluções automáticas.

---

## ✨ Funcionalidades

### 1. Diagnóstico Automático
Quando um erro ocorre, o sistema:
- ✅ Identifica o tipo de erro (400, 401, 500, etc)
- ✅ Analisa mensagens de validação JSON
- ✅ Categoriza por severidade (crítico, erro, aviso, info)
- ✅ Fornece causa e solução para cada problema

### 2. Sugestões de Correção
- ✅ Identifica campos extras no JSON
- ✅ Detecta excesso de propriedades
- ✅ Valida campos obrigatórios
- ✅ Sugere correções automáticas

### 3. Interface Amigável
- ✅ Painel visual de diagnóstico
- ✅ Expandir/recolher detalhes de erro
- ✅ Código colorido por severidade
- ✅ Botões de ação rápida

---

## 🔴 Erro Específico: Schema Validation

### Problema Original

```json
{
  "status": "400",
  "message": {
    "mensagem": "O arquivo JSON não foi validado pelo Schema!",
    "erros": [
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor.nome: is not defined in the schema and the schema does not allow additional properties",
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor: may only have a maximum of 2 properties"
    ]
  }
}
```

### Análise Automática

O sistema detecta:
1. **Campo não permitido:** `nome` em `identificacao_credor`
2. **Limite de propriedades:** Máximo 2, mas você tem mais
3. **Localização:** `$.pagamentos[0]` (primeiro pagamento)

### Solução Automática

```javascript
// Antes (ERRADO)
{
  "pagamentos": [{
    "identificacao_documento_fiscal": {
      "identificacao_credor": {
        "cpf_cnpj": "123",
        "nome": "Empresa XYZ"  // ❌ CAMPO EXTRA
      }
    }
  }]
}

// Depois (CORRETO - após auto-fix)
{
  "pagamentos": [{
    "identificacao_documento_fiscal": {
      "identificacao_credor": {
        "cpf_cnpj": "123"  // ✓ APENAS O NECESSÁRIO
      }
    }
  }]
}
```

---

## 📋 Tipos de Erros Suportados

### 1. Erro 400 - Bad Request
**Causa:** Validação de schema falhou
**Solução:** Remover campos extras ou adicionar campos obrigatórios

### 2. Erro 401 - Unauthorized
**Causa:** Email/senha incorretos ou sem permissão
**Solução:** Verificar credenciais ou solicitar permissão ao Audesp

### 3. Erro 403 - Forbidden
**Causa:** Acesso negado
**Solução:** Contatar administrador

### 4. Erro 404 - Not Found
**Causa:** Endpoint ou recurso não existe
**Solução:** Verificar ambiente (Piloto vs Produção)

### 5. Erro 500 - Server Error
**Causa:** Problema no servidor Audesp
**Solução:** Tentar novamente em alguns minutos

### 6. Erro de Rede
**Causa:** Sem conexão com servidor
**Solução:** Verificar internet

---

## 🎯 Como Funciona

### Fluxo de Diagnóstico

```
┌─────────────────────────┐
│  Erro de Transmissão    │
└────────────┬────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  ErrorDiagnosticsService.diagnoseError()
│  • Analisa status HTTP
│  • Parse de mensagem
│  • Categorização
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Criação de Diagnósticos
│  • Type: Tipo de erro
│  • Severity: crítico/erro/aviso/info
│  • Message: Descrição curta
│  • Cause: Causa raiz
│  • Solution: Como resolver
│  • AffectedField: Campo problema
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Exibição em ErrorHelpPanel
│  • Interface visual
│  • Detalhes expandíveis
│  • Botões de ação
│  • Sugestões
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Ações do Usuário
│  • Fechar (rejeitar diagnóstico)
│  • Corrigir Automaticamente (usar fix)
│  • Tentar Novamente (retry)
│  • Editar JSON manualmente
└──────────────────────────────────────┘
```

---

## 💻 Serviço de Diagnóstico

### Arquivo: `src/services/errorDiagnosticsService.ts`

#### Métodos Principais

**`diagnoseError(error)`**
- Analisa erro completo
- Retorna array de diagnósticos
- Lida com múltiplos erros

**`analyzeSchemaErrors(error)`**
- Parseament de erros de schema
- Extração de campo problemático
- Tipo de erro específico

**`suggestFixesForJSON(json, diagnostics)`**
- Gera JSON corrigido
- Remove campos extras
- Limita propriedades
- Retorna cópia limpa

**`formatDiagnosticForDisplay(diag)`**
- Formatação para console
- Strings legíveis
- Estrutura clara

---

## 🎨 Componente de Exibição

### Arquivo: `src/components/ErrorHelpPanel.tsx`

#### Props

```typescript
interface ErrorHelpPanelProps {
  error: any;              // Objeto de erro
  onDismiss: () => void;   // Fechar painel
  onRetry?: () => void;    // Tentar novamente
  onAutoFix?: (fixedData: any) => void;  // Usar JSON corrigido
  jsonData?: any;          // JSON original para correção
}
```

#### Características

- ✅ Modal expansível
- ✅ Diagnósticos agrupados por severidade
- ✅ Detalhes técnicos ocultos/expandidos
- ✅ Botões de ação rápida
- ✅ Resposta ao clique expandir

---

## 🚀 Como Usar

### No Componente de Transmissão

```typescript
import ErrorHelpPanel from '../components/ErrorHelpPanel';
import ErrorDiagnosticsService from '../services/errorDiagnosticsService';

const [showErrorHelp, setShowErrorHelp] = useState(false);
const [transmissionError, setTransmissionError] = useState(null);

const handleTransmit = async (jsonData) => {
  try {
    await transmissionService.transmit(jsonData);
  } catch (error) {
    setTransmissionError(error);
    setShowErrorHelp(true);
  }
};

const handleAutoFix = (fixedData) => {
  // Usar JSON corrigido para nova tentativa
  setShowErrorHelp(false);
  handleTransmit(fixedData);
};

return (
  <>
    {/* ... componente principal ... */}
    
    {showErrorHelp && (
      <ErrorHelpPanel
        error={transmissionError}
        onDismiss={() => setShowErrorHelp(false)}
        onRetry={() => handleTransmit(jsonData)}
        onAutoFix={handleAutoFix}
        jsonData={jsonData}
      />
    )}
  </>
);
```

---

## 📊 Exemplo de Diagnóstico Completo

### Entrada: Erro de Validação

```json
{
  "status": 400,
  "message": {
    "mensagem": "O arquivo JSON não foi validado pelo Schema!",
    "erros": [
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor.nome: is not defined",
      "$.pagamentos[0].identificacao_documento_fiscal.identificacao_credor: may only have 2 properties"
    ]
  }
}
```

### Saída: Diagnósticos

```javascript
[
  {
    code: "SCHEMA_UNDEFINED",
    type: "Validação Schema",
    severity: "error",
    message: `Campo "pagamentos[0].identificacao_documento_fiscal.identificacao_credor.nome" não é definido no schema`,
    cause: "Seu JSON contém um campo que não é permitido pelo Audesp",
    solution: "Remova o campo \"nome\" do seu JSON e tente novamente.",
    affectedField: "pagamentos[0].identificacao_documento_fiscal.identificacao_credor.nome"
  },
  {
    code: "SCHEMA_MAX_PROPS",
    type: "Validação Schema",
    severity: "error",
    message: `Objeto "pagamentos[0].identificacao_documento_fiscal.identificacao_credor" tem muitas propriedades`,
    cause: "Este objeto pode ter no máximo 2 propriedade(s), mas você enviou mais.",
    solution: `Verifique o objeto "pagamentos[0].identificacao_documento_fiscal.identificacao_credor" e remova propriedades extras`,
    affectedField: "pagamentos[0].identificacao_documento_fiscal.identificacao_credor"
  }
]
```

---

## ✅ Migrações Realizadas

### 1. Login
- ✅ Removido login por CPF
- ✅ Apenas email agora
- ✅ Interface simplificada
- ✅ Sem abas de seleção

### 2. Transmissão
- ✅ Removido CPF de CredentialsModal
- ✅ Apenas email para verificação
- ✅ Interface mais simples
- ✅ Sem tabs

### 3. Sistema de Ajuda
- ✅ Criado ErrorDiagnosticsService
- ✅ Criado ErrorHelpPanel
- ✅ Integração com tipos de erro
- ✅ Sugestões automáticas

---

## 📈 Benefícios

| Antes | Depois |
|-------|--------|
| Erros confusos | Diagnóstico claro |
| Sem orientação | Soluções sugeridas |
| Manual fixing | Auto-fix disponível |
| Sem contexto | Contexto completo |
| Multiple tabs | Interface simples (email) |

---

## 🔧 Próximos Passos

1. **Testar com JSON real**
   - Usar exemplo_data.json
   - Simular erros comuns
   - Validar correções

2. **Melhorias Futuras**
   - Histórico de erros
   - Sugestões com IA
   - Corretores específicos por tipo
   - Educação do usuário

3. **Integração Completa**
   - Todos os componentes usando ErrorHelpPanel
   - Logs centralizados
   - Analytics de erros

---

## 📚 Referências

- [Sistema de Diagnóstico (MD)](./SISTEMA_DIAGNOSTICO_ERROS.md)
- [Guia Login Email](./GUIA_LOGIN_EMAIL.md)
- [FAQ Erros](./COMO_RESOLVER_ERRO_401.md)

---

**Versão:** 2.2 | **Status:** Production Ready | **Data:** 2024
