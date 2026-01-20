// backend/tests/unit/validation-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import ValidationService from '../../src/services/ValidationService';
import { v4 as uuidv4 } from 'uuid';

describe('ValidationService - 7 Layer Validation', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = ValidationService;
  });

  describe('Layer 1: Type Validation', () => {
    it('deve aceitar tipos válidos', async () => {
      const prestacao = {
        id: uuidv4(),
        competencia: '2025-01-01',
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria',
          cpfResponsavel: '98765432100',
        },
        saldoInicial: 1000,
        saldoFinal: 500,
        responsaveis: [],
        contratos: [],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar saldoInicial com tipo inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        saldoInicial: 'não é número', // Invalid
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.layer === 'Type Validation')).toBe(true);
    });

    it('deve rejeitar responsáveis que não é array', async () => {
      const prestacao = {
        id: uuidv4(),
        responsaveis: 'não é array', // Invalid
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_TYPE')).toBe(true);
    });
  });

  describe('Layer 2: Enum Validation', () => {
    it('deve aceitar status válidos', async () => {
      const prestacao = {
        id: uuidv4(),
        status: 'rascunho',
      };

      const resultado = await service.validate(prestacao);
      // Status válido não causa erro nesta camada
      expect(resultado.erros.filter((e) => e.code === 'INVALID_ENUM')).toHaveLength(0);
    });

    it('deve rejeitar status inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        status: 'status-invalido',
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_ENUM')).toBe(true);
    });

    it('deve rejeitar tipo de documento inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        contratos: [
          {
            numero: 'CT-001',
            tipo: 'TIPO-INVALIDO', // Invalid
          },
        ],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_ENUM')).toBe(true);
    });

    it('deve rejeitar status de pagamento inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        pagamentos: [
          {
            dataVencimento: '2025-01-01',
            valor: 100,
            status: 'INVALIDO', // Invalid
          },
        ],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_ENUM')).toBe(true);
    });
  });

  describe('Layer 3: Regex Patterns', () => {
    it('deve rejeitar CPF com formato inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          cpfGestor: '123', // Invalid format
        },
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_CPF')).toBe(true);
    });

    it('deve rejeitar CNPJ com formato inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        contratos: [
          {
            cnpjFornecedor: '123', // Invalid format
          },
        ],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_CNPJ')).toBe(true);
    });

    it('deve rejeitar email com formato inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          emailResponsavel: 'email-invalido', // Invalid format
        },
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_EMAIL')).toBe(true);
    });

    it('deve rejeitar data com formato inválido', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          competencia: '2025/01/01', // Invalid format
        },
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_DATE')).toBe(true);
    });

    it('deve aceitar data com formato correto', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          competencia: '2025-01-01', // Valid format
        },
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.erros.filter((e) => e.code === 'INVALID_DATE')).toHaveLength(0);
    });
  });

  describe('Layer 4: Accounting Rules', () => {
    it('deve aceitar saldo balanceado', async () => {
      const prestacao = {
        id: uuidv4(),
        saldoInicial: 1000,
        saldoFinal: 700,
        pagamentos: [{ valor: 300 }],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.erros.filter((e) => e.code === 'INVALID_BALANCE')).toHaveLength(0);
    });

    it('deve rejeitar saldo não balanceado', async () => {
      const prestacao = {
        id: uuidv4(),
        saldoInicial: 1000,
        saldoFinal: 500, // Esperado: 700
        pagamentos: [{ valor: 300 }],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_BALANCE')).toBe(true);
    });

    it('deve avisar sobre saldo inicial negativo', async () => {
      const prestacao = {
        id: uuidv4(),
        saldoInicial: -1000, // Negativo (débito)
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.avisos.some((a) => a.code === 'NEGATIVE_BALANCE')).toBe(true);
    });
  });

  describe('Layer 5: Referential Integrity', () => {
    it('deve aceitar referências válidas', async () => {
      const prestacao = {
        id: uuidv4(),
        contratos: [{ numero: 'CT-001' }],
        documentosFiscais: [{ numero: 'NF-001', numeroContrato: 'CT-001' }],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.erros.filter((e) => e.code === 'INVALID_REFERENCE')).toHaveLength(0);
    });

    it('deve rejeitar documento fiscal referenciando contrato inexistente', async () => {
      const prestacao = {
        id: uuidv4(),
        contratos: [{ numero: 'CT-001' }],
        documentosFiscais: [{ numero: 'NF-001', numeroContrato: 'CT-999' }], // CT-999 não existe
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_REFERENCE')).toBe(true);
    });

    it('deve rejeitar pagamento referenciando documento inexistente', async () => {
      const prestacao = {
        id: uuidv4(),
        documentosFiscais: [{ numero: 'NF-001' }],
        pagamentos: [{ dataVencimento: '2025-01-01', valor: 100, numeroDocumento: 'NF-999' }], // NF-999 não existe
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'INVALID_REFERENCE')).toBe(true);
    });
  });

  describe('Layer 6: TCE-SP Conformance', () => {
    it('deve rejeitar prestação sem descritor', async () => {
      const prestacao = {
        id: uuidv4(),
        // Sem descritor
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.code === 'MISSING_REQUIRED')).toBe(true);
    });

    it('deve rejeitar descritor sem campos obrigatórios', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          numero: 'PREST-001',
          // Faltam campos obrigatórios
        },
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.filter((e) => e.code === 'MISSING_REQUIRED').length).toBeGreaterThan(0);
    });

    it('deve avisar sobre falta de responsáveis', async () => {
      const prestacao = {
        id: uuidv4(),
        responsaveis: [],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.avisos.length).toBeGreaterThan(0);
    });

    it('deve avisar sobre falta de saldo inicial', async () => {
      const prestacao = {
        id: uuidv4(),
        // Sem saldoInicial
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.avisos.length).toBeGreaterThan(0);
    });
  });

  describe('Layer 7: LGPD Compliance', () => {
    it('deve logar quando há PII (CPF)', async () => {
      const prestacao = {
        id: uuidv4(),
        descritor: {
          cpfGestor: '12345678901', // PII
        },
      };

      // Não deve lançar erro, apenas avisar
      const resultado = await service.validate(prestacao);
      // A validação LGPD não deve causar erro neste estágio
      expect(resultado.erros.filter((e) => e.layer === 'LGPD Compliance')).toHaveLength(0);
    });
  });

  describe('Complete Prestacao Validation', () => {
    it('deve validar prestação completa válida', async () => {
      const prestacao = {
        id: uuidv4(),
        competencia: '2025-01-01',
        status: 'rascunho',
        saldoInicial: 5000,
        saldoFinal: 2500,
        descritor: {
          numero: 'PREST-2025-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
          emailResponsavel: 'maria@example.com',
        },
        responsaveis: [
          {
            nome: 'João Silva',
            cpf: '12345678901',
            cargo: 'Gestor',
            email: 'joao@example.com',
          },
        ],
        contratos: [
          {
            numero: 'CT-001',
            fornecedor: 'Empresa XYZ',
            cnpjFornecedor: '12345678901234',
            dataInicio: '2025-01-01',
            dataFim: '2025-12-31',
            valor: 2500,
          },
        ],
        documentosFiscais: [
          {
            numero: 'NF-001',
            dataEmissao: '2025-01-15',
            valor: 2500,
            tipo: 'NF',
            numeroContrato: 'CT-001',
          },
        ],
        pagamentos: [
          {
            dataVencimento: '2025-02-01',
            dataPagamento: '2025-02-01',
            valor: 2500,
            status: 'PAGO',
            numeroDocumento: 'NF-001',
          },
        ],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve capturar múltiplos erros de validação', async () => {
      const prestacao = {
        id: uuidv4(),
        status: 'status-invalido',
        saldoInicial: 'não é número',
        responsaveis: 'não é array',
        contratos: [
          {
            cnpjFornecedor: '123', // Formato inválido
          },
        ],
      };

      const resultado = await service.validate(prestacao);
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(1);
    });
  });
});
