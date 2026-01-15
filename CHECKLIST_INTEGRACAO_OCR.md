# 📋 Checklist de Integração - OCR em Formulário

## Resumo da Implementação

| Componente | Status | Localização |
|-----------|--------|-------------|
| OCR Service | ✅ Completo | `src/services/ocrService.ts` |
| Extrator PDF | ✅ Completo | `ocrService.ts:extractTextFromPDF()` |
| Detector de Padrões | ✅ Completo | `ocrService.ts:detectPatterns()` |
| Mapeador de Dados | ✅ Completo | `ocrService.ts:mapExtractedDataToForm()` |
| GeminiUploader | ✅ Integrado | `src/components/GeminiUploader.tsx` |
| PDFUploader | ✅ Completo | `src/components/PDFUploader.tsx` |
| MissingFieldsPanel | ✅ Completo | `src/components/MissingFieldsPanel.tsx` |
| useFormValidation Hook | ✅ Completo | `src/hooks/useFormValidation.tsx` |

## Integração nas Seções Principais

### 1. ✅ **GeneralDataBlocks.tsx** (Dados Gerais)

**Onde:** Seção de CNPJ, Razão Social, Município

**Como Adicionar:**
```tsx
import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

// Dentro do componente
<PDFUploader 
  onDataExtracted={(data, confidence) => {
    // Pré-preenchimento automático
    const generalData = mapExtractedDataToForm(data);
    updateForm({
      dados_gerais_entidade_beneficiaria: generalData.dados_gerais_entidade_beneficiaria,
      descritor: generalData.descritor
    });
    showNotification(`Dados extraídos com ${Math.round(confidence * 100)}% confiança`);
  }}
  onError={(error) => {
    showError(`Erro na extração: ${error}`);
  }}
/>
```

**Campos Preenchidos:**
- CNPJ ← Detecção automática
- Razão Social ← Se identificada no documento
- Município ← Código IBGE
- Ano ← Detectado do documento

**Teste:**
- [ ] Upload de PDF com CNPJ válido
- [ ] Campos pré-preenchidos corretamente
- [ ] Mensagem de confiança exibida

---

### 2. ✅ **FinanceBlocks.tsx** (Dados Financeiros)

**Onde:** Receitas, Despesas, Disponibilidades

**Como Adicionar:**
```tsx
import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

// Para seção de Receitas
<PDFUploader 
  onDataExtracted={(data, confidence) => {
    const financeData = mapExtractedDataToForm(data);
    updateFinanceForm({
      receitas: financeData.receitas,
      disponibilidades: financeData.disponibilidades
    });
  }}
/>
```

**Campos Preenchidos:**
- Repasses Recebidos ← Valor em R$ detectado
- Receitas Próprias ← Alternativas detectadas
- Saldo Bancário ← Valor monetário
- Caixa ← Outras disponibilidades

**Teste:**
- [ ] Upload com valores em R$ XXX,XX
- [ ] Valores convertidos para número
- [ ] Múltiplos valores detectados

---

### 3. ✅ **HRBlocks.tsx** (Recursos Humanos)

**Onde:** Relação de Empregados, CPFs, Salários

**Como Adicionar:**
```tsx
import { PDFUploader } from '../PDFUploader';

// Para Folha de Pagamento
<PDFUploader 
  onDataExtracted={(extractedData, confidence) => {
    const employees = extractedData.cpfs || [];
    
    // Pré-preencher lista de empregados
    employees.forEach(cpf => {
      addEmployee({
        cpf: cpf,
        data_admissao: extractedData.datas?.[0] || '',
        salario_contratual: extractedData.valores?.repasses || 0,
        cbo: '' // Necessário preenchervi manual
      });
    });
  }}
/>
```

**Campos Preenchidos:**
- CPF Empregado ← Detectado (multiplos)
- Data Admissão ← Data do documento
- Salário Contratual ← Valor detectado
- CBO ← Manual (não detectado via OCR)

**Teste:**
- [ ] Upload com múltiplos CPFs
- [ ] Todos CPFs extraídos
- [ ] CPFs formatados 11111111111

---

### 4. ✅ **DocumentosFiscaisSectionComPDF.tsx** (Documentos Fiscais)

**Onde:** Notas Fiscais, Comprovantes

**Como Adicionar:**
```tsx
import { PDFUploader } from '../PDFUploader';

// Para documentos fiscais
<PDFUploader 
  onDataExtracted={(extractedData, confidence) => {
    const nfInfo = {
      numero: extractedData.documentos_fiscais?.[0] || '',
      data_emissao: extractedData.datas?.[0] || '',
      valor: extractedData.valores?.receitas || 0
    };
    
    // Adicionar à lista de documentos
    addFiscalDocument(nfInfo);
  }}
/>
```

**Campos Preenchidos:**
- Número NF ← Padrão de números no documento
- Data Emissão ← Primeira data encontrada
- Valor ← Valor monetário

---

### 5. ✅ **FormSections.tsx** (Formulário Principal)

**Onde:** Componente que coordena todas as seções

