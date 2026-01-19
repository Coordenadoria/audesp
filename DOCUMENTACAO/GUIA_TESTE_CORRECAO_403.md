# 🧪 Guia de Teste: Correção do Erro 403

**Data**: 2026-01-19  
**Alterações**: 3 melhorias implementadas

---

## ✅ Mudanças Realizadas

### 1. Formato do Campo JSON (CRÍTICA)
**Arquivo**: `src/services/transmissionService.ts` linha 93-96

**O que mudou:**
```
ANTES: JSON como Blob com nome de arquivo
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  formData.append('documentoJSON', jsonBlob, 'prestacao_...json');
                                           ↑
                                    Nome de arquivo = Erro!

DEPOIS: JSON como texto simples
  const jsonString = JSON.stringify(payload);
  formData.append('documentoJSON', jsonString);
                                   ↑
                            Conforme especificação Audesp
```

### 2. Headers Adicionados (IMPORTANTE)
**Arquivo**: `src/services/transmissionService.ts` linha 77-85

**Headers adicionados:**
```
'Origin': 'https://audesp-piloto.tce.sp.gov.br'
'Referer': 'https://audesp-piloto.tce.sp.gov.br/'
'User-Agent': 'Mozilla/5.0...' (compatível com navegador)
```

**Motivo**: Alguns servidores governamentais requerem esses headers

### 3. Logs de Debug Melhorados
**Arquivo**: `src/services/transmissionService.ts` líneas 95-108 e 130-145

**Novo output no console:**
```
[Transmission] JSON Payload Structure:
  descritor: {...}
  hasCodigo: true
  hasRetificacao: true
  totalFields: 23
  jsonSize: 2450 bytes

[Transmission] Form data fields:
  hasDocumentoJSON: true
  documentoJSONSize: 2450 bytes
```

---

## 🚀 Como Testar

### Teste 1: Verificar Logs no Console

1. Abra a aplicação: `localhost:3000`
2. Pressione F12 (DevTools)
3. Vá para aba Console
4. Preencha o formulário e clique "Transmitir"
5. **Procure por:**
   ```
   ✓ [Transmission] JSON Payload Structure
   ✓ [Transmission] Request headers (com Origin e Referer)
   ✓ [Transmission] Form data fields (documentoJSON presente)
   ```

### Teste 2: Monitorar Network

1. Abra DevTools (F12)
2. Vá para aba Network
3. Clique em "Transmitir"
4. Procure pela requisição POST
5. **Verifique:**
   - ✅ Headers contêm `Origin`, `Referer`, `User-Agent`
   - ✅ Headers contêm `Authorization: Bearer ...`
   - ✅ Body contém `Form Data` com `documentoJSON`
   - ✅ `Content-Type` é `multipart/form-data` (auto)

### Teste 3: Teste Real de Transmissão

```bash
# 1. Com permissões completas, tente transmitir
Resultado esperado: Sucesso (protocolo recebido)

# 2. Se ainda der 403, verifique no console:
[Transmission] JSON Payload Structure
[Transmission] Request headers (com Origin/Referer)

# 3. Se der 400, significa JSON inválido (progresso!)
Motivo: Schema validation do Audesp
Solução: Verificar campos obrigatórios
```

---

## 📊 Antes vs Depois

### Situação ANTES
```
JSON enviado: {"descritor": {...}, ...} como arquivo
Headers: Authorization, Accept apenas
Resultado: 403 Forbidden
Motivo: Servidor rejeita formato incorreto como 403
```

### Situação DEPOIS
```
JSON enviado: {"descritor": {...}, ...} como texto
Headers: Authorization, Accept, Origin, Referer, User-Agent
Resultado: 200 OK (esperado) ou 400 (se dados inválidos)
Motivo: Formato correto conforme Audesp
```

---

## 🔍 O Que Observar nos Logs

### Logs Esperados (SUCESSO)
```
[Transmission] ✓ Permissões validadas. Enviando para: https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio
[Transmission] JSON Payload Structure:
  descritor: { tipo_documento: "Prestação de Contas de Convênio", ... }
  hasCodigo: true
  hasRetificacao: true
  totalFields: 25
  jsonSize: 3200 bytes
[Transmission] Request headers:
  Origin: https://audesp-piloto.tce.sp.gov.br
  Referer: https://audesp-piloto.tce.sp.gov.br/
  User-Agent: Mozilla/5.0...
[Transmission] Form data fields:
  hasDocumentoJSON: true
  documentoJSONSize: 3200 bytes
[Transmission] ✅ Response Status: 200
[Transmission] Response Body: {"protocolo": "F5ABC71071004801", ...}
```

### Logs de Erro (403)
```
[Transmission] ⚠️ Campo pode ser obrigatório: codigo_ajuste
[Transmission] ⚠️ Campo pode ser obrigatório: retificacao
[Transmission] ✅ Response Status: 403
[Transmission] Response Body: {"timestamp": "...", "status": 403, "error": "Forbidden", "message": "O usuário não possui autorização..."}
```

Se isso ainda acontecer, há dois cenários:

**Cenário A**: Problema genuíno de permissão
- Teste no portal web Audesp diretamente
- Se falhar lá também, é permissão

**Cenário B**: Rejeição do formato
- Já não será 403 (Forbidden)
- Será 400 (Bad Request) com "JSON não validado"
- Isso significa: formato fixado ✅

---

## 💡 Se Ainda Receber Erro

### Se for 403
```
1. Verifique console logs (veja acima)
2. Copie estrutura JSON mostrada
3. Compare com estrutura esperada
4. Contate Audesp com:
   - JSON estrutura
   - Headers enviados
   - CPF usado
```

### Se for 400
```
✅ PROGRESSO! Significaformat está correto agora
Problema: JSON invalida contra schema Audesp

Solução: Checar campos obrigatórios
- descritor está completo?
- codigo_ajuste está preenchido?
- retificacao está definido?
```

### Se for 200 (SUCESSO!)
```
🎉 FUNCIONANDO!
Protocolo recebido: F5XXXXXXXXXXX
Verifique:
- Modal "Transmissão bem-sucedida"
- Protocolo aparecer no histórico
- Documento aparecer no Audesp
```

---

## ✅ Checklist de Verificação

- [ ] Código compila sem erros (✅ já verificado)
- [ ] npm run build completa com sucesso
- [ ] npm start inicia sem erros
- [ ] Console mostra [Transmission] com os 3 novos logs
- [ ] Network mostra headers Origin e Referer
- [ ] Body contém "documentoJSON" como texto (não arquivo)
- [ ] Tenta transmitir

---

## 🔧 Rollback (Se Necessário)

Se as mudanças piorarem:

```bash
# Reverter para versão anterior
git checkout src/services/transmissionService.ts

# Ou verificar diff
git diff src/services/transmissionService.ts
```

---

## 📞 Próximas Ações

1. **Implementar mudanças** ✅ (já feito)
2. **Testar localmente** (seu PC)
3. **Executar testes acima**
4. **Relatar resultado:**
   - Ainda 403? Copie logs completos
   - Mudou para 400? Schema inválido
   - Sucesso (200)? Problema resolvido! 🎉

---

*Guia de teste criado: 2026-01-19 14:15 UTC*
