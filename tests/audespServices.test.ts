/**
 * Testes para validação dos serviços AUDESP
 * Verifica validator, JSON service e sync service
 */

import { AudespValidator } from '../services/audespValidator';
import { AudespJsonService } from '../services/audespJsonService';
import { AudespSyncService } from '../services/audespSyncService';
import { PrestacaoContasAudesp } from '../services/audespSchemaTypes';

// Dados de teste
const sampleData: Partial<PrestacaoContasAudesp> = {
  descritor: {
    municipio: 'São Paulo',
    entidade: 'Secretaria de Educação',
    ano: 2024,
    mes: 3
  },
  relacao_empregados: [
    {
      cpf: '12345678901',
      cbo: '2391-05',
      nome: 'João da Silva',
      salario_contratual: 3000.00,
      periodos_remuneracao: [
        {
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31',
          valor_bruto: 3000.00,
          descontos: 500.00,
          valor_liquido: 2500.00
        }
      ]
    }
  ],
  receitas: {
    repasses: [],
    outras_receitas: []
  },
  pagamentos: []
};

export const runTests = () => {
  console.log('🧪 Iniciando testes AUDESP...\n');

  // Teste 1: Validação básica
  console.log('📋 Teste 1: Validação básica');
  const validation = AudespValidator.validate(sampleData);
  console.log(`  Status: ${validation.valid ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`  Erros: ${validation.errors.length}`);
  console.log(`  Avisos: ${validation.warnings.length}`);
  if (validation.errors.length > 0) {
    validation.errors.slice(0, 3).forEach(e => {
      console.log(`    - ${e.path}: ${e.message}`);
    });
  }
  console.log('');

  // Teste 2: Exportação JSON
  console.log('📤 Teste 2: Exportação JSON');
  const json = AudespJsonService.exportJson(sampleData, {
    includeEmptyFields: false,
    prettyPrint: false,
    includeMeta: true
  });
  console.log(`  Tamanho: ${json.length} bytes`);
  console.log(`  Válido: ${json.startsWith('{') && json.endsWith('}') ? '✅' : '❌'}`);
  console.log('');

  // Teste 3: Importação JSON
  console.log('📥 Teste 3: Importação JSON');
  const importResult = AudespJsonService.importJson(json);
  console.log(`  Status: ${importResult.success ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`  Avisos: ${importResult.warnings.length}`);
  if (importResult.warnings.length > 0) {
    importResult.warnings.forEach(w => {
      console.log(`    - ${w}`);
    });
  }
  console.log('');

  // Teste 4: Validação de campos desconhecidos
  console.log('🔍 Teste 4: Validação de campos desconhecidos');
  const testData = { ...JSON.parse(json), campoDesconhecido: 'valor' };
  const unknownFields = AudespJsonService.hasUnknownFields(testData);
  console.log(`  Campos desconhecidos encontrados: ${unknownFields.length}`);
  unknownFields.forEach(f => {
    console.log(`    - ${f}`);
  });
  console.log(`  Status: ${unknownFields.length > 0 ? '✅ CORRETO' : '❌'}`);
  console.log('');

  // Teste 5: Template vazio
  console.log('📝 Teste 5: Template vazio');
  const template = AudespJsonService.generateEmptyTemplate();
  console.log(`  Campos principais: ${Object.keys(template).length}`);
  console.log(`  Tem descritor: ${template.descritor ? '✅' : '❌'}`);
  console.log(`  Tem receitas: ${template.receitas ? '✅' : '❌'}`);
  console.log('');

  // Teste 6: Sync Service - Inicialização
  console.log('🔄 Teste 6: Sync Service - Inicialização');
  AudespSyncService.initialize({ autoValidate: true });
  const state = AudespSyncService.getState();
  console.log(`  Estado inicializado: ${state.formData ? '✅' : '❌'}`);
  console.log(`  Dirty flag: ${state.isDirty ? 'Sim' : 'Não'} (correto: Não)`);
  console.log('');

  // Teste 7: Sync Service - Atualização de campo
  console.log('📝 Teste 7: Sync Service - Atualização de campo');
  AudespSyncService.updateField('descritor.municipio', 'Rio de Janeiro');
  const updatedState = AudespSyncService.getState();
  console.log(`  Campo atualizado: ${AudespSyncService.getField('descritor.municipio') === 'Rio de Janeiro' ? '✅' : '❌'}`);
  console.log(`  Dirty flag: ${updatedState.isDirty ? 'Sim' : 'Não'} (correto: Sim)`);
  console.log(`  Mudanças rastreadas: ${updatedState.changes.length}`);
  console.log('');

  // Teste 8: Sync Service - Adição de item
  console.log('➕ Teste 8: Sync Service - Adição de item');
  const novoEmpregado = {
    cpf: '98765432101',
    cbo: '2391-05',
    nome: 'Maria Santos',
    salario_contratual: 2500.00,
    periodos_remuneracao: []
  };
  AudespSyncService.addItem('relacao_empregados', novoEmpregado);
  const empregados = AudespSyncService.getField('relacao_empregados') || [];
  console.log(`  Item adicionado: ${empregados.length > 0 ? '✅' : '❌'}`);
  console.log(`  Total de empregados: ${empregados.length}`);
  console.log('');

  // Teste 9: Sync Service - Undo
  console.log('↶ Teste 9: Sync Service - Undo');
  const changesBefore = AudespSyncService.getChanges().length;
  AudespSyncService.undo();
  const changesAfter = AudespSyncService.getChanges().length;
  console.log(`  Mudanças antes: ${changesBefore}`);
  console.log(`  Mudanças depois: ${changesAfter}`);
  console.log(`  Status: ${changesAfter < changesBefore ? '✅' : '❌'}`);
  console.log('');

  // Teste 10: Diff entre JSONs
  console.log('🔄 Teste 10: Comparação de JSONs');
  const json1 = { descritor: { municipio: 'SP', ano: 2024 } };
  const json2 = { descritor: { municipio: 'RJ', ano: 2024 } };
  const diff = AudespJsonService.diff(json1, json2);
  console.log(`  Diferenças encontradas: ${diff.length}`);
  diff.forEach(d => {
    console.log(`    - ${d.path}: "${d.from}" → "${d.to}"`);
  });
  console.log('');

  console.log('✅ Todos os testes foram executados!\n');
};

// Executar testes
if (typeof window !== 'undefined') {
  (window as any).runAudespTests = runTests;
  console.log('💡 Execute "runAudespTests()" no console para rodar os testes');
}

export default runTests;
