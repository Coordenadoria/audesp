// src/services/PrestacaoService.ts
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';
import {
  Prestacao,
  CreatePrestacaoInput,
  UpdatePrestacaoInput,
  ListPrestacaoFilters,
  PrestacaoSchema,
  UpdatePrestacaoSchema,
} from '../models/Prestacao.js';

/**
 * Serviço de Prestações de Contas
 * Simula banco de dados em memória (será substituído por TypeORM em breve)
 */
export class PrestacaoService {
  // Simular banco de dados em memória
  private prestacoes: Map<string, Prestacao> = new Map();
  private versoes: Map<string, Prestacao[]> = new Map();

  /**
   * Criar nova prestação
   */
  async create(usuarioId: string, input: CreatePrestacaoInput): Promise<Prestacao> {
    try {
      const id = uuidv4();
      const agora = new Date().toISOString();

      const prestacao: Prestacao = {
        id,
        usuarioId,
        competencia: input.competencia,
        status: 'rascunho',
        versao: 1,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      // Validar
      const validado = PrestacaoSchema.parse(prestacao);

      // Armazenar
      this.prestacoes.set(id, validado);
      this.versoes.set(id, [validado]);

      logger.info(`Prestação criada: ${id} para usuário ${usuarioId}`);
      return validado;
    } catch (error) {
      logger.error(`Erro ao criar prestação: ${error}`);
      throw error;
    }
  }

  /**
   * Obter prestação por ID
   */
  async getById(usuarioId: string, prestacaoId: string): Promise<Prestacao> {
    const prestacao = this.prestacoes.get(prestacaoId);

    if (!prestacao) {
      throw new Error('Prestação não encontrada');
    }

    // Verificar permissão
    if (prestacao.usuarioId !== usuarioId) {
      throw new Error('Sem permissão para acessar esta prestação');
    }

    // Não retornar deletadas
    if (prestacao.deletadoEm) {
      throw new Error('Prestação foi deletada');
    }

    return prestacao;
  }

  /**
   * Listar prestações do usuário com filtros
   */
  async list(
    usuarioId: string,
    filters: ListPrestacaoFilters,
  ): Promise<{ total: number; data: Prestacao[] }> {
    try {
      let prestacoes = Array.from(this.prestacoes.values()).filter((p) => {
        // Filtrar por usuário
        if (p.usuarioId !== usuarioId) return false;

        // Não incluir deletadas
        if (p.deletadoEm) return false;

        // Filtrar por status
        if (filters.status && p.status !== filters.status) return false;

        // Filtrar por competência
        if (filters.competenciaInicio && p.competencia < filters.competenciaInicio) {
          return false;
        }
        if (filters.competenciaFim && p.competencia > filters.competenciaFim) {
          return false;
        }

        return true;
      });

      // Ordenar por data de atualização DESC
      prestacoes.sort((a, b) => {
        const dateA = new Date(a.atualizadoEm || 0).getTime();
        const dateB = new Date(b.atualizadoEm || 0).getTime();
        return dateB - dateA;
      });

      const total = prestacoes.length;

      // Aplicar paginação
      prestacoes = prestacoes.slice(filters.skip, filters.skip + filters.take);

      return { total, data: prestacoes };
    } catch (error) {
      logger.error(`Erro ao listar prestações: ${error}`);
      throw error;
    }
  }

  /**
   * Atualizar prestação
   */
  async update(
    usuarioId: string,
    prestacaoId: string,
    input: UpdatePrestacaoInput,
  ): Promise<Prestacao> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);

      // Validar dados de entrada
      const dadosValidados = UpdatePrestacaoSchema.parse(input);

      // Não permitir update de prestações enviadas
      if (prestacao.status === 'enviado') {
        throw new Error('Não é possível editar prestações enviadas');
      }

      // Mesclar dados
      const prestacaoAtualizada: Prestacao = {
        ...prestacao,
        ...dadosValidados,
        versao: prestacao.versao + 1,
        atualizadoEm: new Date().toISOString(),
        status: 'rascunho', // Volta a rascunho quando atualiza
      };

      // Validar Prestação completa
      const validado = PrestacaoSchema.parse(prestacaoAtualizada);

      // Armazenar nova versão
      this.prestacoes.set(prestacaoId, validado);

      // Guardar no histórico
      const versoes = this.versoes.get(prestacaoId) || [];
      versoes.push(validado);
      this.versoes.set(prestacaoId, versoes);

