# 🧪 GUIA RÁPIDO DE TESTES - FASE 1

**Data**: 20 de Janeiro de 2026  
**Objetivo**: Testar todas as funcionalidades da FASE 1  

---

## ⚡ Testes Rápidos (5 minutos)

### 1. Import e Validação Básica

```typescript
// Abrir console do navegador (F12) ou Node.js

import validator from '@/services/AUDESPValidator';

// Teste 1: Documento vazio (deve falhar)
const emptyResult = validator.validate({});
console.log('Teste 1 - Vazio:');
console.log('isValid:', emptyResult.isValid); // false
console.log('Erros:', emptyResult.errors.length); // > 0
console.log('');

// Teste 2: Documento mínimo válido
const minimalData = {
  descritor: {
    exercicio: "2024",
    orgao: "350025",
    municipio: "3509502",
    tipoDocumento: "1"
  },
  codigoAjuste: "2024000001",
  documentosFiscais: [
    {
      tipo: "1",
      numero: "NF001",
      dataEmissao: "2024-01-15",
      valor: 1000.00,
      valorBruto: 1000.00,
      valorLiquido: 1000.00,
      fornecedor: {
        nome: "Fornecedor Test",
        cnpjCpf: "12345678000190"
      }
    }
  ],
  pagamentos: [
    {
      numero: "PAG001",
      dataPagamento: "2024-01-20",
      valor: 1000.00,
      descricao: "Pagamento NF001",
      documentoRelacionado: "NF001"
    }
  ]
};

const minimalResult = validator.validate(minimalData);
console.log('Teste 2 - Mínimo Válido:');
console.log('isValid:', minimalResult.isValid); // true
console.log('Completude:', minimalResult.summary.completionPercentage); // ~30%
console.log('Avisos:', minimalResult.warnings.length);
```

---

### 2. Teste de CPF

```typescript
// CPF válido
console.log('CPF 123.456.789-09:', validator.isValidCPF('123.456.789-09')); // true
console.log('CPF 111.111.111-11:', validator.isValidCPF('111.111.111-11')); // false (todos iguais)
console.log('CPF 123.456.789-10:', validator.isValidCPF('123.456.789-10')); // false (dígito errado)

// Teste de validação em campo
const cpfErrors = validator.validateField(
  'descritor.responsavel.cpf',
  '123.456.789-10',
  minimalData
);
console.log('Erros no CPF inválido:', cpfErrors.length > 0); // true
```

---

### 3. Teste de CNPJ

```typescript
// CNPJ válido (exemplo real)
console.log('CNPJ 11.222.333/0001-81:', validator.isValidCNPJ('11.222.333/0001-81')); // true

// Com dados
const dataWithCNPJ = {
  ...minimalData,
  contratos: [
    {
      numero: "C001",
      contratada: {
        nome: "Empresa Test",
        cnpj: "11.222.333/0001-81" // ✅ Válido
      },
      objeto: "Serviço",
      valor: 5000,
      dataInicio: "2024-01-01",
      dataFim: "2024-12-31",
      modalidade: "1"
    }
  ]
};

const cnpjResult = validator.validate(dataWithCNPJ);
console.log('Documento com CNPJ válido:', cnpjResult.isValid);
```

---

### 4. Teste de Regra de Negócio (Pagamento ≤ Documento)

```typescript
// ❌ ERRO: Pagamento > Documento
const errorData = {
  ...minimalData,
  documentosFiscais: [
    {
      ...minimalData.documentosFiscais[0],
      valor: 1000.00,
      valorLiquido: 1000.00
    }
  ],
  pagamentos: [
    {
      ...minimalData.pagamentos[0],
      valor: 1500.00 // ❌ Maior que documento!
    }
  ]
};

const errorResult = validator.validate(errorData);
console.log('Teste - Pagamento > Documento:');
console.log('isValid:', errorResult.isValid); // false
console.log('Erro crítico encontrado:', errorResult.errors.some(e => e.severity === 'critical')); // true

// Mostrar erro
const criticalErr = errorResult.errors.find(e => e.severity === 'critical');
console.log('Mensagem:', criticalErr?.message);
console.log('Sugestão:', criticalErr?.suggestion);
```

---

### 5. Teste de Divergência

```typescript
// Documento fiscal sem pagamento relacionado
const divergenceData = {
  ...minimalData,
  documentosFiscais: [
    { ...minimalData.documentosFiscais[0], numero: "NF001" },
    { ...minimalData.documentosFiscais[0], numero: "NF002" } // ⚠️ Sem pagamento
  ],
  pagamentos: minimalData.pagamentos // Apenas NF001
};

const divergenceResult = validator.validate(divergenceData);
console.log('Teste - Documento sem Pagamento:');
console.log('Avisos encontrados:', divergenceResult.warnings.length); // > 0
console.log('Aviso:', divergenceResult.warnings[0]?.message);
```

---

## 🎣 Teste do Hook useFormValidation

