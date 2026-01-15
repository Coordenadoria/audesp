# 🎯 Sistema de Validação em Tempo Real

## Visão Geral

O sistema agora fornece **validação completa em tempo real** que ajuda o usuário a preencher o formulário corretamente:

### ✨ Funcionalidades

1. **Painel de Campos Faltando** - Mostra exatamente o que precisa ser preenchido
2. **Validação por Campo** - Feedback visual enquanto digita
3. **Referências do Manual** - Cada campo tem link para o Manual v1.9
4. **Feedback de Erro Detalhado** - Mensagens claras sobre o que está errado
5. **Ativação Automática do Botão** - Transmitir só fica ativo quando tudo está OK

---

## 📋 Componentes Novos

### 1. MissingFieldsPanel.tsx

Mostra ao usuário um painel visual com:
- ❌ Campos obrigatórios faltando
- 📝 Descrição clara de cada campo
- 📖 Referência ao Manual v1.9
- 💡 Dicas para completar

**Uso:**
```tsx
import { MissingFieldsPanel } from './components/MissingFieldsPanel';

<MissingFieldsPanel data={formData} onClose={handleClose} />
```

**Exemplo de Saída:**
```
❌ 5 Campos Faltando

Informações Básicas
├─ Município (Código IBGE) - Manual v1.9 Seção 1
├─ Entidade (Código da entidade) - Manual v1.9 Seção 1
├─ Ano/Mês (Obrigatoriamente dezembro) - Manual v1.9 Seção 1
└─ ...

Dados da Entidade
├─ CNPJ (CNPJ válido - 14 dígitos)
├─ Razão Social (Nome da entidade)
└─ ...
```

### 2. useFormValidation.tsx

Hook React para validação em tempo real:

```tsx
import { useFormValidation, FieldFeedback } from './hooks/useFormValidation';

const { touchField, getFieldStatus, isFormValid } = useFormValidation(formData);

// Em um input:
<input
  onChange={(e) => {
    updateField('municipio', e.target.value);
    touchField('municipio', e.target.value);
  }}
/>

// Mostrar feedback:
<FieldFeedback
  status={getFieldStatus('municipio')}
  label="Município"
  manualRef="Manual v1.9 - Seção 1"
/>

// Habilitar botão transmitir:
<button disabled={!isFormValid}>
  Transmitir
</button>
```

### 3. Validação Automática no TransmissionResult

Quando há erro de transmissão, o painel de campos faltando é exibido automaticamente:

```tsx
<TransmissionResult
  result={resultado}
  formData={formData}  // Passa os dados para análise
  onClose={handleClose}
/>
```

---

## 🔍 Validações por Campo

| Campo | Validação | Erro |
|-------|-----------|------|
| CPF | Exatamente 11 dígitos | "CPF deve ter 11 dígitos" |
| CNPJ | Exatamente 14 dígitos | "CNPJ deve ter 14 dígitos" |
| Data | Formato YYYY-MM-DD | "Data inválida. Use YYYY-MM-DD" |
| Valores | Número positivo | "Deve ser um número válido" |
| Mês | Deve ser 12 | "Apenas dezembro é aceito" |
| Município | 1-9999 | "Código deve estar entre 1 e 9999" |

---

## 📊 Exemplo de Fluxo

### 1. Usuário Acessa o Sistema
```
Sistema carrega com painel mostrando:
"5 campos faltando para poder transmitir"
```

### 2. Começa a Preencher
```
Input: Município
❌ Erro: "Código deve estar entre 1 e 9999"

Input: Municipio = 3520402
✓ Município válido (São Paulo)
```

### 3. Preenche Mais Campos
```
Conforme preenche, o painel atualiza:
"3 campos faltando"
"2 campos faltando"
"1 campo faltando"
```

### 4. Tudo Pronto
```
✓ Pronto para Transmissão!
Botão "Transmitir" fica ativo
```

### 5. Se Houver Erro
```
Erro de Validação na API:
- $.receitas.repasses_recebidos faltando
- $.disponibilidades.saldos estrutura inválida

Painel mostra:
"Complete os campos listados abaixo conforme Manual v1.9"
```

---

## 💻 Integração com FormSections

Adicionar em cada seção do formulário:

```tsx
import { useFormValidation, FieldFeedback } from '../hooks/useFormValidation';

export const DescriptorSection = ({ data, onUpdate }) => {
  const { touchField, getFieldStatus, isFormValid } = useFormValidation(data);

  return (
    <div>
      {/* Município */}
      <div>
        <label>Município *</label>
        <input
          type="number"
          value={data.descritor?.municipio || ''}
          onChange={(e) => {
            onUpdate('municipio', e.target.value);
            touchField('descritor.municipio', e.target.value);
          }}
        />
        <FieldFeedback
          status={getFieldStatus('descritor.municipio')}
          label="Município"
          manualRef="Manual v1.9 - Seção 1"
        />
      </div>

      {/* Entidade */}
      <div>
        <label>Entidade *</label>
        <input
          type="number"
          value={data.descritor?.entidade || ''}
          onChange={(e) => {
            onUpdate('entidade', e.target.value);
            touchField('descritor.entidade', e.target.value);
          }}
        />
        <FieldFeedback
          status={getFieldStatus('descritor.entidade')}
          label="Entidade"
          manualRef="Manual v1.9 - Seção 1"
        />
      </div>
    </div>
  );
};
```

---

## 🚀 Função getMissingFieldsForTransmission()

Retorna um objeto JSON com:
- `totalMissing`: Número de campos faltando
- `categories`: Agrupamento por categoria
- `readyToTransmit`: Boolean indicando se pode transmitir

Exemplo:
```json
{
  "totalMissing": 5,
  "readyToTransmit": false,
  "categories": {
    "Informações Básicas": {
      "description": "Dados de identificação...",
      "fields": [
        {
          "fieldName": "Tipo de Documento",
          "requirement": "Selecione o tipo",
          "manualRef": "Manual v1.9 - Seção 1"
        }
      ]
    }
  }
}
```

---

## 📖 Referências do Manual

Cada campo tem referência ao Manual Técnico v1.9:

- **Seção 1**: Descritor (tipo doc, município, entidade, ano, mês)
- **Seção 2**: Dados da Entidade (CNPJ, razão social, certidões)
- **Seção 3**: Responsáveis
- **Seção 4**: Receitas
- **Seção 5**: Documentos Fiscais
- **Seção 6**: Relação de Bens
- **Seção 7**: Ajustes Contábeis
- **Seção 8**: Disponibilidades
- **Seção 9-12**: Relatórios

---

## ✅ Checklist de Implementação

Para ativar estas funcionalidades no formulário:

- [ ] Importar `getMissingFieldsForTransmission` no componente Dashboard
- [ ] Mostrar `MissingFieldsPanel` quando há campos faltando
- [ ] Implementar `useFormValidation` em cada seção
- [ ] Adicionar `FieldFeedback` após cada input
- [ ] Atualizar `TransmissionResult` com `formData`
- [ ] Desabilitar botão Transmitir enquanto há campos faltando
- [ ] Testar com suas credenciais

---

## 🎓 Próximos Passos

1. **Adicionar validação de CPF/CNPJ** (algoritmo correto)
2. **Validar consistência contábil** em tempo real
3. **Salvar rascunho** automaticamente
4. **Histórico de erros** anteriores
5. **Templates de preenchimento** por tipo de entidade
