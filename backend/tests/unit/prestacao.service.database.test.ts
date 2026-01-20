// tests/unit/prestacao.service.database.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import 'reflect-metadata';
import { AppDataSource, initializeDatabase, disconnectDatabase } from '../../src/config/database';
import { PrestacaoService, CreatePrestacaoDto } from '../../src/services/PrestacaoService';
import { User, UserRole } from '../../src/entities/User';
import { hashPassword } from '../../src/utils/password';

/**
 * Database-backed PrestacaoService tests
 * These tests validate the new database layer functionality
 */
describe('PrestacaoService (Database)', () => {
  let prestacaoService: PrestacaoService;
  let testUser: User;

  beforeAll(async () => {
    await initializeDatabase();
    prestacaoService = new PrestacaoService();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    const userRepository = AppDataSource.getRepository(User);
    const hashedPassword = await hashPassword('test123');
    const uniqueCPF = String(Date.now()).slice(-11).padStart(11, '1');

    testUser = await userRepository.save({
      email: `test-db-${Date.now()}@example.com`,
      password: hashedPassword,
      nome: 'Test User',
      cpf: uniqueCPF,
      role: UserRole.GESTOR,
    });
  });

  describe('createPrestacao', () => {
    it('deve criar uma nova prestação com dados válidos', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-NEW-001',
        competencia: '2025-02',
        nomeGestor: 'João Silva',
        cpfGestor: '12345678901',
        usuarioCriadorId: testUser.id,
      };

      const prestacao = await prestacaoService.createPrestacao(data);

      expect(prestacao).toBeDefined();
      expect(prestacao.id).toBeDefined();
      expect(prestacao.numero).toBe('PREST-NEW-001');
      expect(prestacao.competencia).toBe('2025-02');
      expect(prestacao.usuarioCriadorId).toBe(testUser.id);
    });

    it('deve ser criada em status RASCUNHO', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-STATUS-001',
        competencia: '2025-03',
        usuarioCriadorId: testUser.id,
      };

      const prestacao = await prestacaoService.createPrestacao(data);

      expect(prestacao.status).toBe('rascunho');
    });
  });

  describe('getPrestacaoById', () => {
    it('deve recuperar prestação por ID', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-GET-001',
        competencia: '2025-04',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      const obtida = await prestacaoService.getPrestacaoById(criada.id);

      expect(obtida).toBeDefined();
      expect(obtida?.id).toBe(criada.id);
      expect(obtida?.numero).toBe('PREST-GET-001');
    });

    it('deve retornar null para ID inexistente', async () => {
      const obtida = await prestacaoService.getPrestacaoById('00000000-0000-0000-0000-000000000000');

      expect(obtida).toBeNull();
    });
  });

  describe('listPrestacoes', () => {
    it('deve listar prestações do usuário', async () => {
      const data1: CreatePrestacaoDto = {
        numero: 'PREST-LIST-001',
        competencia: '2025-05',
        usuarioCriadorId: testUser.id,
      };

      const data2: CreatePrestacaoDto = {
        numero: 'PREST-LIST-002',
        competencia: '2025-06',
        usuarioCriadorId: testUser.id,
      };

      await prestacaoService.createPrestacao(data1);
      await prestacaoService.createPrestacao(data2);

      const { prestacoes, total } = await prestacaoService.listPrestacoes({
        usuarioCriadorId: testUser.id,
      });

      expect(prestacoes.length).toBeGreaterThanOrEqual(2);
      expect(total).toBeGreaterThanOrEqual(2);
    });

    it('deve suportar paginação', async () => {
      const { prestacoes, total } = await prestacaoService.listPrestacoes({
        page: 1,
        limit: 5,
      });

      expect(prestacoes.length).toBeLessThanOrEqual(5);
      expect(total).toBeDefined();
    });
  });

  describe('updatePrestacao', () => {
    it('deve atualizar prestação existente', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-UPDATE-001',
        competencia: '2025-07',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      const atualizada = await prestacaoService.updatePrestacao(criada.id, {
        nomeGestor: 'Maria Silva',
      });

      expect(atualizada.nomeGestor).toBe('Maria Silva');
      expect(atualizada.numero).toBe('PREST-UPDATE-001');
    });
  });

  describe('deletePrestacao', () => {
    it('deve deletar prestação existente', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-DELETE-001',
        competencia: '2025-08',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      await prestacaoService.deletePrestacao(criada.id);

      const deletada = await prestacaoService.getPrestacaoById(criada.id);

      expect(deletada).toBeNull();
    });
  });

  describe('updateValidationStatus', () => {
    it('deve atualizar status de validação', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-VALID-001',
        competencia: '2025-09',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      const validada = await prestacaoService.updateValidationStatus(criada.id, true, []);

      expect(validada.validado).toBe(true);
    });

    it('deve registrar erros de validação', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-VALID-002',
        competencia: '2025-10',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      const erros = ['Erro 1', 'Erro 2'];
      
      const validada = await prestacaoService.updateValidationStatus(criada.id, false, erros);

      expect(validada.validado).toBe(false);
      const validacaoErros = JSON.parse(validada.validacaoErros || '[]');
      expect(validacaoErros.length).toBeGreaterThan(0);
    });
  });

  describe('updateFinancialTotals', () => {
    it('deve atualizar totais financeiros', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-FIN-001',
        competencia: '2025-11',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      const atualizada = await prestacaoService.updateFinancialTotals(criada.id, {
        saldoInicial: 5000,
        totalReceitas: 3000,
        totalDespesas: 1500,
        saldoFinal: 6500,
      });

      expect(Number(atualizada.saldoInicial)).toBe(5000);
      expect(Number(atualizada.totalReceitas)).toBe(3000);
    });
  });

  describe('getFinancialSummary', () => {
    it('deve retornar resumo financeiro', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-SUM-001',
        competencia: '2025-12',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      await prestacaoService.updateFinancialTotals(criada.id, {
        saldoInicial: 1000,
        totalReceitas: 500,
      });

      const summary = await prestacaoService.getFinancialSummary(criada.id);

      expect(summary).toBeDefined();
      expect(Number(summary!.saldoInicial)).toBe(1000);
    });
  });

  describe('updateLGPDConsent', () => {
    it('deve atualizar consentimento LGPD', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-LGPD-001',
        competencia: '2025-12',
        usuarioCriadorId: testUser.id,
      };

      const criada = await prestacaoService.createPrestacao(data);
      
      const atualizada = await prestacaoService.updateLGPDConsent(criada.id, true);

      expect(atualizada.consentimentoLGPD).toBe(true);
    });
  });
});
