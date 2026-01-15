# 🚀 Quick Start - OCR e PDF Upload

## ⚡ Em 5 Minutos

### 1. **Qual é meu primeiro passo?**

Você tem um componente de formulário? Adicione OCR assim:

```tsx
import { PDFUploader } from './components/PDFUploader';
import { mapExtractedDataToForm } from './services/ocrService';

// Em seu formulário
<PDFUploader 
  onDataExtracted={(data, confidence) => {
    // Seus dados foram extraídos!
    console.log(`Confiança: ${Math.round(confidence * 100)}%`);
    
    // Mapear para sua estrutura de formulário
    const formData = mapExtractedDataToForm(data);
    
    // Atualizar estado
    setFormValues(prev => ({
      ...prev,
      ...formData
    }));
  }}
  onError={(error) => {
    console.error('Erro:', error);
  }}
/>
```

### 2. **O que é detectado automaticamente?**

| Campo | Exemplo | Status |
|-------|---------|--------|
| CNPJ | 12.345.678/0001-00 | ✅ Automático |
| CPF | 123.456.789-01 | ✅ Automático (multiplos) |
| Data | 31/12/2024 | ✅ Automático |
| Valor | R$ 1.234.567,89 | ✅ Automático |
| Ano | 2024 | ✅ Automático |
| Mês | Dezembro | ✅ Automático |
| Cidade | 3500107 | ✅ São Paulo |
| CPF Responsável | XXX.XXX.XXX-XX | ✅ Automático |

### 3. **Como funciona?**

1. **Você clica em upload** → Seleciona PDF
2. **Sistema renderiza PDF** → Usa Tesseract OCR
3. **Extrai texto** → 2-5 segundos por página
4. **Detecta padrões** → CNPJ, CPF, datas, valores
5. **Calcula confiança** → 0-100%
6. **Mapeia dados** → Formata para seu formulário
7. **Callback executado** → Você atualiza estado
8. **Campos preenchidos** → Automático!

### 4. **Exemplo Real - Seção de Dados Gerais**

```tsx
// Arquivo: src/components/blocks/GeneralDataBlocks.tsx

import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

export function GeneralDataBlocks({ data, onDataChange }) {
  return (
    <div className="space-y-4">
      <h2>Dados Gerais da Entidade</h2>
      
      {/* Novo: Upload com OCR */}
      <div className="border-2 border-dashed border-blue-300 p-4 rounded">
        <p className="mb-2 text-sm text-gray-600">
          📄 Ou carregue um PDF para pré-preenchimento automático:
        </p>
        <PDFUploader 
          onDataExtracted={(extracted, confidence) => {
            const mapped = mapExtractedDataToForm(extracted);
            onDataChange({
              ...data,
              dados_gerais_entidade_beneficiaria: {
                ...data.dados_gerais_entidade_beneficiaria,
                ...mapped.dados_gerais_entidade_beneficiaria
              },
              descritor: {
                ...data.descritor,
                ...mapped.descritor
              }
            });
            
            // Mostrar feedback
            alert(
              `✓ Dados extraídos com ${Math.round(confidence * 100)}% confiança!\n` +
              `CNPJ: ${mapped.dados_gerais_entidade_beneficiaria?.cnpj}\n` +
              `Ano: ${mapped.descritor?.ano}\n` +
              `Mês: ${mapped.descritor?.mes}`
            );
          }}
          onError={(error) => {
            alert(`❌ Erro: ${error}`);
          }}
        />
      </div>
      
      {/* Campos normais (já pré-preenchidos se OCR funcionou) */}
      <input 
        type="text"
        placeholder="CNPJ"
        value={data.dados_gerais_entidade_beneficiaria?.cnpj || ''}
        onChange={(e) => onDataChange({
          ...data,
          dados_gerais_entidade_beneficiaria: {
            ...data.dados_gerais_entidade_beneficiaria,
            cnpj: e.target.value
          }
        })}
      />
      
      <input 
        type="text"
        placeholder="Razão Social"
        value={data.dados_gerais_entidade_beneficiaria?.razao_social || ''}
        onChange={(e) => onDataChange({
          ...data,
          dados_gerais_entidade_beneficiaria: {
            ...data.dados_gerais_entidade_beneficiaria,
            razao_social: e.target.value
          }
        })}
      />
    </div>
  );
}
```

### 5. **Exemplo para Dados Financeiros**

```tsx
// Arquivo: src/components/blocks/FinanceBlocks.tsx

import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

export function FinanceBlocks({ data, onDataChange }) {
  return (
    <div>
      <h2>Dados Financeiros</h2>
      
      {/* Upload com OCR para valores financeiros */}
      <PDFUploader 
        onDataExtracted={(extracted, confidence) => {
          const mapped = mapExtractedDataToForm(extracted);
          
          // Pré-preencher valores extraídos
          onDataChange({
            ...data,
            receitas: mapped.receitas,
            disponibilidades: mapped.disponibilidades
          });
          
          alert(
            `✓ Valores detectados:\n` +
            `Repasses: R$ ${mapped.receitas?.repasses_recebidos}\n` +
            `Saldo: R$ ${mapped.disponibilidades?.saldos?.[0]?.saldo_bancario}\n` +
            `Confiança: ${Math.round(confidence * 100)}%`
          );
        }}
      />
      
      {/* Campos para edição */}
      <input 
        type="number"
        placeholder="Repasses Recebidos"
        value={data.receitas?.repasses_recebidos || ''}
        onChange={(e) => onDataChange({
          ...data,
          receitas: {
            ...data.receitas,
            repasses_recebidos: parseFloat(e.target.value)
          }
        })}
      />
      
      <input 
        type="number"
        placeholder="Saldo Bancário"
        value={data.disponibilidades?.saldos?.[0]?.saldo_bancario || ''}
        onChange={(e) => onDataChange({
          ...data,
          disponibilidades: {
            ...data.disponibilidades,
            saldos: [{
              ...data.disponibilidades?.saldos?.[0],
              saldo_bancario: parseFloat(e.target.value)
            }]
          }
        })}
      />
    </div>
  );
}
```

