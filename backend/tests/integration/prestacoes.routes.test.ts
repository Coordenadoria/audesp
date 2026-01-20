// tests/integration/prestacoes.routes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { AuthService } from '../../src/services/AuthService';
import { PrestacaoService } from '../../src/services/PrestacaoService';

describe('Prestacoes Routes', () => {
  let token: string;
  let usuarioId: string;

  beforeEach(async () => {
    // Criar usuário e obter token
    const resultado = await AuthService.getInstance().register({
      email: `test-${Date.now()}@test.com`,
      cpf: '12345678901',
      senha: 'Senha123!@#',
    });

    usuarioId = resultado.usuario.id;
    token = resultado.token;
  });

  describe('POST /api/prestacoes', () => {
    it('deve criar nova prestação com auth', async () => {
      const res = await request(app)
        .post('/api/prestacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          competencia: '2025-01-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.competencia).toBe('2025-01-01');
      expect(res.body.data.status).toBe('rascunho');
    });

    it('deve rejeitar sem token', async () => {
      const res = await request(app)
        .post('/api/prestacoes')
        .send({
          competencia: '2025-01-01',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('deve rejeitar competência em formato inválido', async () => {
      const res = await request(app)
        .post('/api/prestacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          competencia: 'data-invalida',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/prestacoes', () => {
    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      await service.create(usuarioId, { competencia: '2025-01-01' });
      await service.create(usuarioId, { competencia: '2025-02-01' });
    });

    it('deve listar prestações com auth', async () => {
      const res = await request(app)
        .get('/api/prestacoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.data).toHaveLength(2);
    });

    it('deve rejeitar sem token', async () => {
      const res = await request(app).get('/api/prestacoes');

      expect(res.status).toBe(401);
    });

    it('deve filtrar por status', async () => {
      const service = PrestacaoService.getInstance();
      const primeira = await service.list(usuarioId, { skip: 0, take: 1 });
      await service.validate(usuarioId, primeira.data[0].id!);

      const res = await request(app)
        .get('/api/prestacoes?status=validado')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.data[0].status).toBe('validado');
    });

    it('deve aplicar paginação', async () => {
      const res = await request(app)
        .get('/api/prestacoes?skip=0&take=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
    });
  });

  describe('GET /api/prestacoes/:id', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;
    });

    it('deve obter prestação específica', async () => {
      const res = await request(app)
        .get(`/api/prestacoes/${prestacaoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(prestacaoId);
    });

    it('deve rejeitar sem token', async () => {
      const res = await request(app).get(`/api/prestacoes/${prestacaoId}`);

      expect(res.status).toBe(401);
    });

    it('deve retornar 404 para prestação não encontrada', async () => {
      const res = await request(app)
        .get('/api/prestacoes/id-inexistente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/prestacoes/:id', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;
    });

    it('deve atualizar prestação', async () => {
      const res = await request(app)
        .patch(`/api/prestacoes/${prestacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          saldoInicial: 1000,
          saldoFinal: 500,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.saldoInicial).toBe(1000);
      expect(res.body.data.saldoFinal).toBe(500);
      expect(res.body.data.versao).toBe(2);
    });

    it('deve rejeitar update sem token', async () => {
      const res = await request(app)
        .patch(`/api/prestacoes/${prestacaoId}`)
        .send({ saldoInicial: 1000 });

      expect(res.status).toBe(401);
    });

    it('deve rejeitar update de prestação enviada', async () => {
      const service = PrestacaoService.getInstance();

      // Preparar e enviar
      await service.update(usuarioId, prestacaoId, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
      await service.validate(usuarioId, prestacaoId);
      await service.send(usuarioId, prestacaoId);

      const res = await request(app)
        .patch(`/api/prestacoes/${prestacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ saldoInicial: 2000 });

      expect(res.status).toBe(410);
    });
  });

  describe('DELETE /api/prestacoes/:id', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;
    });

    it('deve deletar prestação (soft delete)', async () => {
      const res = await request(app)
        .delete(`/api/prestacoes/${prestacaoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      // Verificar que foi deletada
      const getRes = await request(app)
        .get(`/api/prestacoes/${prestacaoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(410);
    });

    it('deve rejeitar delete sem token', async () => {
      const res = await request(app).delete(`/api/prestacoes/${prestacaoId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/prestacoes/:id/history', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;

      await service.update(usuarioId, prestacaoId, { saldoInicial: 1000 });
      await service.update(usuarioId, prestacaoId, { saldoFinal: 500 });
    });

    it('deve obter histórico de versões', async () => {
      const res = await request(app)
        .get(`/api/prestacoes/${prestacaoId}/history`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].versao).toBe(3);
      expect(res.body.data[2].versao).toBe(1);
    });

    it('deve rejeitar sem token', async () => {
      const res = await request(app).get(`/api/prestacoes/${prestacaoId}/history`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/prestacoes/:id/restore', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;

      await service.update(usuarioId, prestacaoId, { saldoInicial: 1000 });
      await service.update(usuarioId, prestacaoId, { saldoFinal: 500 });
    });

    it('deve restaurar versão anterior', async () => {
      const res = await request(app)
        .post(`/api/prestacoes/${prestacaoId}/restore`)
        .set('Authorization', `Bearer ${token}`)
        .send({ versao: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.versao).toBe(4);
      expect(res.body.data.saldoInicial).toBe(1000);
    });

    it('deve rejeitar versão inexistente', async () => {
      const res = await request(app)
        .post(`/api/prestacoes/${prestacaoId}/restore`)
        .set('Authorization', `Bearer ${token}`)
        .send({ versao: 99 });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/prestacoes/:id/validate', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;

      await service.update(usuarioId, prestacaoId, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
    });

    it('deve validar prestação', async () => {
      const res = await request(app)
        .post(`/api/prestacoes/${prestacaoId}/validate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('validado');
      expect(res.body.data.validadoEm).toBeDefined();
    });

    it('deve rejeitar validação sem descritor', async () => {
      const service = PrestacaoService.getInstance();
      const prestacao2 = await service.create(usuarioId, { competencia: '2025-02-01' });

      const res = await request(app)
        .post(`/api/prestacoes/${prestacao2.id}/validate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/prestacoes/:id/send', () => {
    let prestacaoId: string;

    beforeEach(async () => {
      const service = PrestacaoService.getInstance();
      const prestacao = await service.create(usuarioId, { competencia: '2025-01-01' });
      prestacaoId = prestacao.id!;

      await service.update(usuarioId, prestacaoId, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
      await service.validate(usuarioId, prestacaoId);
    });

    it('deve enviar prestação validada', async () => {
      const res = await request(app)
        .post(`/api/prestacoes/${prestacaoId}/send`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('enviado');
      expect(res.body.data.enviadoEm).toBeDefined();
    });

    it('deve rejeitar envio de prestação não validada', async () => {
      const service = PrestacaoService.getInstance();
      const prestacao2 = await service.create(usuarioId, { competencia: '2025-02-01' });

      const res = await request(app)
        .post(`/api/prestacoes/${prestacao2.id}/send`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
