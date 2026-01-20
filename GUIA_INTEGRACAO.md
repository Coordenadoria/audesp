# 🔗 Guia de Integração - Como Usar o Sistema AUDESP

## Quick Start (5 minutos)

### 1. Importar o componente no seu formulário

```typescript
import { AudespFormDashboard } from './components/AudespFormDashboard';

export function MyForm() {
  return (
    <div>
      {/* Seu formulário */}
      <AudespFormDashboard />
    </div>
  );
}
```

### 2. Usar o hook para sincronizar um campo

```typescript
import { useAudespField } from '../hooks/useAudespSync';

export function MyInput() {
  const [municipio, setMunicipio] = useAudespField('descritor.municipio');
  
  return (
    <input 
      value={municipio}
      onChange={(e) => setMunicipio(e.target.value)}
    />
  );
}
```

### 3. Integrar transmissão

```typescript
import { AudespTransmissionComponent } from './components/AudespTransmissionComponent';
import { useAudespSync, useAudespValidation } from '../hooks/useAudespSync';

export function MyPage() {
  const sync = useAudespSync();
  const validation = useAudespValidation();
  
  return (
    <AudespTransmissionComponent 
      formData={sync.formData}
      isValid={validation.isValid}
      onTransmissionComplete={(protocol) => {
        console.log(`Protocolo: ${protocol}`);
      }}
    />
  );
}
```

---

## Exemplos Avançados

### Exemplo 1: Validar e exportar

```typescript
import { useAudespSync } from '../hooks/useAudespSync';
import { AudespValidator } from '../services/audespValidator';

function MyComponent() {
  const sync = useAudespSync();
  
  function handleValidate() {
    const result = AudespValidator.validate(sync.formData);
    
    if (result.valid) {
      alert('Formulário válido!');
      
      // Exportar JSON
      const json = sync.exportJson();
      downloadFile(json, 'data.json');
    } else {
      // Mostrar erros
      result.errors.forEach(err => {
        console.error(`${err.path}: ${err.message}`);
      });
    }
  }
  
  return <button onClick={handleValidate}>Validar e Exportar</button>;
}
```

### Exemplo 2: Importar dados de um arquivo JSON

```typescript
import { useAudespSync } from '../hooks/useAudespSync';

function JsonImporter() {
  const sync = useAudespSync();
  
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonString = event.target?.result as string;
      const result = sync.importJson(jsonString);
      
      if (result.success) {
        alert('JSON importado com sucesso!');
      } else {
        alert(`Erro: ${result.errors.join(', ')}`);
      }
    };
    reader.readAsText(file);
  }
  
  return (
    <input 
      type="file" 
      accept=".json"
      onChange={handleFileUpload}
    />
  );
}
```

### Exemplo 3: Rastrear mudanças

```typescript
import { useAudespSync } from '../hooks/useAudespSync';

function ChangeTracker() {
  const sync = useAudespSync();
  
  // Monitorar mudanças
  React.useEffect(() => {
    const changes = sync.getState().changes;
    
    if (changes.length > 0) {
      const lastChange = changes[changes.length - 1];
      console.log(`Campo ${lastChange.path} foi alterado`);
      console.log(`De: ${lastChange.from}`);
      console.log(`Para: ${lastChange.to}`);
    }
  }, [sync.changeCount]);
  
  return (
    <div>
      <p>Mudanças: {sync.changeCount}</p>
      <button onClick={() => sync.undo()}>Desfazer</button>
    </div>
  );
}
```

### Exemplo 4: Transmitir com validação

```typescript
import { AudespTransmissionService } from '../services/audespTransmissionService';
import { useAudespSync } from '../hooks/useAudespSync';

async function handleTransmit() {
  const sync = useAudespSync();
  
  // Transmitir com validação automática
  const response = await AudespTransmissionService.transmit(
    sync.formData,
    {
      ambiente: 'piloto',
      email: 'user@example.com',
      autoValidate: true,
      dryRun: false
    }
  );
  
  if (response.success) {
    console.log(`✅ Protocolo: ${response.protocolNumber}`);
    
    // Marca como sincronizado
    sync.markSynced();
  } else {
    console.error(`❌ ${response.message}`);
  }
}
```

### Exemplo 5: Adicionar empregado dinamicamente

