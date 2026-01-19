# 403 Forbidden - Solução Completa

## 📋 Problema Relatado

```
Error: {
  "timestamp": "2026-01-19T13:46:57.207+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "O usuário não possui autorização para realizar esta operação.",
  "path": "/f5/enviar-prestacao-contas-convenio"
}
```

**Significado**: O usuário autenticado (token válido) não tem **permissão** para executar esta operação específica.

---

## 🔍 Análise da Causa

O erro **403 Forbidden** é diferente de **401 Unauthorized**:

| Código | Significado | Causa |
|--------|-------------|-------|
| **401** | Não autenticado | Token inválido, expirado ou não fornecido |
| **403** | Sem permissão | Usuário autenticado mas sem acesso ao recurso |

### Possíveis Razões para 403:

1. **CPF não autorizado para este tipo de documento**
   - O CPF tem conta ativa no Audesp, mas não tem permissão específica para transmitir "Prestação de Contas de Convênio"

2. **Credencial em status de validação**
   - CPF/Email foi registrado recentemente e ainda não foi validado

3. **Permissões revogadas**
   - Acesso foi temporariamente revogado pela instituição

4. **Ambiente incorreto**
   - Piloto e Produção podem ter conjuntos de permissões diferentes

5. **Perfil insuficiente**
   - CPF tem permissão para ver dados, mas não para transmitir

---

## ✅ Soluções Implementadas

### 1. **Validação Melhorada de Permissões** (`permissionService.ts`)

Um novo serviço foi criado para validar permissões **antes** da tentativa de transmissão:

```typescript
// Validar permissões antes de enviar
const permissionCheck = await PermissionService.validateTransmissionPermission(
  tipoDoc, 
  token, 
  cpf
);

if (!permissionCheck.hasPermission) {
  throw new Error(`Validação de Permissão Falhou:\n${errorMessage}`);
}
```

**Benefícios:**
- Falha rápida se não há permissão básica
- Evita requisição desnecessária ao servidor
- Melhor feedback ao usuário

### 2. **Tratamento Específico de 403** (`transmissionService.ts`)

O serviço de transmissão agora trata 403 com diagnóstico detalhado:

```typescript
if (response.status === 403) {
    // Diagnóstico completo com:
    // - Token verificado
    // - CPF informado
    // - Tipo de documento
    // - URL endpoint
    // - Resposta completa do servidor
    
    // Mensagem amigável ao usuário com:
    // - Razão do erro
    // - Possíveis causas
    // - Próximas ações
    // - Código de erro único
}
```

### 3. **Diagnóstico no ErrorPanel** (`errorDiagnosticsService.ts`)

Já existente, melhorado com tratamento de 403:

```
PERM_403 - Permissão
├─ Problema: "Acesso negado - O usuário não possui autorização"
├─ Causa: CPF sem permissão para transmitir este tipo de documento
└─ Solução: 7 passos detalhados para resolver
```

---

## 🎯 Fluxo de Resolução para o Usuário

### Se receber erro 403:

```
❌ Acesso Negado (403)
   Você não possui permissão para transmitir este documento

⚠️ Verifique com o Administrador:
   • Seu CPF está autorizado para transmitir?
   • Seu perfil no Audesp inclui esta operação?
   • Suas permissões foram revogadas?

💡 PRÓXIMAS AÇÕES:
   1. Tente fazer login com outro CPF autorizado
   2. Se correto, clique "Fazer Login Novamente"
   3. Contate: suporte@audesp.tce.sp.gov.br
   4. Compartilhe o código: TRANS-403-XXXXXX
```

### Passos Recomendados:

1. **Verificar CPF**
   - Confirme que está usando o CPF correto
   - Verifique se é um CPF que já transmitiu antes

2. **Tentar Outro CPF**
   - Faça logout (menu superior)
   - Tente login com outro CPF que você sabe ter permissão
   - Se funcionar, o problema é específico do primeiro CPF

3. **Fazer Login Novamente**
   - Clique em "Fazer Login Novamente" no erro
   - Isso renova o token e às vezes resolve

