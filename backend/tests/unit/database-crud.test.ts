// backend/tests/unit/database-crud.test.ts
import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource, initializeDatabase, disconnectDatabase } from '../../src/config/database';
import { User, UserRole } from '../../src/entities/User';
import { Prestacao, PrestacaoStatus } from '../../src/entities/Prestacao';
import { PrestacaoService, CreatePrestacaoDto } from '../../src/services/PrestacaoService';
import { hashPassword } from '../../src/utils/password';

describe('Database CRUD Operations', () => {
  let prestacaoService: PrestacaoService;
  let testUser: User;

  beforeAll(async () => {
    // Initialize database
    await initializeDatabase();
    prestacaoService = new PrestacaoService();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Create a test user for each test with unique CPF
    const userRepository = AppDataSource.getRepository(User);
    const hashedPassword = await hashPassword('test123');
    const uniqueCPF = String(Date.now()).slice(-11).padStart(11, '1'); // Generate unique CPF

    testUser = await userRepository.save({
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      nome: 'Test User',
      cpf: uniqueCPF,
      role: UserRole.GESTOR,
    });
  });

  describe('Prestação CRUD', () => {
    it('should create a new prestação', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-2025-001',
        competencia: '2025-01',
        nomeGestor: 'João Silva',
        cpfGestor: '12345678901',
        usuarioCriadorId: testUser.id,
      };

      const prestacao = await prestacaoService.createPrestacao(data);

      expect(prestacao).toBeDefined();
      expect(prestacao.id).toBeDefined();
      expect(prestacao.numero).toBe('PREST-2025-001');
      expect(prestacao.competencia).toBe('2025-01');
      expect(prestacao.status).toBe(PrestacaoStatus.RASCUNHO);
    });

    it('should retrieve prestação by ID', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-2025-002',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const retrieved = await prestacaoService.getPrestacaoById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.numero).toBe('PREST-2025-002');
    });

    it('should list prestações with pagination', async () => {
      // Create multiple prestações
      for (let i = 0; i < 3; i++) {
        await prestacaoService.createPrestacao({
          numero: `PREST-LIST-${i}`,
          competencia: '2025-01',
          usuarioCriadorId: testUser.id,
        });
      }

      const result = await prestacaoService.listPrestacoes({
        usuarioCriadorId: testUser.id,
        page: 1,
        limit: 2,
      });

      expect(result.prestacoes.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should update prestação', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-2025-UPDATE',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const updated = await prestacaoService.updatePrestacao(created.id, {
        status: PrestacaoStatus.ENVIADA,
        saldoInicial: 1000,
      });

      expect(updated.status).toBe(PrestacaoStatus.ENVIADA);
      expect(updated.saldoInicial).toBe(1000);
    });

    it('should delete prestação', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-2025-DELETE',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      await prestacaoService.deletePrestacao(created.id);

      const retrieved = await prestacaoService.getPrestacaoById(created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Prestação Validation Status', () => {
    it('should update validation status with errors', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-VALID-1',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const errors = [
        {
          layer: 'Type Validation',
          code: 'INVALID_TYPE',
          message: 'Invalid type',
        },
      ];

      const updated = await prestacaoService.updateValidationStatus(created.id, false, errors);

      expect(updated.validado).toBe(false);
      expect(updated.dataValidacao).toBeDefined();
      expect(updated.validacaoErros).toBeDefined();
    });

    it('should update validation status as valid', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-VALID-2',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const updated = await prestacaoService.updateValidationStatus(created.id, true);

      expect(updated.validado).toBe(true);
      expect(updated.dataValidacao).toBeDefined();
    });
  });

  describe('Prestação Financial Management', () => {
    it('should get financial summary', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-FIN-1',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      await prestacaoService.updateFinancialTotals(created.id, {
        saldoInicial: 1000,
        totalReceitas: 500,
        totalDespesas: 300,
        saldoFinal: 1200,
      });

      const summary = await prestacaoService.getFinancialSummary(created.id);

      expect(summary).toBeDefined();
      expect(Number(summary!.saldoInicial)).toBe(1000);
      expect(Number(summary!.totalReceitas)).toBe(500);
    });

    it('should update financial totals', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-FIN-2',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const updated = await prestacaoService.updateFinancialTotals(created.id, {
        saldoInicial: 5000,
        totalPagamentos: 1000,
        saldoFinal: 4000,
      });

      expect(updated.saldoInicial).toBe(5000);
      expect(updated.totalPagamentos).toBe(1000);
      expect(updated.saldoFinal).toBe(4000);
    });
  });

  describe('LGPD Compliance', () => {
    it('should update LGPD consent', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-LGPD-1',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const updated = await prestacaoService.updateLGPDConsent(created.id, true);

      expect(updated.consentimentoLGPD).toBe(true);
      expect(updated.dataConsentimentoLGPD).toBeDefined();
    });
  });

  describe('Prestação Summary', () => {
    it('should get prestação summary with related entities', async () => {
      const data: CreatePrestacaoDto = {
        numero: 'PREST-SUM-1',
        competencia: '2025-01',
        usuarioCriadorId: testUser.id,
      };

      const created = await prestacaoService.createPrestacao(data);
      const summary = await prestacaoService.getSummary(created.id);

      expect(summary).toBeDefined();
      expect(summary!.id).toBe(created.id);
      expect(summary!.numero).toBe('PREST-SUM-1');
      expect(summary!.totalDocumentos).toBe(0);
      expect(summary!.totalPagamentos).toBe(0);
      expect(summary!.totalResponsaveis).toBe(0);
      expect(summary!.totalContratos).toBe(0);
    });
  });
});
