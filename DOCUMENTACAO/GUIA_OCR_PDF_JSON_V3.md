# Guia Completo: Sistema OCR + PDF + JSON v3.0

## Visão Geral

O novo sistema integrado combina:

1. **PDF Viewer** - Visualizador moderno com zoom e seleção de texto
2. **OCR Service** - Extração inteligente de campos com detecção automática
3. **JSON Validator** - Validação em tempo real com sugestões
4. **Form Component** - Formulário dinâmico e responsivo
5. **JSON Preview** - Visualização e edição do JSON em tempo real

## Como Funciona

```
PDF Upload → OCR Processing → Auto-Detection → Form Filling
    ↓            ↓                 ↓              ↓
Viewer    Progress Bar      Field Mapping    Live Preview
                                              ↓
                                         JSON Validation
                                              ↓
                                         Suggestions
```

## Componentes

### 1. FormWithOCR Component

Componente principal que integra tudo.

**Localização:** `components/FormWithOCR.tsx`

**Props:**
```typescript
interface FormSchemaProps {
  fields: FormField[];           // Campos do formulário
  schema: Record<string, any>;   // Schema de validação
  title?: string;                // Título do formulário
  onSubmit?: (data) => void;    // Callback ao enviar
  onCancel?: () => void;        // Callback ao cancelar
}
```

**Exemplo básico:**
```tsx
import FormWithOCR from '@/components/FormWithOCR';

<FormWithOCR
  fields={formFields}
  schema={formSchema}
  title="Prestação de Contas"
  onSubmit={(data) => console.log(data)}
  onCancel={() => history.back()}
/>
```

### 2. PDFViewer Component

Visualizador de PDF com zoom, paginação e seleção de texto.

**Localização:** `components/PDFViewer.tsx`

**Features:**
- Zoom de 50% a 300%
- Navegação página a página
- Seleção de texto
- Renderização responsiva
- Indicador de progresso

**Props:**
```typescript
interface PDFViewerProps {
  file: File;
  onTextSelected?: (text: string) => void;
}
```

### 3. JSONPreview Component

Visualização em tempo real do JSON sendo preenchido.

**Localização:** `components/JSONPreview.tsx`

**Features:**
- Edição inline de campos
- Validação com status visual
- Sugestões automáticas
- Busca por campo
- Progresso de preenchimento
- Raw JSON export

**Props:**
```typescript
interface JSONPreviewProps {
  data: Record<string, any>;
  schema?: Record<string, any>;
  onChange?: (updatedData) => void;
  showValidation?: boolean;
  showSuggestions?: boolean;
}
```

### 4. OCR Service

Serviço de reconhecimento óptico de caracteres.

**Localização:** `src/services/advancedOCRService.ts`

**Métodos principais:**
```typescript
// Inicializar OCR
await OCRService.initialize();

// Processar uma imagem
const result = await OCRService.processImage(imageFile);

// Processar PDF página por página
const extracted = await OCRService.processPDF(pdfFile, {
  onProgress: (page, total) => console.log(`${page}/${total}`)
});

// Detectar campos automaticamente
const detected = OCRService.suggestMapping(extracted, schema);
```

### 5. JSON Validation Service

Validação com sugestões inteligentes.

**Localização:** `src/services/jsonValidationService.ts`

**Métodos:**
```typescript
// Validar dados contra schema
const result = JSONValidator.validate(data, schema);

// Obter sugestões
const suggestions = JSONValidator.generateSuggestions(errors, data);

// Verificar consistências (ex: datas)
const issues = JSONValidator.findInconsistencies(data);

// Calcular progresso
const percentage = JSONValidator.calculateCompletion(data, schema);
```

## Exemplo de Uso Completo

```tsx
import React from 'react';
import FormWithOCR from '@/components/FormWithOCR';

const MyComponent = () => {
  const formFields = [
    {
      name: 'cpf',
      label: 'CPF',
      type: 'text',
      required: true,
      format: 'cpf'
    },
    {
      name: 'nomeCompleto',
      label: 'Nome',
      type: 'text',
      required: true
    },
    {
      name: 'dataAtendimento',
      label: 'Data',
      type: 'date',
      required: true
    },
    {
      name: 'valor',
      label: 'Valor',
      type: 'currency',
      required: false
    }
  ];

  const formSchema = {
    cpf: { type: 'string', required: true, format: 'cpf' },
    nomeCompleto: { type: 'string', required: true, minLength: 5 },
    dataAtendimento: { type: 'date', required: true },
    valor: { type: 'number', required: false, min: 0 }
  };

  const handleSubmit = async (data) => {
    console.log('Enviando:', data);
    
    // Enviar para backend
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Enviado com sucesso!');
    }
  };

  return (
    <FormWithOCR
      fields={formFields}
      schema={formSchema}
      title="Meu Formulário"
      onSubmit={handleSubmit}
      onCancel={() => window.history.back()}
    />
  );
};

export default MyComponent;
```