4. **Contatar Suporte**
   - Vá em: https://audesp-piloto.tce.sp.gov.br
   - Ou envie email: suporte@audesp.tce.sp.gov.br
   - Compartilhe:
     - Seu CPF
     - Tipo de documento ("Prestação de Contas de Convênio")
     - Código de erro (TRANS-403-XXXXXX)

---

## 📁 Arquivos Modificados

### Novos Arquivos:
- **`src/services/permissionService.ts`** - Novo serviço de validação de permissões

### Arquivos Modificados:
- **`src/services/transmissionService.ts`**
  - Importa `PermissionService`
  - Valida permissões antes de transmitir
  - Tratamento detalhado de erro 403

### Arquivos Não Alterados (já com suporte):
- **`src/services/errorDiagnosticsService.ts`** - Já tinha tratamento de 403
- **`src/components/ErrorHelpPanel.tsx`** - Já exibe diagnósticos com resoluções
- **`src/App.tsx`** - Já captura e exibe erros de transmissão

---

## 🧪 Como Testar

### Cenário 1: Simular erro 403 (sem servidor real)
```bash
# O permissionService permite teste local validando token e CPF
# Se ambos forem válidos, a requisição é feita
# Se retornar 403, o novo tratamento será ativado
```

### Cenário 2: Com servidor Audesp ativo
```bash
1. Faça login com CPF SEM permissão de transmissão
2. Tente enviar qualquer documento
3. Deve receber erro 403 com diagnóstico melhorado
```

### Cenário 3: Verificar mensagens amigáveis
```bash
1. Abra console do navegador (F12)
2. Procure por [Transmission] 403 Forbidden - Diagnosticando
3. Verifique que todas as informações estão sendo capturadas
```

---

## 🔧 Código Técnico

### Validação de Permissão (pré-transmissão)
```typescript
// Em transmissionService.ts
const permissionCheck = await PermissionService.validateTransmissionPermission(
  tipoDoc, 
  token, 
  cpf
);

if (!permissionCheck.hasPermission) {
  console.error('[Transmission] Falha na validação:', permissionCheck.reason);
  AuditLogger.logTransmission(tipoDoc, null, 'PERMISSION_DENIED', reason);
  throw new Error(`❌ Validação de Permissão Falhou:\n${reason}`);
}
```

### Tratamento de 403 (pós-resposta)
```typescript
if (response.status === 403) {
  const diagnosticInfo = `[Transmission] 403 Forbidden - Diagnosticando:
    1. Token válido: SIM/NÃO
    2. CPF informado: ${cpf}
    3. Tipo de Documento: ${tipoDoc}
    4. Endpoint: ${fullUrl}
    5. Response: ${errorDetails}`;
  
  console.error(diagnosticInfo);
  
  throw new Error(`❌ Acesso Negado (403):\n${result.message}`);
}
```

---

## 📊 Resumo de Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tratamento 403** | Erro genérico | Diagnóstico específico |
| **Validação permissão** | Só no servidor | Também no cliente |
| **Mensagem ao usuário** | JSON bruto | Mensagem amigável |
| **Código de erro** | N/A | TRANS-403-XXXXXX |
| **Auditoria** | Apenas sucesso | Falhas também registradas |
| **Resolution steps** | Não havia | 7 passos claros |

---

## 🎓 Melhorias Futuras

1. **Endpoint de Permissões**
   - Criar endpoint no Audesp que retorna permissões do usuário
   - Verificar permissões específicas por tipo de documento

2. **Cache de Permissões**
   - Cachear permissões por CPF para evitar requisições repetidas
   - Invalidar cache após login novo

3. **Auto-Switch de Ambiente**
   - Se 403 em Piloto, sugerir tentar em Produção
   - Se 403 em Produção, sugerir tentar em Piloto

4. **Recuperação Automática**
   - Tentar renovar token automaticamente se expirado
   - Reconectar se houver falha de rede

---

## 📞 Suporte

**Se o erro persistir:**

1. Verifique se está usando ambiente correto (Piloto vs Produção)
2. Tente com outro CPF autorizado
3. Contate suporte do Audesp com o código de erro

**Email de Suporte:** suporte@audesp.tce.sp.gov.br
**Portal:** https://audesp-piloto.tce.sp.gov.br

---

*Documentação atualizada: 2026-01-19*
