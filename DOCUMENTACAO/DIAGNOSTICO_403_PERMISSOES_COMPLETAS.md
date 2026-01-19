# 🔍 DIAGNÓSTICO: Erro 403 Com Todas Permissões

**Data**: 2026-01-19 14:15 UTC  
**Erro**: HTTP 403 Forbidden - "O usuário não possui autorização para realizar esta operação"  
**Status do Usuário**: Tem todas permissões solicitadas

---

## 🎯 Análise Profunda

### ❌ O Que NÃO É o Problema
```
✓ Autenticação: Token JWT é válido
✓ Permissões: Usuário tem todas as permissões necessárias
✓ Endpoint: URL está correta (/f5/enviar-prestacao-contas-convenio)
✓ Método: POST está correto
✓ Headers: Authorization com Bearer token está presente
```

### ⚠️ O Que PODE Ser o Problema

Investigação shows a requisição pode estar incorreta em 3 áreas:

---

## 🔎 Investigação 1: Formato do JSON

### Especificação Audesp
```
Tipo de Envio: multipart/form-data
Campo: documentoJSON
Conteúdo: String JSON (não é arquivo)
```

### Código Atual (transmissionService.ts linha 93-96)
```typescript
const formData = new FormData();
const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
formData.append('documentoJSON', jsonBlob, `prestacao_${data.descritor.entidade}_...`);
```

### ⚠️ POSSÍVEL PROBLEMA #1
```
Você está criando um Blob com nome de arquivo:
formData.append('documentoJSON', jsonBlob, 'prestacao_...')
                                           ↑
                                   Isso torna um arquivo!

Audesp pode estar rejeitando porque espera um campo de texto, não um arquivo.
```

### ✅ SOLUÇÃO #1
```typescript
const formData = new FormData();
const jsonString = JSON.stringify(payload);

// Enviar como texto simples, não como arquivo
formData.append('documentoJSON', jsonString);
```

---

## 🔎 Investigação 2: Estrutura do JSON

### Possível Problema #2
```
O JSON pode estar com campos faltantes ou inválidos que Audesp rejeita.
Erro 403 ao invés de 400 pode indicar que:
1. Falta campo obrigatório específico
2. Campo tem tipo de dados errado
3. Campo tem valor que viola permissões do usuário
```

### Verificação Necessária
```typescript
// Adicione este log ANTES de enviar em transmissionService.ts:

console.log('[Transmission] Estrutura JSON enviado:');
console.log('[Transmission] Descritor:', payload.descritor);
console.log('[Transmission] Campos presentes:', Object.keys(payload));
console.log('[Transmission] JSON size:', JSON.stringify(payload).length);

// Valide estrutura mínima obrigatória
const requiredFields = [
  'descritor',           // Campo obrigatório
  'codigo_ajuste',       // Pode ser obrigatório
  'retificacao'          // Pode ser obrigatório
];

const missingFields = requiredFields.filter(field => !(field in payload));
if (missingFields.length > 0) {
  console.warn('[Transmission] ⚠️ Campos faltando:', missingFields);
}
```

---

## 🔎 Investigação 3: Headers Faltando

### Especificação vs Implementação

| Header | Especificação | Implementação | Status |
|--------|---------------|----|--------|
| `Authorization` | ✅ Obrigatório | ✅ Bearer {token} | ✅ OK |
| `Accept` | ✅ application/json | ✅ Presente | ✅ OK |
| `Content-Type` | Auto (multipart/form-data) | ✅ Auto | ✅ OK |
| `X-User-CPF` | ❓ Não documentado | ✅ Presente se fornecido | ✅ OK |
| `Origin` | ❓ Pode ser necessário | ❌ NÃO está sendo enviado | ⚠️ PROBLEMA? |

### ⚠️ POSSÍVEL PROBLEMA #3
```
Pode estar faltando header de ORIGIN ou REFERER
Alguns servidores governamentais requerem:
- Origin: https://audesp-piloto.tce.sp.gov.br
- Referer: https://audesp-piloto.tce.sp.gov.br/
```

### ✅ SOLUÇÃO #3
```typescript
// Adicionar após linha 77 em transmissionService.ts
const requestConfig: RequestInit = {
  method: 'POST',
  headers: {
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    'Accept': 'application/json',
    'Origin': 'https://audesp-piloto.tce.sp.gov.br',
    'Referer': 'https://audesp-piloto.tce.sp.gov.br/',
    ...(cpf && { 'X-User-CPF': cpf })
  },
  body: formData,
  signal: controller.signal
};
```