```typescript
import { useAudespSync } from '../hooks/useAudespSync';

function AddEmployee() {
  const sync = useAudespSync();
  
  function handleAddEmployee() {
    const newEmployee = {
      cpf: '123.456.789-01',
      cbo: '2391-05',
      nome: 'João da Silva',
      salario_contratual: 3000.00,
      periodos_remuneracao: []
    };
    
    sync.addItem('relacao_empregados', newEmployee);
    alert('Empregado adicionado!');
  }
  
  return <button onClick={handleAddEmployee}>Adicionar Empregado</button>;
}
```

### Exemplo 6: Validação em tempo real

```typescript
import { useAudespValidation } from '../hooks/useAudespSync';

function FormWithValidation() {
  const { isValid, errors, warnings } = useAudespValidation();
  
  return (
    <div>
      {!isValid && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3>Erros encontrados:</h3>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err.path}: {err.message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3>Avisos:</h3>
          <ul>
            {warnings.map((warn, idx) => (
              <li key={idx}>{warn.path}: {warn.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Integração Passo a Passo

### Passo 1: Importar o Hook Principal

```typescript
import { useAudespSync } from '../hooks/useAudespSync';

function MyForm() {
  const sync = useAudespSync(true); // true = auto-validate
  
  // Agora tem acesso a:
  // - sync.formData
  // - sync.isDirty
  // - sync.validation
  // - sync.updateField()
  // - sync.exportJson()
  // - etc.
}
```

### Passo 2: Conectar Inputs

```typescript
<input
  value={sync.getField('descritor.municipio') || ''}
  onChange={(e) => sync.updateField('descritor.municipio', e.target.value)}
/>
```

### Passo 3: Validar

```typescript
function handleSubmit() {
  const validation = sync.validate();
  
  if (validation.valid) {
    // Prosseguir com transmissão
  } else {
    // Mostrar erros
    validation.errors.forEach(err => {
      showError(`${err.path}: ${err.message}`);
    });
  }
}
```

### Passo 4: Transmitir

```typescript
import { AudespTransmissionService } from '../services/audespTransmissionService';

async function handleTransmit() {
  const response = await AudespTransmissionService.transmit(
    sync.formData,
    { ambiente: 'piloto', autoValidate: true }
  );
  
  if (response.success) {
    saveProtocol(response.protocolNumber);
  }
}
```

---

## Troubleshooting

### Problema: Campo não atualiza

**Solução**: Certifique-se de usar o path correto

```typescript
// ❌ Errado
sync.updateField('municipio', value);

// ✅ Correto
sync.updateField('descritor.municipio', value);
```

### Problema: Validação não funciona

**Solução**: Inicialize o hook com `autoValidate: true`

```typescript
const sync = useAudespSync(true); // true ativa validação automática
```

### Problema: JSON não importa

**Solução**: Verifique o formato e campos obrigatórios

```typescript
const result = sync.importJson(jsonString);

if (!result.success) {
  console.error('Erros:', result.errors);
  console.warn('Avisos:', result.warnings);
}
```

### Problema: Protocolo não retorna

**Solução**: Verifique se está usando modo `dryRun: false` e validação passou

```typescript
const response = await AudespTransmissionService.transmit(formData, {
  autoValidate: true,
  dryRun: false  // Importante!
});
```

---

## Checklist de Integração

- [ ] Importou os serviços necessários
- [ ] Adicionou o hook `useAudespSync`
- [ ] Conectou os inputs ao formulário
- [ ] Implementou validação
- [ ] Testou importação JSON
- [ ] Testou exportação JSON
- [ ] Testou transmissão (modo piloto)
- [ ] Testou rastreamento de protocolo
- [ ] Testou undo/redo
- [ ] Configurou ambiente correto (piloto/produção)

---

## Referência Rápida

```typescript
// Sincronização
sync.updateField(path, value)
sync.addItem(arrayPath, item)
sync.removeItem(arrayPath, index)
sync.undo()
sync.reset()

// Validação
sync.validate()
const { isValid, errors, warnings } = sync.validation

// JSON
sync.exportJson(prettyPrint?)
sync.importJson(jsonString)

// Estado
sync.formData
sync.isDirty
sync.hasChanges
sync.changeCount
sync.syncedAt

// Transmissão
AudespTransmissionService.transmit(data, options)
AudespTransmissionService.getLogs()
AudespTransmissionService.getLastSuccessfulProtocol()
```

---

**Versão**: 1.9.0
**Última atualização**: 20/01/2026
