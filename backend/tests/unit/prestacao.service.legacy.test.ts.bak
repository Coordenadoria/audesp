// tests/unit/prestacao.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PrestacaoService } from '../../src/services/PrestacaoService';
import { v4 as uuidv4 } from 'uuid';

describe('PrestacaoService', () => {
  let service: PrestacaoService;
  let usuarioId: string;

  beforeEach(() => {
    service = new PrestacaoService();
    usuarioId = uuidv4();
  });

  describe('create', () => {
    it('deve criar uma nova prestação', async () => {
      const input = {
        competencia: '2025-01-01',
      };

      const prestacao = await service.create(usuarioId, input);

      expect(prestacao).toBeDefined();
      expect(prestacao.id).toBeDefined();
      expect(prestacao.usuarioId).toBe(usuarioId);
      expect(prestacao.competencia).toBe('2025-01-01');
      expect(prestacao.status).toBe('rascunho');
      expect(prestacao.versao).toBe(1);
    });

    it('deve rejeitar competência em formato inválido', async () => {
      const input = {
        competencia: 'data-invalida',
      };

      await expect(service.create(usuarioId, input)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('deve obter uma prestação existente', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      const obtida = await service.getById(usuarioId, criada.id!);

      expect(obtida).toEqual(criada);
    });

    it('deve rejeitar acesso de outro usuário', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });
      const outroUsuario = uuidv4();

      await expect(service.getById(outroUsuario, criada.id!)).rejects.toThrow(
        'Sem permissão',
      );
    });

    it('deve rejeitar prestação não encontrada', async () => {
      await expect(service.getById(usuarioId, uuidv4())).rejects.toThrow(
        'não encontrada',
      );
    });
  });

  describe('list', () => {
    it('deve listar prestações do usuário', async () => {
      await service.create(usuarioId, { competencia: '2025-01-01' });
      await service.create(usuarioId, { competencia: '2025-02-01' });

      const resultado = await service.list(usuarioId, { skip: 0, take: 10 });

      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      const p1 = await service.create(usuarioId, { competencia: '2025-01-01' });
      await service.create(usuarioId, { competencia: '2025-02-01' });

      // Adicionar descritor e validar uma
      await service.update(usuarioId, p1.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
      await service.validate(usuarioId, p1.id!);

      const resultado = await service.list(usuarioId, {
        status: 'validado',
        skip: 0,
        take: 10,
      });

      expect(resultado.total).toBe(1);
      expect(resultado.data[0].status).toBe('validado');
    });

    it('deve aplicar paginação', async () => {
      for (let i = 0; i < 15; i++) {
        await service.create(usuarioId, { competencia: `2025-${String(i + 1).padStart(2, '0')}-01` });
      }

      const resultado = await service.list(usuarioId, { skip: 0, take: 10 });

      expect(resultado.total).toBe(15);
      expect(resultado.data).toHaveLength(10);
    });

    it('deve não listar prestações deletadas', async () => {
      const p1 = await service.create(usuarioId, { competencia: '2025-01-01' });
      await service.create(usuarioId, { competencia: '2025-02-01' });

      await service.delete(usuarioId, p1.id!);

      const resultado = await service.list(usuarioId, { skip: 0, take: 10 });

      expect(resultado.total).toBe(1);
    });
  });

  describe('update', () => {
    it('deve atualizar prestação', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      const atualizada = await service.update(usuarioId, criada.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });

      expect(atualizada.descritor?.numero).toBe('PREST-001');
      expect(atualizada.versao).toBe(2);
      expect(atualizada.status).toBe('rascunho');
    });

    it('deve rejeitar update de prestação enviada', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      // Preparar para envio
      await service.update(usuarioId, criada.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
      await service.validate(usuarioId, criada.id!);
      await service.send(usuarioId, criada.id!);

      // Tentar atualizar prestação enviada deve falhar
      await expect(
        service.update(usuarioId, criada.id!, { saldoInicial: 2000 }),
      ).rejects.toThrow('enviadas');
    });
  });

  describe('delete', () => {
    it('deve deletar prestação (soft delete)', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await service.delete(usuarioId, criada.id!);

      await expect(service.getById(usuarioId, criada.id!)).rejects.toThrow(
        'deletada',
      );
    });

    it('deve rejeitar delete de prestação enviada', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      // Preparar para envio
      await service.update(usuarioId, criada.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });
      await service.validate(usuarioId, criada.id!);
      await service.send(usuarioId, criada.id!);

      // Tentar deletar prestação enviada deve falhar
      await expect(service.delete(usuarioId, criada.id!)).rejects.toThrow(
        'enviadas',
      );
    });
  });

  describe('validate', () => {
    it('deve validar prestação', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await service.update(usuarioId, criada.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });

      const validada = await service.validate(usuarioId, criada.id!);

      expect(validada.status).toBe('validado');
      expect(validada.validadoEm).toBeDefined();
    });

    it('deve rejeitar validação sem descritor', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await expect(service.validate(usuarioId, criada.id!)).rejects.toThrow(
        'Descritor é obrigatório',
      );
    });
  });

  describe('send', () => {
    it('deve enviar prestação validada', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await service.update(usuarioId, criada.id!, {
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      });

      await service.validate(usuarioId, criada.id!);

      const enviada = await service.send(usuarioId, criada.id!);

      expect(enviada.status).toBe('enviado');
      expect(enviada.enviadoEm).toBeDefined();
    });

    it('deve rejeitar envio de prestação não validada', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await expect(service.send(usuarioId, criada.id!)).rejects.toThrow(
        'validadas',
      );
    });
  });

  describe('getHistory e restoreVersion', () => {
    it('deve obter histórico de versões', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await service.update(usuarioId, criada.id!, { saldoInicial: 1000 });
      await service.update(usuarioId, criada.id!, { saldoFinal: 500 });

      const historico = await service.getHistory(usuarioId, criada.id!);

      expect(historico).toHaveLength(3);
      expect(historico[0].versao).toBe(3);
      expect(historico[1].versao).toBe(2);
      expect(historico[2].versao).toBe(1);
    });

    it('deve restaurar versão anterior', async () => {
      const criada = await service.create(usuarioId, { competencia: '2025-01-01' });

      await service.update(usuarioId, criada.id!, { saldoInicial: 1000 });
      const v2 = await service.getById(usuarioId, criada.id!);

      await service.update(usuarioId, criada.id!, { saldoFinal: 500 });

      const restaurada = await service.restoreVersion(usuarioId, criada.id!, v2.versao!);

      expect(restaurada.versao).toBe(4);
      expect(restaurada.saldoInicial).toBe(1000);
      expect(restaurada.saldoFinal).toBeUndefined();
    });
  });
});
