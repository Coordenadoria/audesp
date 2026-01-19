# 🧪 Teste de Integração: Erro 403

**Objetivo**: Verificar que a solução 403 está funcionando corretamente

---

## 📋 Checklist Pré-Teste

Antes de começar os testes:

- [ ] Código compilado sem erros
- [ ] Dependências instaladas
- [ ] Servidor dev rodando
- [ ] Console de desenvolvedor aberto (F12)
- [ ] Network tab ativo

---

## 🧪 Teste 1: Validação de Permissão (Offline)

### Setup
```bash
1. Abra o navegador
2. Vá para a aplicação (localhost:3000)
3. Abra console (F12)
```

### Teste
```typescript
// Execute no console:
import { PermissionService } from './services/permissionService';

// Teste 1: Token válido
await PermissionService.validateTransmissionPermission(
  'Prestação de Contas de Convênio',
  'eyJhbGc...',
  '12345678900'
)
// Esperado: { hasPermission: true }

// Teste 2: Token vazio
await PermissionService.validateTransmissionPermission(
  'Prestação de Contas de Convênio',
  '',
  '12345678900'
)
// Esperado: { hasPermission: false, reason: 'Token não encontrado' }
```

### Validação
```
✓ Retorna { hasPermission: boolean, reason?: string }
✓ Detecta token ausente
✓ Detecta token expirado
✓ Mensagens em português claro
```

---

## 🧪 Teste 2: Transmissão com Erro 403

### Setup
```bash
1. Login com CPF que NÃO tem permissão
   (Se não souber, pule para teste 3)
2. Prepare dados para transmissão
3. Abra Console e Network
```

### Teste
```bash
1. Clique em "Transmitir"
2. Observe:
   - Console: [Transmission] Validando permissões para...
   - Console: [Transmission] 403 Forbidden - Diagnosticando
   - Network: 403 response
```

### Validação
```
✓ Console mostra [Transmission] prefix
✓ Diagnóstico detalhado no console
✓ ErrorPanel abre com diagnósticos
✓ Mensagem amigável é exibida
✓ Código de erro presente (TRANS-403-XXXXXX)
✓ 7 passos de resolução visíveis
```

---

## 🧪 Teste 3: Fluxo Completo de Resolução

### Setup
```bash
1. Estar no erro 403
2. ErrorPanel visível
3. Menu de logout acessível
```

### Teste A: Tentar Outro CPF
```bash
1. Clique em "Fechar" no ErrorPanel
2. Menu → Logout
3. Login com CPF diferente (que tem permissão)
4. Tente transmitir novamente
```

### Validação A
```
✓ Logout funciona
✓ Login com novo CPF funciona
✓ Transmissão bem-sucedida
```

### Teste B: Renovar Token
```bash
1. Clique em "Fazer Login Novamente"
2. Digite credenciais novamente
3. Tente transmitir
```

### Validação B
```
✓ Modal de login aparece
✓ Token é renovado
✓ Transmissão tentada novamente
```

---

## 🧪 Teste 4: Console Diagnostics

### Setup
```bash
1. Abra Console (F12)
2. Mude para aba Console
3. Filtre por "[Transmission]"
```

### Teste
```bash
1. Tente uma transmissão que resulte em 403
2. Procure por: "[Transmission] 403 Forbidden"
3. Verifique conteúdo:
```

### Validação
```
✓ Contém: Token válido: SIM/NÃO
✓ Contém: CPF informado: XXXXX
✓ Contém: Tipo de Documento: [tipo]
✓ Contém: Endpoint: [URL]
✓ Contém: Response: [JSON]
✓ Contém: 🔍 DIAGNÓSTICO DO ERRO 403
✓ Contém: Possíveis causas (1-5)
✓ Contém: PRÓXIMOS PASSOS (1-4)
```

---

## 🧪 Teste 5: Auditoria

### Setup
```bash
1. Abra DevTools
2. Vá em Application → Local Storage / Session Storage
3. Procure por 'audesp_audit'
```

### Teste
```bash
1. Cause um erro 403
2. Procure no storage por evento de transmissão:
```

### Validação
```
✓ Evento registrado com status: 'PERMISSION_DENIED'
✓ Contém tipo de documento
✓ Contém mensagem de erro
✓ Timestamp é correto
✓ Protocolo é null (não enviou)
```

---

## 🧪 Teste 6: Network Tab

### Setup
```bash
1. Abra Network (F12)
2. Filtre por requests
3. Cause um 403
```

### Teste
```bash
Procure pela requisição:
```

### Validação
```
✓ URL correto
✓ Método: POST
✓ Status: 403
✓ Headers contêm:
  - Authorization: Bearer [token]
  - X-User-CPF: [cpf]
  - Accept: application/json
✓ Response contém JSON com error
✓ Resposta é legível (não truncada)
```