      logger.info(
        `Prestação atualizada: ${prestacaoId} (versão ${validado.versao}) para usuário ${usuarioId}`,
      );

      return validado;
    } catch (error) {
      logger.error(`Erro ao atualizar prestação: ${error}`);
      throw error;
    }
  }

  /**
   * Deletar prestação (soft delete)
   */
  async delete(usuarioId: string, prestacaoId: string): Promise<void> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);

      if (prestacao.status === 'enviado') {
        throw new Error('Não é possível deletar prestações enviadas');
      }

      const prestacaoDeletada: Prestacao = {
        ...prestacao,
        deletadoEm: new Date().toISOString(),
      };

      this.prestacoes.set(prestacaoId, prestacaoDeletada);

      logger.info(`Prestação deletada: ${prestacaoId} para usuário ${usuarioId}`);
    } catch (error) {
      logger.error(`Erro ao deletar prestação: ${error}`);
      throw error;
    }
  }

  /**
   * Obter histórico de versões
   */
  async getHistory(usuarioId: string, prestacaoId: string): Promise<Prestacao[]> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);
      const versoes = this.versoes.get(prestacaoId) || [prestacao];

      return versoes.sort((a, b) => (b.versao || 0) - (a.versao || 0));
    } catch (error) {
      logger.error(`Erro ao obter histórico: ${error}`);
      throw error;
    }
  }

  /**
   * Restaurar versão anterior
   */
  async restoreVersion(
    usuarioId: string,
    prestacaoId: string,
    versao: number,
  ): Promise<Prestacao> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);

      if (prestacao.status === 'enviado') {
        throw new Error('Não é possível restaurar versões de prestações enviadas');
      }

      const versoes = this.versoes.get(prestacaoId) || [];
      const versaoAnterior = versoes.find((v) => v.versao === versao);

      if (!versaoAnterior) {
        throw new Error(`Versão ${versao} não encontrada`);
      }

      // Criar nova versão a partir da anterior
      const novaVersao: Prestacao = {
        ...versaoAnterior,
        versao: prestacao.versao + 1,
        atualizadoEm: new Date().toISOString(),
        status: 'rascunho',
      };

      const validado = PrestacaoSchema.parse(novaVersao);

      // Armazenar
      this.prestacoes.set(prestacaoId, validado);
      versoes.push(validado);
      this.versoes.set(prestacaoId, versoes);

      logger.info(
        `Versão ${versao} restaurada para prestação ${prestacaoId}, nova versão: ${validado.versao}`,
      );

      return validado;
    } catch (error) {
      logger.error(`Erro ao restaurar versão: ${error}`);
      throw error;
    }
  }

  /**
   * Marcar como validado
   */
  async validate(usuarioId: string, prestacaoId: string): Promise<Prestacao> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);

      if (!prestacao.descritor) {
        throw new Error('Descritor é obrigatório para validação');
      }

      const prestacaoValidada: Prestacao = {
        ...prestacao,
        status: 'validado',
        validadoEm: new Date().toISOString(),
      };

      const validado = PrestacaoSchema.parse(prestacaoValidada);

      this.prestacoes.set(prestacaoId, validado);

      logger.info(`Prestação validada: ${prestacaoId} para usuário ${usuarioId}`);

      return validado;
    } catch (error) {
      logger.error(`Erro ao validar prestação: ${error}`);
      throw error;
    }
  }

  /**
   * Marcar como enviado
   */
  async send(usuarioId: string, prestacaoId: string): Promise<Prestacao> {
    try {
      const prestacao = await this.getById(usuarioId, prestacaoId);

      if (prestacao.status !== 'validado') {
        throw new Error('Apenas prestações validadas podem ser enviadas');
      }

      const prestacaoEnviada: Prestacao = {
        ...prestacao,
        status: 'enviado',
        enviadoEm: new Date().toISOString(),
      };

      const validado = PrestacaoSchema.parse(prestacaoEnviada);

      this.prestacoes.set(prestacaoId, validado);

      logger.info(`Prestação enviada: ${prestacaoId} para usuário ${usuarioId}`);

      return validado;
    } catch (error) {
      logger.error(`Erro ao enviar prestação: ${error}`);
      throw error;
    }
  }
}

// Singleton
export const prestacaoService = new PrestacaoService();
