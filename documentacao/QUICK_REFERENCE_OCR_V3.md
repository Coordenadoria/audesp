# Quick Reference - FormWithOCR v3.0

## 30 Segundos para Começar

```tsx
import FormWithOCR from '@/components/FormWithOCR';

<FormWithOCR
  fields={[
    { name: 'cpf', label: 'CPF', type: 'text', required: true, format: 'cpf' },
    { name: 'nome', label: 'Nome', type: 'text', required: true }
  ]}
  schema={{
    cpf: { type: 'string', required: true, format: 'cpf' },
    nome: { type: 'string', required: true, minLength: 5 }
  }}
  onSubmit={(data) => console.log(data)}
/>
```

## Tipos de Campo

```typescript
type: 'text'           // Input text simples
type: 'number'         // Input numérico
type: 'email'          // Input email
type: 'date'           // Input date (YYYY-MM-DD)
type: 'currency'       // Input moeda (R$)
type: 'select'         // Dropdown
type: 'textarea'       // Área de texto
```

## Propriedades de Campo

```typescript
{
  name: 'campo',              // ID único do campo
  label: 'Rótulo',            // Texto exibido
  type: 'text' | 'email' | ..., // Tipo de input
  required: true,             // Obrigatório?
  format: 'cpf',              // Validação customizada
  placeholder: 'Digite...',   // Texto de dica
  options: [                  // Para select
    { value: 'v1', label: 'Opção 1' }
  ]
}
```

## Formatos Suportados

```typescript
format: 'cpf'      // 000.000.000-00
format: 'cnpj'     // 00.000.000/0000-00
format: 'email'    // user@example.com
format: 'date'     // DD/MM/YYYY
format: 'currency' // R$ 1.000,00
```

## Schema de Validação

```typescript
{
  campo1: {
    type: 'string' | 'number' | 'date' | 'boolean',
    required: true,
    minLength: 5,
    maxLength: 100,
    min: 0,
    max: 1000,
    pattern: /^[A-Z]/,
    enum: ['valor1', 'valor2'],
    format: 'cpf' | 'cnpj' | 'email' | 'date' | 'currency'
  }
}
```

## Usar JSONValidator Isolado

```typescript
import { JSONValidator } from '@/services/jsonValidationService';

const result = JSONValidator.validate(
  { cpf: '123.456.789-00', nome: 'João Silva' },
  {
    cpf: { type: 'string', required: true, format: 'cpf' },
    nome: { type: 'string', required: true }
  }
);

// result = {
//   isValid: true,
//   errors: [],
//   warnings: [],
//   suggestions: [],
//   completionPercentage: 100
// }
```

## Usar OCRService Isolado

```typescript
import { OCRService } from '@/services/advancedOCRService';

// Inicializar
await OCRService.initialize();

// Processar PDF
const extracted = await OCRService.processPDF(pdfFile, {
  onProgress: (page, total) => {
    console.log(`${page}/${total}`);
  }
});

// Sugerir mapeamento
const detected = OCRService.suggestMapping(extracted, schema);
```

## Usar JSONPreview Isolado

```typescript
import JSONPreview from '@/components/JSONPreview';

<JSONPreview
  data={formData}
  schema={formSchema}
  onChange={(updated) => setFormData(updated)}
  showValidation={true}
  showSuggestions={true}
/>
```

## Usar PDFViewer Isolado

```typescript
import PDFViewer from '@/components/PDFViewer';

<PDFViewer
  file={pdfFile}
  onTextSelected={(text) => {
    console.log('Texto selecionado:', text);
  }}
/>
```

## Eventos e Callbacks

```typescript
<FormWithOCR
  // Quando usuário envia
  onSubmit={(data: Record<string, any>) => {
    // Dados já validados
    console.log(data);
  }}
  
  // Quando usuário cancela
  onCancel={() => {
    window.history.back();
  }}
/>
```

## Validação Customizada

```typescript
const schema = {
  meuCampo: {
    type: 'string',
    required: true,
    custom: (value: any) => {
      // Retornar true se válido
      return value.includes('obrigatorio');
    }
  }
};
```

## CPF/CNPJ

```typescript
// Validar CPF
JSONValidator.validateCPF('123.456.789-00')  // true/false

// Validar CNPJ
JSONValidator.validateCNPJ('00.000.000/0000-00')  // true/false
```