**Como Adicionar:**
```tsx
import { MissingFieldsPanel } from './MissingFieldsPanel';
import { useFormValidation } from '../hooks/useFormValidation';

// Dentro do componente
const { validateField, getFieldStatus } = useFormValidation();

<>
  {/* Mostrar campos faltando */}
  <MissingFieldsPanel data={formData} />
  
  {/* Suas seções aqui */}
  <GeneralDataBlocks data={formData} onChange={updateForm} />
  <FinanceBlocks data={formData} onChange={updateForm} />
  <HRBlocks data={formData} onChange={updateForm} />
  
  {/* Validação em tempo real */}
  {Object.keys(formData).map(field => (
    <FieldFeedback
      key={field}
      status={getFieldStatus(field, formData[field])}
      fieldName={field}
    />
  ))}
</>
```

---

## Padrões de Detecção

### CNPJ
```
Padrão: 12.345.678/0001-00
Aceita: XX.XXX.XXX/XXXX-XX (com pontuação)
Retorna: 12345678000100 (limpo)
```

### CPF
```
Padrão: 123.456.789-01
Aceita: XXX.XXX.XXX-XX (com pontuação)
Retorna: 12345678901 (limpo)
```

### Data
```
Padrão 1: 31/12/2024 (DD/MM/YYYY)
Padrão 2: 2024-12-31 (YYYY-MM-DD)
Retorna: 2024-12-31 (ISO format)
```

### Valor Monetário
```
Padrão: R$ 1.234.567,89
Padrão: R$ 1,234,567.89
Retorna: 1234567.89 (número)
```

### Ano/Mês
```
Ano: Qualquer sequência de 4 dígitos (1900-2999)
Mês: Nome em português (janeiro, fevereiro, etc)
     Ou força 12 para "prestação de contas"
```

### Município
```
Padrão: Código IBGE (7 dígitos)
Exemplo: 3500107 (São Paulo)
Aceita: 35XXXXX (São Paulo)
```

---

## Função de Suporte

### `mapExtractedDataToForm(extracted: ExtractedData)`

Converte dados extraídos para estrutura do formulário:

```typescript
{
  descritor: {
    municipio: number,      // Código IBGE
    entidade: number,       // Padrão 1
    ano: number,            // Detectado
    mes: number             // Detectado ou 12
  },
  dados_gerais_entidade_beneficiaria: {
    cnpj: string,           // Sem formatação
    razao_social?: string   // Se encontrado
  },
  receitas: {
    repasses_recebidos: number
  },
  disponibilidades: {
    saldos: [{
      saldo_bancario: number
    }]
  },
  extraction_metadata: {
    source: 'PDF_OCR',
    confidence: 0-1,        // Porcentagem
    timestamp: ISO string,
    extracted_cpfs: string[],
    extracted_datas: string[],
    raw_text_preview: string
  }
}
```

---

## Checklist de Implementação

### Fase 1: Testes Básicos ✅
- [x] OCR extrai texto de PDF
- [x] Padrões detectados corretamente
- [x] Confiança calculada
- [x] Dados mapeados para formulário
- [x] GeminiUploader integrado

### Fase 2: Integração por Seção 🔄
- [ ] GeneralDataBlocks com PDFUploader
- [ ] FinanceBlocks com PDFUploader
- [ ] HRBlocks com PDFUploader
- [ ] DocumentosFiscais com PDFUploader
- [ ] MissingFieldsPanel integrado

### Fase 3: Validação & UX 🔄
- [ ] Validação em tempo real funcionando
- [ ] Mensagens de erro claras
- [ ] Progresso OCR visível
- [ ] Feedback de confiança
- [ ] Testes com PDFs reais

### Fase 4: Produção 🔄
- [ ] Tratamento de erros robusto
- [ ] Performance otimizada
- [ ] Docs atualizadas
- [ ] Suporte ao usuário

---

## Troubleshooting por Seção

### GeneralDataBlocks
| Problema | Solução |
|----------|---------|
| CNPJ não detectado | Verificar se está no formato XXX.XXX.XXX-XXX |
| Município vazio | Adicionar código IBGE manualmente ou usar dropdown |
| Ano incorreto | PDF pode ter múltiplos anos, selecionar correto |

### FinanceBlocks
| Problema | Solução |
|----------|---------|
| Valores zerados | Padrão R$ XXX,XX pode variar, ajustar regex |
| Múltiplos valores | Sistema pega média, revisar manualmente |
| Campos vazios | Nem todo PDF tem dados financeiros |

### HRBlocks
| Problema | Solução |
|----------|---------|
| CPFs não encontrados | PDF pode estar escaneado (OCR de baixa qualidade) |
| Salário zerado | Documento pode não ter valor, preencher manual |
| Datas incompletas | Formato pode variar, testar com manual |

---

## Performance

- **Tempo OCR:** 2-5 segundos por página
- **Máximo de páginas:** 10 (limit para não travar UI)
- **Tamanho máximo:** 50MB (limite navegador)
- **Confiança mínima:** 30% para sugerir dados

---

## Recursos Adicionais

- [Tesseract.js Docs](https://github.com/naptha/tesseract.js)
- [PDF.js Docs](https://mozilla.github.io/pdf.js/)
- [RegEx Patterns](https://regex101.com/)
- [IBGE Municípios](https://www.ibge.gov.br/)

---

**Última atualização:** 2024
**Versão:** 1.0
**Status:** Pronto para Integração