---

## 🧪 Teste 7: ErrorPanel UI

### Setup
```bash
1. Terar um 403
2. Observe o ErrorPanel que apareça
```

### Teste
```bash
Verificar elementos:
```

### Validação
```
✓ Título: "🔍 Diagnóstico de Erro"
✓ Botão fechar (X) funciona
✓ Resumo mostra quantidade de problemas
✓ Cada diagnóstico é expansível
✓ Expandindo mostra:
  - Ícone de severidade
  - Mensagem
  - Causa explicada
  - Solução
✓ Botão "Ver JSON com Erros" funciona
✓ Botões de ação disponíveis (Fechar, Tentar Novamente)
✓ Footer com dica útil
```

---

## 🧪 Teste 8: Responsividade

### Setup
```bash
1. Redimensione janela para mobile
2. Teste a partir de tela pequena
```

### Teste
```bash
1. Cause um erro 403
2. Observe ErrorPanel
3. Interaja com todos os elementos
```

### Validação
```
✓ ErrorPanel é responsivo
✓ Texto é legível em celular
✓ Botões são clicáveis
✓ Sem scroll horizontal desnecessário
✓ Elemento não sai da tela
```

---

## 📊 Resultados Esperados

### Se TODOS os testes passarem ✅
```
[Transmission] 403 Forbidden - Diagnosticando:
✓ Validação pré-transmissão: FUNCIONA
✓ Detecção 403: FUNCIONA
✓ Mensagem ao usuário: CLARA
✓ ErrorPanel: EXIBINDO CORRETAMENTE
✓ Console diagnostics: COMPLETO
✓ Auditoria: REGISTRANDO
✓ Network: COMO ESPERADO
✓ UI: RESPONSIVA

CONCLUSÃO: ✅ Implementação 403 está PRONTA PARA PRODUÇÃO
```

### Se algum teste FALHAR ❌
```
Verificar:
1. Arquivo permissionService.ts foi carregado?
   ls -la src/services/permissionService.ts
   
2. Import está correto em transmissionService.ts?
   grep -n "import.*PermissionService" src/services/transmissionService.ts
   
3. Não há erros de compilação?
   npm run build
   
4. ErrorPanel está sendo renderizado?
   grep -n "ErrorHelpPanel" src/App.tsx
   
5. Console mostra importação com sucesso?
   Procure por [Transmission Init] no console
```

---

## 🔧 Debug Rápido

### Erro: "PermissionService is not defined"
```bash
✓ Verificar: src/services/permissionService.ts existe?
✓ Verificar: Import em transmissionService.ts (linha 5)
✓ Hard refresh: Ctrl+Shift+R (limpar cache)
```

### Erro: "Cannot find module"
```bash
✓ Rodar: npm install
✓ Rodar: npm run build
✓ Verificar permissões do arquivo
```

### Erro: "Permission validation failed"
```bash
✓ Token está válido?
✓ CPF está preenchido?
✓ Verifique sessionStorage.getItem('audesp_token')
```

### Erro: "403 não está sendo capturado"
```bash
✓ Network tab mostra 403? (f12)
✓ Check if response.ok === false
✓ Verifique sintaxe de if(response.status === 403)
```

---

## ✅ Checklist Final de Validação

```
COMPILAÇÃO:
[ ] npm run build completa sem erros
[ ] npm run dev inicia sem erros

FUNCIONALIDADE:
[ ] Validação pré-transmissão executa
[ ] Erro 403 é detectado
[ ] Mensagem amigável aparece
[ ] ErrorPanel renderiza diagnosticos
[ ] Sugestões são exibidas

CONSOLE:
[ ] [Transmission] messages aparecem
[ ] Diagnóstico 403 é completo
[ ] Nenhuma exceção não capturada

AUDITORIA:
[ ] Evento PERMISSION_DENIED é registrado
[ ] Timestamp está correto
[ ] Tipo de documento está registrado

PERFORMANCE:
[ ] Sem lag/delay perceptível
[ ] Validação é rápida (<100ms)
[ ] UI responde imediatamente
```

---

## 📞 Se Encontrar Problemas

1. Verifique todos os 8 testes acima
2. Procure pela linha do erro no código
3. Consulte os guias de implementação
4. Verifique console do navegador (F12)
5. Procure por logs [Transmission] ou [Permission]

**Documentação de referência:**
- IMPLEMENTACAO_FIX_403.md - Detalhes técnicos
- ERRO_403_SOLUCAO_COMPLETA.md - Análise profunda
- GUIA_RAPIDO_ERRO_403.md - Manual do usuário

---

*Teste de integração criado: 2026-01-19*