## Fluxo de Uso Típico

### Passo 1: Carregar PDF
Clique em "Carregar PDF" e selecione um arquivo PDF.

### Passo 2: Processar OCR
Clique em "Processar OCR" para extrair texto do PDF.
A barra de progresso mostra o progresso.

### Passo 3: Visualizar Sugestões
Os campos detectados aparecem como sugestões em amarelo.
Clique "Aplicar" para usar a sugestão.

### Passo 4: Preencher Manualmente
Para campos não detectados ou com valores incorretos,
preencha manualmente no formulário.

### Passo 5: Revisar JSON
No painel JSON Preview veja os dados em tempo real.
Erros aparecem em vermelho, avisos em amarelo.

### Passo 6: Enviar
Clique "Enviar" para submeter os dados validados.

## Tipos de Validação Suportados

### Formatos Específicos
- **CPF:** 11 dígitos, validação de checksum
- **CNPJ:** 14 dígitos, validação de checksum
- **Email:** Validação regex standard
- **Data:** DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
- **Moeda:** R$, €, $ com decimais

### Tipos de Dados
- **string:** com minLength/maxLength
- **number:** com min/max
- **date:** com range
- **boolean:** true/false
- **array:** com items
- **object:** com propriedades aninhadas

### Validações Personalizadas
```typescript
const schema = {
  meuCampo: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 100,
    custom: (value) => {
      // Validação customizada
      return value.includes('obrigatorio');
    }
  }
};
```

## Tratamento de Erros

### Erros Comuns

**CPF Inválido**
```
Erro: CPF deve ter 11 dígitos
Sugestão: Verifique se digitou corretamente
```

**Data Invertida**
```
Aviso: Data futura detectada
Sugestão: Você quis dizer 01/01/2024?
```

**Valor Negativo**
```
Erro: Valor não pode ser negativo
Sugestão: Confira o sinal do número
```

## Responsividade

### Desktop (1024px+)
Layout em 3 colunas: PDF | Form | JSON Preview

### Mobile (<1024px)
Layout em abas: Form ↔ Preview

A interface se adapta automaticamente.

## Performance

- OCR processa até 50 páginas por minuto
- Validação é feita em tempo real (< 100ms)
- Sugestões são cacheadas por padrão
- Zoom é suavizado com transições

## Personalização

### Customizar Cores
```tsx
// Editar em components/JSONPreview.tsx
const statusColor = {
  error: 'border-red-300 bg-red-50',    // Customize aqui
  warning: 'border-yellow-300 bg-yellow-50',
  success: 'border-green-300 bg-green-50',
  empty: 'border-slate-200 bg-slate-50'
};
```

### Customizar Campos
```tsx
const fields = [
  {
    name: 'meuCampo',
    label: 'Meu Campo',
    type: 'text',
    required: true,
    placeholder: 'Digite aqui...',
    options: [/* para select */]
  }
];
```

### Customizar Validação
```tsx
const schema = {
  meuCampo: {
    type: 'string',
    required: true,
    minLength: 5,
    pattern: /^[A-Z]/,  // Começa com maiúscula
    custom: (value) => value.length % 2 === 0  // Comprimento par
  }
};
```

## Integração com Backend

### Enviar Dados
```tsx
const handleSubmit = async (data) => {
  // Dados já validados pelo JSONValidator
  
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log('Resposta:', result);
};
```

### Retornar Erros
```python
# Backend pode retornar erros específicos
{
  "success": false,
  "errors": [
    {
      "field": "cpf",
      "message": "CPF já registrado no sistema"
    }
  ]
}
```

## Troubleshooting

### OCR não funciona
- Verifique se o PDF não é uma imagem escaneada
- Tente usar um PDF de texto (não protegido)
- Confira a qualidade da imagem

### Validação muito rigorosa
- Ajuste o schema removendo `required: true`
- Aumente `minLength`/`maxLength`
- Use `custom` para lógica complexa

### PDF não aparece
- Confirme o arquivo é PDF válido
- Tente com outro PDF
- Verifique tamanho do arquivo

## Próximas Melhorias

- Suporte a assinatura digital
- Integração com câmera para captura
- Processamento em batch
- Cache de extração
- Multi-idioma
- Histórico de envios

## Documentação Relacionada

- [advancedOCRService.ts](../src/services/advancedOCRService.ts)
- [jsonValidationService.ts](../src/services/jsonValidationService.ts)
- [FormWithOCR.examples.tsx](./FormWithOCR.examples.tsx)
- [AUDESP_V3_0_MELHORIAS.md](./AUDESP_V3_0_MELHORIAS.md)

## Suporte

Para problemas ou dúvidas:
1. Verifique o console (F12) para erros
2. Consulte os exemplos em FormWithOCR.examples.tsx
3. Revisite esta documentação
4. Crie uma issue no repositório

---

**Versão:** 3.0 OCR Integration
**Última atualização:** 2024
**Status:** Produção
