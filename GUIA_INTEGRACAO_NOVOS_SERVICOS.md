# 📚 GUIA DE INTEGRAÇÃO - NOVOS SERVIÇOS DO SISTEMA

**Data:** 16 de Janeiro de 2026  
**Versão:** 2.0.0  
**Status:** Pronto para implementação

---

## 📋 ÍNDICE

1. [Validação Avançada](#validação-avançada)
2. [Auditoria e Logging](#auditoria-e-logging)
3. [Geração de Relatórios](#geração-de-relatórios)
4. [Import/Export Robusto](#importexport-robusto)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Integração em Componentes React](#integração-em-componentes-react)

---

## 🔍 Validação Avançada

### Importação
```typescript
import {
  ComprehensiveValidator,
  validatePrestacaoContas,
  generateConsistencyReport,
  validateFormatters,
  validateFiscalPeriod,
  validateIntegrity
} from './services/advancedValidationService';
import type { ValidationResult, ConsistencyReport } from './services/advancedValidationService';
```

### Uso Básico
```typescript
// Validar dados completos
const validationResult: ValidationResult = validatePrestacaoContas(formData);

if (!validationResult.isValid) {
  console.log('Erros encontrados:', validationResult.errors);
  console.log('Avisos:', validationResult.warnings);
  console.log('Sumário:', validationResult.summary);
}
```

### Validadores Específicos
```typescript
// Validar CPF
const isValidCPF = validateFormatters.isValidCPF('123.456.789-10');

// Validar CNPJ
const isValidCNPJ = validateFormatters.isValidCNPJ('12.345.678/0001-90');

// Validar data
const isValidDate = validateFormatters.isValidDate('2025-01-16');

// Validar CBO
const isValidCBO = validateFormatters.isValidCBO('1234-56');

// Validar período fiscal
const isInFiscalMonth = validateFiscalPeriod.isValidFiscalMonth(1); // true se mes 1-12
```

### Validação de Consistência
```typescript
// Gerar relatório de consistência entre seções
const consistencyReport: ConsistencyReport = generateConsistencyReport(formData);

if (consistencyReport.hasConsistencyIssues) {
  console.log('Problemas encontrados:', consistencyReport.issues);
  console.log('Referências Pagamento->Nota:', consistencyReport.crossReferences.paymentToInvoice);
}
```

### Estrutura de Erro
```typescript
interface ValidationError {
  field: string;          // Campo com erro (ex: "descritor.municipio")
  message: string;        // Mensagem descritiva
  severity: 'error' | 'warning' | 'info';
  section?: string;       // Número da seção (ex: "1", "7")
  value?: any;           // Valor que causou erro
}
```

---

## 📝 Auditoria e Logging

### Importação
```typescript
import {
  AuditLogger,
  ChangeTracker,
  IntegrityChecker,
  AuditReportGenerator
} from './services/auditService';
import type {
  AuditEntry,
  ChangeLog,
  AuditReport,
  IntegrityCheck
} from './services/auditService';
```

### AuditLogger - Principais Operações

```typescript
// Log de login
AuditLogger.logLogin('user@example.com', true);

// Log de operação customizada
AuditLogger.logOperation({
  action: 'UPDATE',
  section: '7',
  field: 'documentos_fiscais[0]',
  oldValue: { numero: '123' },
  newValue: { numero: '456' },
  status: 'SUCCESS',
  userId: 'user@example.com'
});

// Log de transmissão
AuditLogger.logTransmission(
  'Prestação de Contas de Convênio',
  'PROTO123456',
  'SUCCESS',
  undefined,
  'user@example.com'
);

// Log de validação
AuditLogger.logValidation(
  true, // isValid
  0,    // errorCount
  'user@example.com'
);

// Log de exportação
AuditLogger.logExport('JSON', 'user@example.com');

// Log de importação
AuditLogger.logImport('CSV', true, undefined, 'user@example.com');
```

### ChangeTracker - Rastreamento de Alterações
```typescript
// Comparar versões de dados
const changes: ChangeLog[] = ChangeTracker.trackChanges(
  oldFormData,
  newFormData,
  'user@example.com'
);

// Acompanhar alterações específicas
const specificChanges = ChangeTracker.getSpecificChanges(oldFormData, newFormData);

specificChanges.forEach(change => {
  console.log(`${change.field}: ${change.oldValue} → ${change.newValue}`);
});
```

### IntegrityChecker - Verificação de Integridade
```typescript
// Registrar hash de dados
const check: IntegrityCheck = await IntegrityChecker.registerIntegrityCheck(
  formData,
  'user@example.com'
);
console.log('Hash gerado:', check.dataHash);
console.log('Algoritmo:', check.hashAlgorithm); // SHA-256 ou SIMPLE_HASH

// Verificar se dados foram alterados
const hasChanged = await IntegrityChecker.detectUnregisteredChanges(formData);
if (hasChanged) {
  console.log('Dados foram alterados desde último check!');
}

// Verificar integridade
const isIntact = await IntegrityChecker.verifyIntegrity(formData);
console.log('Integridade verificada:', isIntact);

// Obter histórico de checksums
const history = IntegrityChecker.getIntegrityHistory();
console.log(`Últimos ${history.length} checksums registrados`);
```

### AuditReportGenerator - Relatórios de Auditoria
```typescript
// Gerar relatório completo
const report: AuditReport = AuditReportGenerator.generateReport(
  '2025-01-01T00:00:00Z',  // from (opcional)
  '2025-01-31T23:59:59Z'   // to (opcional)
);

console.log('Total de operações:', report.totalOperations);
console.log('Operações por tipo:', report.operationsByType);
console.log('Seções alteradas:', report.changedSections);

// Exportar como JSON
const jsonReport = AuditReportGenerator.exportReportJSON();
const blob = new Blob([jsonReport], { type: 'application/json' });

// Exportar como CSV
const csvReport = AuditReportGenerator.exportReportCSV();
// csv contém: Timestamp,Ação,Seção,Campo,Status,Usuário,Detalhes
```

### Acessar Logs
```typescript
// Log completo
const fullLog = AuditLogger.getLog();

// Log filtrado por período
const logByPeriod = AuditLogger.getLogByPeriod('2025-01-01', '2025-01-31');

// Log filtrado por ação
const transmissions = AuditLogger.getLogByAction('TRANSMIT');
const validations = AuditLogger.getLogByAction('VALIDATE');

// Log filtrado por seção
const section7Changes = AuditLogger.getLogBySection('7');

// Log filtrado por usuário
const userActions = AuditLogger.getLogByUser('user@example.com');
```

---

## 📊 Geração de Relatórios

### Importação
```typescript
import {
  ExecutiveReportGenerator,
  ReportDownloader
} from './services/reportService';
import type {
  ExecutiveSummary,
  ReportMetadata
} from './services/reportService';
```

### Gerar Sumário Executivo
```typescript
// Importar validador
import { validatePrestacaoContas } from './services/advancedValidationService';

// Validar dados primeiro
const validationResult = validatePrestacaoContas(formData);

// Gerar sumário executivo
const summary: ExecutiveSummary = ExecutiveReportGenerator.generate(
  formData,
  validationResult,
  'user@example.com' // opcional
);

// Acessar informações
console.log('Completude:', summary.overview.completionPercentage, '%');
console.log('Tem erros:', summary.overview.hasErrors);
console.log('Total de erros:', summary.overview.errorCount);

// Sumário financeiro
if (summary.financialSummary) {
  console.log('Total recebido:', summary.financialSummary.totalReceived);
  console.log('Total gasto:', summary.financialSummary.totalSpent);
  console.log('Saldo:', summary.financialSummary.balance);
}

// Seções
summary.sections.forEach(section => {
  console.log(`Seção ${section.section}: ${section.recordCount} registros`);
});
```

### Exportar Relatório
```typescript
// Exportar como HTML
const html = ExecutiveReportGenerator.exportAsHTML(summary);

// Download do HTML (pode imprimir como PDF)
ReportDownloader.downloadHTML(
  html,
  `relatorio_${formData.descritor.entidade}_${formData.descritor.ano}.html`
);

// Abrir em nova aba (para visualizar antes de imprimir)
ReportDownloader.openInNewTab(html);

// Exportar como JSON
const json = ExecutiveReportGenerator.exportAsJSON(summary);
ReportDownloader.downloadJSON(
  json,
  `relatorio_${formData.descritor.entidade}_${formData.descritor.ano}.json`
);
```

---

## 📦 Import/Export Robusto

### Importação
```typescript
import {
  ExportService,
  ImportService,
  BackupService
} from './services/enhancedFileService';
import type {
  ExportData,
  ImportValidation,
  BackupInfo
} from './services/enhancedFileService';
```

### ExportService
```typescript
// Exportar com metadados completos
const json = ExportService.exportAsJSON(
  formData,
  'Prestação de Contas de Janeiro/2025'
);

// Download
ExportService.download(
  json,
  `prestacao_contas_${data.descritor.entidade}_01_2025.json`,
  'application/json'
);

// Exportar como CSV
const csv = ExportService.exportAsCSV(formData);
ExportService.download(
  csv,
  `prestacao_contas_${data.descritor.entidade}_01_2025.csv`,
  'text/csv;charset=utf-8'
);
```

### ImportService
```typescript
// Importar arquivo JSON
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  try {
    const { data, validation } = await ImportService.importJSON(
      file,
      'user@example.com'
    );

    if (validation.isValid) {
      // Dados importados com sucesso
      console.log('Dados importados:', data);
      setFormData(data);
    } else {
      // Mostrar erros
      console.error('Erros de validação:', validation.errors);
      console.warn('Avisos:', validation.warnings);
    }
  } catch (error) {
    console.error('Erro ao importar:', error);
  }
}

// Importar CSV
const { data, validation } = await ImportService.importCSV(file, 'user@example.com');
```

### BackupService
```typescript
// Criar backup
const backup: BackupInfo = BackupService.createBackup(
  formData,
  'user@example.com'
);
console.log('Backup criado:', backup.id);
console.log('Checksum:', backup.checksum);

// Listar backups
const backups = BackupService.getBackups();
backups.forEach(b => {
  console.log(`${b.timestamp}: ${b.checksum} (${b.size} bytes)`);
});

// Restaurar backup
const restored = BackupService.restoreBackup(backup.id, 'user@example.com');
if (restored) {
  setFormData(restored);
}

// Remover backup
BackupService.removeBackup(backup.id, 'user@example.com');
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Fluxo Completo de Submissão
```typescript
// 1. Validar dados
const validation = validatePrestacaoContas(formData);
if (!validation.isValid) {
  showErrors(validation.errors);
  AuditLogger.logValidation(false, validation.errors.length, userId);
  return;
}
AuditLogger.logValidation(true, 0, userId);

// 2. Criar backup
const backup = BackupService.createBackup(formData, userId);
console.log('Backup criado:', backup.id);

// 3. Registrar checksum
const integrityCheck = await IntegrityChecker.registerIntegrityCheck(formData, userId);

// 4. Gerar relatório
const validationResult = validatePrestacaoContas(formData);
const report = ExecutiveReportGenerator.generate(formData, validationResult, userId);

// 5. Mostrar sumário
showReportPreview(report);

// 6. Enviar dados
try {
  const response = await sendPrestacaoContas(token, formData);
  AuditLogger.logTransmission(
    formData.descritor.tipo_documento,
    response.protocolo,
    'SUCCESS',
    undefined,
    userId
  );
  showSuccess(response.protocolo);
} catch (error) {
  AuditLogger.logTransmission(
    formData.descritor.tipo_documento,
    null,
    'FAILED',
    error.message,
    userId
  );
  showError(error.message);
}
```

### Exemplo 2: Auditoria Completa
```typescript
// Usuário edita seção
const oldData = { ...formData };
formData.documentos_fiscais.push(newInvoice);

// Rastrear mudanças
const changes = ChangeTracker.trackChanges(oldData, formData, userId);

// Log automático de alterações
changes.forEach(change => {
  console.log(`${change.field} foi alterado`);
});

// Registrar novo checksum
await IntegrityChecker.registerIntegrityCheck(formData, userId);

// Gerar relatório de auditoria
const auditReport = AuditReportGenerator.generateReport();
console.log('Total de operações:', auditReport.totalOperations);
```

### Exemplo 3: Importar e Validar
```typescript
// Usuário seleciona arquivo
const file = selectedFile;

// Importar
const { data, validation } = await ImportService.importJSON(file, userId);

// Mostrar resultado
if (validation.isValid) {
  alert('Arquivo importado com sucesso!');
  
  // Executar validação completa
  const fullValidation = validatePrestacaoContas(data);
  
  // Mostrar sumário
  const summary = ExecutiveReportGenerator.generate(data, fullValidation);
  showImportSummary(summary);
} else {
  alert(`Erros encontrados:\n${validation.errors.join('\n')}`);
}
```

---

## 🔗 Integração em Componentes React

### Hook Customizado para Validação
```typescript
import { useCallback, useMemo } from 'react';
import { validatePrestacaoContas } from '../services/advancedValidationService';
import { AuditLogger } from '../services/auditService';

export function useFormValidation(formData: PrestacaoContas, userId?: string) {
  const validationResult = useMemo(() => {
    return validatePrestacaoContas(formData);
  }, [formData]);

  const validate = useCallback(() => {
    AuditLogger.logValidation(!validationResult.isValid, validationResult.errors.length, userId);
    return validationResult;
  }, [validationResult, userId]);

  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    summary: validationResult.summary,
    validate
  };
}
```

### Componente de Validação
```typescript
import React from 'react';
import { useFormValidation } from '../hooks/useFormValidation';

interface ValidationPanelProps {
  formData: PrestacaoContas;
  userId?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ formData, userId }) => {
  const { isValid, errors, warnings, summary } = useFormValidation(formData, userId);

  return (
    <div className="validation-panel">
      <div className="status">
        {isValid ? (
          <span className="valid">✅ Dados válidos</span>
        ) : (
          <span className="invalid">❌ {summary.totalErrors} erros encontrados</span>
        )}
      </div>

      {summary.totalWarnings > 0 && (
        <div className="warnings">
          ⚠️ {summary.totalWarnings} avisos
        </div>
      )}

      {errors.length > 0 && (
        <div className="errors">
          {errors.slice(0, 5).map((error, i) => (
            <div key={i} className="error">
              <strong>{error.field}</strong>: {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Botão de Gerar Relatório
```typescript
import React from 'react';
import { ExecutiveReportGenerator, ReportDownloader } from '../services/reportService';
import { validatePrestacaoContas } from '../services/advancedValidationService';

interface ReportButtonProps {
  formData: PrestacaoContas;
}

export const ReportButton: React.FC<ReportButtonProps> = ({ formData }) => {
  const handleGenerateReport = () => {
    const validation = validatePrestacaoContas(formData);
    const summary = ExecutiveReportGenerator.generate(formData, validation);
    const html = ExecutiveReportGenerator.exportAsHTML(summary);
    
    ReportDownloader.openInNewTab(html);
  };

  return (
    <button onClick={handleGenerateReport} className="btn-primary">
      📊 Gerar Relatório
    </button>
  );
};
```

---

## 🧪 Testes Recomendados

```typescript
// test/advancedValidationService.test.ts
import { validateFormatters } from '../services/advancedValidationService';

describe('CPF Validation', () => {
  it('should validate correct CPF', () => {
    expect(validateFormatters.isValidCPF('123.456.789-10')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(validateFormatters.isValidCPF('000.000.000-00')).toBe(false);
  });
});

describe('CNPJ Validation', () => {
  it('should validate correct CNPJ', () => {
    expect(validateFormatters.isValidCNPJ('12.345.678/0001-90')).toBe(true);
  });
});
```

---

## 📞 Suporte e Troubleshooting

### Problema: Relatório HTML não exibe corretamente
**Solução:** Usar `ReportDownloader.openInNewTab()` em vez de download direto

### Problema: localStorage cheio
**Solução:** Limpar logs antigos com `AuditLogger.clearLog('CONFIRM_CLEAR_AUDIT_LOG')`

### Problema: Validação muito lenta
**Solução:** Usar `useMemo` em componentes React para cachear resultados

---

**Documento de Integração - Versão 2.0.0**  
**Última atualização: 16 de Janeiro de 2026**