## Auto-Sugestões

```typescript
import { AutoSuggestEngine } from '@/services/jsonValidationService';

// Registrar valor para aprendizado
AutoSuggestEngine.learnValue('cpf', '123.456.789-00');

// Obter sugestões
const suggestions = AutoSuggestEngine.suggestValue('cpf', '123');
// ['123.456.789-00']

// Exportar histórico
const json = AutoSuggestEngine.exportSuggestions();

// Importar histórico
AutoSuggestEngine.importSuggestions(json);
```

## Erros Comuns

| Erro | Solução |
|------|---------|
| "PDF não aparece" | Confirme arquivo é PDF válido |
| "OCR muito lento" | Reduza tamanho do PDF |
| "Validação não funciona" | Confira schema tem `type` e `format` |
| "Sugestão não aparece" | Confira confiança OCR > 0.6 |

## Layout Responsivo

```typescript
// Desktop (1024px+)
// 3 colunas: PDF | Form | JSON

// Mobile (<1024px)
// 2 abas: Form ↔ Preview
```

## Debugging

```typescript
// Habilitar logs
localStorage.setItem('DEBUG_OCR', 'true');
localStorage.setItem('DEBUG_VALIDATION', 'true');

// Abrir console (F12)
// Verificar Network tab para requisições
```

## Enviar para Backend

```typescript
const handleSubmit = async (data) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  
  if (!response.ok) {
    // Mostrar erros do backend
    alert(result.message);
  }
};
```

## Configurações de Performance

```typescript
// OCR settings
const ocrOptions = {
  // Cada página processada
  onProgress: (page, total) => {}
};

// Validation settings
const validationOptions = {
  // Cache de sugestões
  cacheResults: true,
  // Timeout para validação customizada
  customValidationTimeout: 5000
};
```

## Estilo Customizado

```tsx
// Editar tailwind.config.js para cores
{
  colors: {
    primary: '#0066CC',
    success: '#00AA00',
    error: '#CC0000',
    warning: '#FFAA00'
  }
}

// Editar components/ para CSS customizado
```

## Integração com Redux (se usar)

```typescript
// Ação para salvar dados
dispatch(setFormData(data));

// Seletor para pegar dados
const data = useSelector(state => state.form.data);

// Usar com FormWithOCR
<FormWithOCR
  onSubmit={(data) => {
    dispatch(submitForm(data));
  }}
/>
```

## Integração com React Query (se usar)

```typescript
const mutation = useMutation(
  (data) => fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  })
);

<FormWithOCR
  onSubmit={(data) => mutation.mutate(data)}
/>
```

## Testes

```typescript
// Teste unitário do componente
test('FormWithOCR renderiza', () => {
  const { getByText } = render(
    <FormWithOCR
      fields={[]}
      schema={{}}
      onSubmit={() => {}}
    />
  );
  expect(getByText('Preenchimento com OCR')).toBeInTheDocument();
});

// Teste de validação
test('JSONValidator valida CPF', () => {
  const result = JSONValidator.validate(
    { cpf: '123.456.789-00' },
    { cpf: { type: 'string', format: 'cpf' } }
  );
  expect(result.isValid).toBe(false); // CPF inválido
});
```

## Componentes Relacionados

- [FormWithOCR.tsx](../components/FormWithOCR.tsx) - Principal
- [JSONPreview.tsx](../components/JSONPreview.tsx) - Preview
- [PDFViewer.tsx](../components/PDFViewer.tsx) - Viewer
- [advancedOCRService.ts](../src/services/advancedOCRService.ts) - OCR
- [jsonValidationService.ts](../src/services/jsonValidationService.ts) - Validação

## Documentação Completa

Ver [GUIA_OCR_PDF_JSON_V3.md](./DOCUMENTACAO/GUIA_OCR_PDF_JSON_V3.md)

## Exemplos

Ver [FormWithOCR.examples.tsx](../components/FormWithOCR.examples.tsx)

## Teste Automatizado

```bash
bash test-ocr-integration.sh
```

## Próximas Versões

- v3.1: Assinatura digital
- v3.2: Captura de câmera
- v3.3: Processamento batch
- v3.4: Multi-idioma

---

**Última atualização:** 2024
**Versão:** 3.0
**Status:** Produção
