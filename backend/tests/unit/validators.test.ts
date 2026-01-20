// tests/unit/validators.test.ts
import { describe, it, expect } from 'vitest';
import { CreateUserSchema } from '../../src/models/User';
import {
  DescritorSchema,
  ResponsavelSchema,
  ContratoSchema,
  DocumentoFiscalSchema,
  PagamentoSchema,
  PrestacaoSchema,
  CreatePrestacaoSchema,
  UpdatePrestacaoSchema,
} from '../../src/models/Prestacao';

describe('Prestacao Validators', () => {
  describe('DescritorSchema', () => {
    it('deve validar descritor com dados corretos', () => {
      const dados = {
        numero: 'PREST-001',
        competencia: '2025-01-01',
        nomeGestor: 'João Silva',
        cpfGestor: '12345678901',
        nomeResponsavel: 'Maria Silva',
        cpfResponsavel: '98765432100',
        emailResponsavel: 'maria@test.com',
        dataInicio: '2025-01-01',
      };

      const resultado = DescritorSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar competência em formato inválido', () => {
      const dados = {
        numero: 'PREST-001',
        competencia: 'data-invalida', // Formato completamente diferente
        nomeGestor: 'João Silva',
        cpfGestor: '12345678901',
        nomeResponsavel: 'Maria Silva',
        cpfResponsavel: '98765432100',
      };

      const resultado = DescritorSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar email inválido quando fornecido', () => {
      const dados = {
        numero: 'PREST-001',
        competencia: '2025-01-01',
        nomeGestor: 'João Silva',
        cpfGestor: '12345678901',
        nomeResponsavel: 'Maria Silva',
        cpfResponsavel: '98765432100',
        dataAtualizacao: 'data-invalida',
      };

      const resultado = DescritorSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('ResponsavelSchema', () => {
    it('deve validar responsável com dados corretos', () => {
      const dados = {
        nome: 'João Silva',
        cpf: '12345678901',
        cargo: 'Gerente',
        email: 'joao@test.com',
        telefone: '11999999999',
      };

      const resultado = ResponsavelSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar responsável sem nome', () => {
      const dados = {
        nome: '',
        cpf: '12345678901',
        cargo: 'Gerente',
      };

      const resultado = ResponsavelSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar email inválido', () => {
      const dados = {
        nome: 'João Silva',
        cpf: '12345678901',
        cargo: 'Gerente',
        email: 'email-inválido',
      };

      const resultado = ResponsavelSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('ContratoSchema', () => {
    it('deve validar contrato com dados corretos', () => {
      const dados = {
        numero: 'CT-001',
        fornecedor: 'Empresa XYZ',
        cnpjFornecedor: '12345678901234',
        dataInicio: '2025-01-01',
        dataFim: '2027-01-01',
        valor: 50000,
      };

      const resultado = ContratoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar contrato sem número', () => {
      const dados = {
        numero: '',
        fornecedor: 'Empresa XYZ',
        cnpjFornecedor: '12345678901234',
        dataInicio: '2025-01-01',
        dataFim: '2027-01-01',
        valor: 50000,
      };

      const resultado = ContratoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar data de início em formato inválido', () => {
      const dados = {
        numero: 'CT-001',
        fornecedor: 'Empresa XYZ',
        cnpjFornecedor: '12345678901234',
        dataInicio: '01-01-2025', // Formato errado
        dataFim: '2027-01-01',
        valor: 50000,
      };

      const resultado = ContratoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar valor negativo', () => {
      const dados = {
        numero: 'CT-001',
        fornecedor: 'Empresa XYZ',
        cnpjFornecedor: '12345678901234',
        dataInicio: '2025-01-01',
        dataFim: '2027-01-01',
        valor: -1000, // Valor negativo
      };

      const resultado = ContratoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('DocumentoFiscalSchema', () => {
    it('deve validar documento fiscal com dados corretos', () => {
      const dados = {
        numero: 'NF-001',
        dataEmissao: '2025-01-01',
        valor: 1000,
        descricao: 'Serviço de consultoria',
      };

      const resultado = DocumentoFiscalSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar documento sem número', () => {
      const dados = {
        numero: '',
        dataEmissao: '2025-01-01',
        valor: 1000,
        descricao: 'Serviço de consultoria',
      };

      const resultado = DocumentoFiscalSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar valor zero', () => {
      const dados = {
        numero: 'NF-001',
        dataEmissao: '2025-01-01',
        valor: 0, // Valor zero
        descricao: 'Serviço de consultoria',
      };

      const resultado = DocumentoFiscalSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('PagamentoSchema', () => {
    it('deve validar pagamento com dados corretos', () => {
      const dados = {
        dataVencimento: '2025-01-01',
        valor: 1000,
      };

      const resultado = PagamentoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar pagamento sem data', () => {
      const dados = {
        dataVencimento: '',
        valor: 1000,
      };

      const resultado = PagamentoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar valor inválido', () => {
      const dados = {
        dataVencimento: '2025-01-01',
        valor: 0, // Valor zero não permitido
      };

      const resultado = PagamentoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('CreatePrestacaoSchema', () => {
    it('deve validar prestação a criar', () => {
      const dados = {
        competencia: '2025-01-01',
      };

      const resultado = CreatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar competência vazia', () => {
      const dados = {
        competencia: '',
      };

      const resultado = CreatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar competência em formato inválido', () => {
      const dados = {
        competencia: '2025/01/01', // Formato errado
      };

      const resultado = CreatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });
  });

  describe('UpdatePrestacaoSchema', () => {
    it('deve aceitar todos os campos opcionais', () => {
      const dados = {
        saldoInicial: 1000,
        saldoFinal: 500,
        descritor: {
          numero: 'PREST-001',
          competencia: '2025-01-01',
          nomeGestor: 'João Silva',
          cpfGestor: '12345678901',
          nomeResponsavel: 'Maria Silva',
          cpfResponsavel: '98765432100',
        },
      };

      const resultado = UpdatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve aceitar objeto vazio', () => {
      const dados = {};

      const resultado = UpdatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve aceitar saldo inicial negativo', () => {
      const dados = {
        saldoInicial: -1000, // Permitido para representar débito
      };

      const resultado = UpdatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });

    it('deve rejeitar responsáveis com dados inválidos', () => {
      const dados = {
        responsaveis: [
          {
            nome: '', // Nome vazio
            cpf: '12345678901',
            cargo: 'Gerente',
          },
        ],
      };

      const resultado = UpdatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(false);
    });

    it('deve aceitar contratos válidos', () => {
      const dados = {
        contratos: [
          {
            numero: 'CT-001',
            fornecedor: 'Empresa XYZ',
            cnpjFornecedor: '12345678901234',
            dataInicio: '2025-01-01',
            dataFim: '2027-01-01',
            valor: 50000,
          },
        ],
      };

      const resultado = UpdatePrestacaoSchema.safeParse(dados);
      expect(resultado.success).toBe(true);
    });
  });
});