```typescript
// Em um componente React:

import { useFormValidation } from '@/hooks/useFormValidation';

function TestComponent() {
  const form = useFormValidation({ exercicio: "2024" });

  return (
    <div>
      <h3>Teste useFormValidation</h3>
      
      {/* Teste 1: Update field */}
      <button onClick={() => {
        form.handleFieldChange('descritor.exercicio', '2025');
        console.log('formData após update:', form.formData);
      }}>
        Update Field
      </button>

      {/* Teste 2: Add item a array */}
      <button onClick={() => {
        form.addArrayItem('documentosFiscais', {
          numero: 'NF001',
          valor: 1000
        });
        console.log('Array após add:', form.formData.documentosFiscais);
      }}>
        Add Item
      </button>

      {/* Teste 3: Validação resultado */}
      <pre>
        {JSON.stringify({
          isValid: form.validationResult.isValid,
          totalErrors: form.validationResult.summary.totalErrors,
          completeness: form.validationResult.summary.completionPercentage
        }, null, 2)}
      </pre>

      {/* Teste 4: Reset */}
      <button onClick={() => form.reset()}>Reset Form</button>
    </div>
  );
}
```

---

## 🎨 Teste dos Componentes

### ErrorPanel

```typescript
<ErrorPanel
  errors={[
    {
      path: "/documentosFiscais/0/valor",
      field: "valor",
      message: "Valor obrigatório",
      value: undefined,
      rule: "required",
      severity: "critical"
    }
  ]}
  warnings={[
    {
      path: "/pagamentos",
      message: "Documento fiscal sem pagamento relacionado",
      type: "missing-related"
    }
  ]}
  completionPercentage={45}
  isOpen={true}
/>
```

**Verificar**:
- ✅ Erro crítico em vermelho
- ✅ Aviso em amarelo
- ✅ Barra de progresso em 45%
- ✅ Botão X funciona

---

### JSONViewer

```typescript
const testData = {
  descritor: {
    exercicio: "2024",
    responsavel: {
      nome: "João Silva",
      cpf: "123.456.789-09"
    }
  },
  documentosFiscais: [
    { numero: "NF001", valor: 1000 }
  ]
};

<JSONViewer 
  data={testData}
  errors={[
    {
      path: "/documentosFiscais/0",
      field: "valor",
      message: "Teste",
      value: 1000,
      rule: "test",
      severity: "error"
    }
  ]}
/>
```

**Verificar**:
- ✅ Árvore expandível
- ✅ Clique no chevron para expandir/colapsar
- ✅ Cores: verde (string), laranja (number), azul (object)
- ✅ Botão Copy funciona
- ✅ Botão Download gera arquivo

---

## 📊 Teste de Performance

```typescript
// Gerar dados de teste grandes
function generateLargeData() {
  const docs = Array.from({ length: 100 }, (_, i) => ({
    tipo: "1",
    numero: `NF${String(i).padStart(6, '0')}`,
    dataEmissao: "2024-01-15",
    valor: Math.random() * 10000,
    valorBruto: Math.random() * 10000,
    valorLiquido: Math.random() * 10000,
    fornecedor: {
      nome: `Fornecedor ${i}`,
      cnpjCpf: `${String(i).padStart(14, '0')}`
    }
  }));

  return {
    descritor: minimalData.descritor,
    codigoAjuste: minimalData.codigoAjuste,
    documentosFiscais: docs,
    pagamentos: docs.map(d => ({
      numero: `P${d.numero}`,
      dataPagamento: "2024-01-20",
      valor: d.valor,
      descricao: `Pgto ${d.numero}`,
      documentoRelacionado: d.numero
    }))
  };
}

console.time('Validação 100 docs');
const largeResult = validator.validate(generateLargeData());
console.timeEnd('Validação 100 docs');

console.log('Resultado:');
console.log('- isValid:', largeResult.isValid);
console.log('- Tempo < 1s:', true); // Deve ser rápido
```

---

## ✅ Checklist de Testes

- [ ] CPF válido/inválido detectado corretamente
- [ ] CNPJ válido/inválido detectado corretamente
- [ ] Pagamento > Documento retorna erro crítico
- [ ] Documento sem pagamento retorna aviso
- [ ] Completude % calculada corretamente
- [ ] useFormValidation atualiza estado
- [ ] ErrorPanel exibe erros e avisos
- [ ] JSONViewer expande/colapsa corretamente
- [ ] Copy JSON funciona
- [ ] Download gera arquivo com nome correto
- [ ] Performance < 1s mesmo com 100+ documentos

---

## 🐛 Troubleshooting

### "ImportError: Cannot find module"
→ Certifique-se que os caminhos estão corretos (use `@/` para imports)

### "ValidationResult undefined"
→ Importar corretamente: `import validator from '@/services/AUDESPValidator'`

### Validação muito lenta
→ Normal se houver 1000+ campos. Debounce está ativado (500ms).

### CPF/CNPJ sempre inválido
→ Verificar formatação: deve ter máscara (XXX.XXX.XXX-XX)

---

## 📞 Próximas Etapas

1. ✅ Testes unitários completos
2. ⏳ Integração com UI (FASE 2)
3. ⏳ Testes E2E com dados reais
4. ⏳ Performance profiling
5. ⏳ Deploy para staging

---

**Última Atualização**: 20 de Janeiro de 2026