### 6. **Exemplo para Recursos Humanos**

```tsx
// Arquivo: src/components/blocks/HRBlocks.tsx

import { PDFUploader } from '../PDFUploader';

export function HRBlocks({ data, onDataChange }) {
  return (
    <div>
      <h2>Recursos Humanos</h2>
      
      {/* Upload com OCR para extrair CPFs */}
      <PDFUploader 
        onDataExtracted={(extracted) => {
          // Cada CPF extraído vira um empregado
          const employees = extracted.cpfs?.map(cpf => ({
            cpf: cpf,
            data_admissao: extracted.datas?.[0] || '',
            salario_contratual: extracted.valores?.repasses || 0,
            cbo: '' // Manual
          })) || [];
          
          onDataChange({
            ...data,
            relacao_empregados: employees
          });
          
          alert(`✓ ${employees.length} empregados extraídos!`);
        }}
      />
      
      {/* Lista de empregados */}
      {data.relacao_empregados?.map((emp, idx) => (
        <div key={idx} className="border p-2 mb-2">
          <input 
            value={emp.cpf}
            placeholder="CPF"
            onChange={(e) => {
              const updated = [...data.relacao_empregados];
              updated[idx].cpf = e.target.value;
              onDataChange({ ...data, relacao_empregados: updated });
            }}
          />
          <input 
            value={emp.salario_contratual}
            placeholder="Salário"
            type="number"
            onChange={(e) => {
              const updated = [...data.relacao_empregados];
              updated[idx].salario_contratual = parseFloat(e.target.value);
              onDataChange({ ...data, relacao_empregados: updated });
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

### 7. **Checklist de Integração**

Copie para cada seção que quiser OCR:

```tsx
// 1. Import
import { PDFUploader } from '../PDFUploader';
import { mapExtractedDataToForm } from '../../services/ocrService';

// 2. Adicionar componente
<PDFUploader 
  onDataExtracted={(extracted, confidence) => {
    const mapped = mapExtractedDataToForm(extracted);
    // Aqui você atualiza seus dados
    onDataChange(merged);
  }}
  onError={(err) => alert(`Erro: ${err}`)}
/>

// 3. Testar
- [ ] Upload PDF com dados
- [ ] Progresso aparecer
- [ ] Confiança mostrada
- [ ] Campos pré-preenchidos
- [ ] Sem erros no console
```

### 8. **Debug - Vendo os Logs**

Abra DevTools (F12) → Console e procure por:

```
[OCR] Iniciando extração de PDF: seu-arquivo.pdf
[OCR] Processando página 1/5...
[OCR] Página 1: 50%
[OCR] CNPJ detectado: 12345678000100
[OCR] CPFs detectados: (2) ['12345678901', '98765432109']
[OCR] Datas detectadas: (1) ['2024-12-31']
[OCR] Confiança da extração: 83%
```

Se não ver nada, seu PDF não tem dados desses tipos.

### 9. **Problemas Comuns**

| Problema | Solução |
|----------|---------|
| Arquivo muito grande | Reduzir resolução ou split em múltiplos arquivos |
| Texto não reconhecido | PDF pode estar escaneado mal, tente melhor qualidade |
| Nenhum campo detectado | PDF pode estar vazio ou em outro idioma |
| Dados incorretos | Revisar regex patterns em `detectPatterns()` |

### 10. **Estrutura de Dados Retornada**

Quando `onDataExtracted` é chamado, você recebe:

```javascript
{
  // Dados brutos extraídos
  cnpj: "12345678000100",
  cpfs: ["12345678901", "98765432109"],
  datas: ["2024-12-31"],
  
  // Valores detectados
  valores: {
    repasses: 1000000,
    receitas: 500000,
    despesas: 1500000,
    disponibilidades: 250000
  },
  
  // Metadados
  confidence: 0.83,  // 83%
  rawText: "...",    // Texto completo do PDF
  timestamp: "2024-01-15T10:30:00Z",
  
  // Mapeado para formulário
  descritor: { municipio, entidade, ano, mes },
  dados_gerais_entidade_beneficiaria: { cnpj, razao_social },
  receitas: { repasses_recebidos },
  disponibilidades: { saldos: [{ saldo_bancario }] }
}
```

---

## 🎯 Próximos Passos

1. **Copie o código de um dos exemplos acima**
2. **Cole na sua seção de formulário**
3. **Ajuste os campos para sua estrutura**
4. **Teste com um PDF real**
5. **Pronto!**

---

## 📞 Precisa de Ajuda?

- Veja console do navegador para logs `[OCR]`
- Verifique `CHECKLIST_INTEGRACAO_OCR.md` para mais exemplos
- Leia `RESUMO_OCR_IMPLEMENTACAO.md` para entender arquitetura

---

**Versão:** 1.0
**Status:** Pronto para Usar
**Tempo de Integração:** ~5 minutos por seção