---

## 🚀 Soluções Recomendadas

### PASSO 1: Corrigir Formato do Campo
Linha 93-96 de `transmissionService.ts`:

**DE:**
```typescript
const formData = new FormData();
const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
formData.append('documentoJSON', jsonBlob, `prestacao_${data.descritor.entidade}_${data.descritor.mes}_${data.descritor.ano}.json`);
```

**PARA:**
```typescript
const formData = new FormData();
const jsonString = JSON.stringify(payload);
formData.append('documentoJSON', jsonString);
```

### PASSO 2: Adicionar Headers de Validação
Linha 77-82 de `transmissionService.ts`:

**DE:**
```typescript
const requestConfig: RequestInit = {
  method: 'POST',
  headers: {
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    'Accept': 'application/json',
    ...(cpf && { 'X-User-CPF': cpf })
  },
```

**PARA:**
```typescript
const requestConfig: RequestInit = {
  method: 'POST',
  headers: {
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    'Accept': 'application/json',
    'Origin': 'https://audesp-piloto.tce.sp.gov.br',
    'Referer': 'https://audesp-piloto.tce.sp.gov.br/',
    ...(cpf && { 'X-User-CPF': cpf })
  },
```

### PASSO 3: Adicionar Logs de Debug
Adicionar após linha 94 em `transmissionService.ts`:

```typescript
// Debug: Log estrutura do JSON
console.log('[Transmission] JSON Payload:', {
  descritor: payload.descritor,
  hasCodigo: !!payload.codigo_ajuste,
  hasRetificacao: 'retificacao' in payload,
  totalFields: Object.keys(payload).length,
  jsonSize: JSON.stringify(payload).length + ' bytes'
});

// Validar campos obrigatórios
if (!payload.descritor) {
  throw new Error('❌ Campo obrigatório faltando: descritor');
}
if (!('codigo_ajuste' in payload)) {
  console.warn('⚠️ Campo pode ser obrigatório: codigo_ajuste');
}
if (!('retificacao' in payload)) {
  console.warn('⚠️ Campo pode ser obrigatório: retificacao');
}
```

---

## 📊 Checklist de Verificação

Após implementar as soluções, verificar:

- [ ] JSON enviado como campo texto simples (não arquivo)
- [ ] Headers Origin e Referer adicionados
- [ ] Descritor está presente no JSON
- [ ] codigo_ajuste está preenchido
- [ ] retificacao está definido (true/false)
- [ ] Token começa com "Bearer "
- [ ] Console mostra estrutura correta do JSON

---

## 🧪 Teste Rápido via cURL

```bash
# Salvar JSON em arquivo temporário
cat > /tmp/test.json << 'EOF'
{
  "descritor": {
    "tipo_documento": "Prestação de Contas de Convênio",
    "municipio": 0,
    "entidade": 0,
    "ano": 2025,
    "mes": 1
  },
  "codigo_ajuste": "",
  "retificacao": false
}
EOF

# Testar envio
curl -X POST \
  "https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json" \
  -H "Origin: https://audesp-piloto.tce.sp.gov.br" \
  -H "Referer: https://audesp-piloto.tce.sp.gov.br/" \
  -F "documentoJSON=$(cat /tmp/test.json)" \
  -v
```

---

## 📞 Se Ainda Não Funcionar

1. **Verifique se pode transmitir via portal web Audesp**
   - Acesse: https://audesp-piloto.tce.sp.gov.br
   - Tente transmitir um documento manualmente
   - Se falhar lá também = é problema de permissão genuína

2. **Contate suporte Audesp com informações:**
   ```
   - CPF: seu_cpf
   - Tipo de documento: Prestação de Contas de Convênio
   - Erro: 403 Forbidden
   - Mensagem: "O usuário não possui autorização para realizar esta operação."
   - Você consegue transmitir pelo portal web? SIM/NÃO
   ```

3. **Se funciona no portal mas não na app:**
   - Pode ser validação específica de User-Agent
   - Adicione User-Agent header:
   ```typescript
   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
   ```

---

## ✅ Próximos Passos

1. **Aplicar Solução #1**: Mudar formato do campo JSON
2. **Aplicar Solução #2**: Adicionar headers Origin/Referer
3. **Aplicar Solução #3**: Adicionar logs de debug
4. **Testar novamente**
5. **Relatar resultado**

---

*Diagnóstico criado: 2026-01-19 14:15 UTC*
