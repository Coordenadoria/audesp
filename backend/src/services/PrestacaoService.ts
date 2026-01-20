// backend/src/services/PrestacaoService.ts
import { Repository, Like } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Prestacao, PrestacaoStatus } from '../entities/Prestacao';
import { DocumentoFiscal } from '../entities/DocumentoFiscal';
import { Pagamento } from '../entities/Pagamento';
import { Responsavel } from '../entities/Responsavel';
import { Contrato } from '../entities/Contrato';
import { logger } from '../config/logger';

export interface CreatePrestacaoDto {
  numero: string;
  competencia: string;
  nomeGestor?: string;
  cpfGestor?: string;
  nomeResponsavelPrincipal?: string;
  cpfResponsavelPrincipal?: string;
  usuarioCriadorId: string;
}

export interface UpdatePrestacaoDto {
  numero?: string;
  competencia?: string;
  status?: PrestacaoStatus;
  saldoInicial?: number;
  saldoFinal?: number;
  nomeGestor?: string;
  cpfGestor?: string;
  nomeResponsavelPrincipal?: string;
  cpfResponsavelPrincipal?: string;
  observacoes?: string;
  validado?: boolean;
  consentimentoLGPD?: boolean;
}

export class PrestacaoService {
  private prestacaoRepository: Repository<Prestacao>;
  private documentoRepository: Repository<DocumentoFiscal>;
  private pagamentoRepository: Repository<Pagamento>;
  private responsavelRepository: Repository<Responsavel>;
  private contratoRepository: Repository<Contrato>;

  constructor() {
    this.prestacaoRepository = AppDataSource.getRepository(Prestacao);
    this.documentoRepository = AppDataSource.getRepository(DocumentoFiscal);
    this.pagamentoRepository = AppDataSource.getRepository(Pagamento);
    this.responsavelRepository = AppDataSource.getRepository(Responsavel);
    this.contratoRepository = AppDataSource.getRepository(Contrato);
  }

  /**
   * Create a new prestação
   */
  async createPrestacao(data: CreatePrestacaoDto): Promise<Prestacao> {
    try {
      const prestacao = this.prestacaoRepository.create(data);
      const saved = await this.prestacaoRepository.save(prestacao);
      logger.info(`Prestação created: ${saved.id} (${saved.numero})`);
      return saved;
    } catch (error) {
      logger.error('Error creating prestação', { error });
      throw error;
    }
  }

  /**
   * Get prestação by ID (with relations)
   */
  async getPrestacaoById(id: string): Promise<Prestacao | null> {
    try {
      return await this.prestacaoRepository.findOne({
        where: { id },
        relations: [
          'usuarioCriador',
          'documentosFiscais',
          'pagamentos',
          'responsaveis',
          'contratos',
        ],
      });
    } catch (error) {
      logger.error('Error getting prestação', { error });
      throw error;
    }
  }

  /**
   * List prestações with filters and pagination
   */
  async listPrestacoes(filter: {
    usuarioCriadorId?: string;
    status?: PrestacaoStatus;
    competencia?: string;
    page?: number;
    limit?: number;
  }): Promise<{ prestacoes: Prestacao[]; total: number }> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filter.usuarioCriadorId) where.usuarioCriadorId = filter.usuarioCriadorId;
      if (filter.status) where.status = filter.status;
      if (filter.competencia)
        where.competencia = Like(`${filter.competencia}%`);

      const [prestacoes, total] = await this.prestacaoRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: { criadoEm: 'DESC' },
      });

      return { prestacoes, total };
    } catch (error) {
      logger.error('Error listing prestações', { error });
      throw error;
    }
  }

  /**
   * Update prestação
   */
  async updatePrestacao(id: string, data: UpdatePrestacaoDto): Promise<Prestacao> {
    try {
      const prestacao = await this.prestacaoRepository.findOne({ where: { id } });
      if (!prestacao) {
        throw new Error('Prestação not found');
      }

      Object.assign(prestacao, data);
      const updated = await this.prestacaoRepository.save(prestacao);
      logger.info(`Prestação updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating prestação', { error });
      throw error;
    }
  }

  /**
   * Delete prestação
   */
  async deletePrestacao(id: string): Promise<void> {
    try {
      await this.prestacaoRepository.delete(id);
      logger.info(`Prestação deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting prestação', { error });
      throw error;
    }
  }

  /**
   * Get summary of prestação
   */
  async getSummary(id: string): Promise<{
    id: string;
    numero: string;
    competencia: string;
    status: PrestacaoStatus;
    totalDocumentos: number;
    totalPagamentos: number;
    totalResponsaveis: number;
    totalContratos: number;
    saldoInicial: number;
    saldoFinal: number;
  } | null> {
    try {
      const prestacao = await this.getPrestacaoById(id);
      if (!prestacao) return null;

      return {
        id: prestacao.id,
        numero: prestacao.numero,
        competencia: prestacao.competencia,
        status: prestacao.status,
        totalDocumentos: prestacao.documentosFiscais?.length || 0,
        totalPagamentos: prestacao.pagamentos?.length || 0,
        totalResponsaveis: prestacao.responsaveis?.length || 0,
        totalContratos: prestacao.contratos?.length || 0,
        saldoInicial: prestacao.saldoInicial,
        saldoFinal: prestacao.saldoFinal,
      };
    } catch (error) {
      logger.error('Error getting prestação summary', { error });
      throw error;
    }
  }

  /**
   * Update validation status
   */
  async updateValidationStatus(
    id: string,
    validado: boolean,
    erros?: any[],
    avisos?: any[],
  ): Promise<Prestacao> {
    try {
      const prestacao = await this.prestacaoRepository.findOne({ where: { id } });
      if (!prestacao) {
        throw new Error('Prestação not found');
      }

      prestacao.validado = validado;
      prestacao.dataValidacao = new Date();
      prestacao.validacaoErros = erros ? JSON.stringify(erros) : '';
      prestacao.validacaoAvisos = avisos ? JSON.stringify(avisos) : '';

      const updated = await this.prestacaoRepository.save(prestacao);
      logger.info(`Prestação validation updated: ${id} (${validado ? 'valid' : 'invalid'})`);
      return updated;
    } catch (error) {
      logger.error('Error updating validation status', { error });
      throw error;
    }
  }

  /**
   * Update LGPD consent
   */
  async updateLGPDConsent(id: string, consentimento: boolean): Promise<Prestacao> {
    try {
      const prestacao = await this.prestacaoRepository.findOne({ where: { id } });
      if (!prestacao) {
        throw new Error('Prestação not found');
      }

      prestacao.consentimentoLGPD = consentimento;
      prestacao.dataConsentimentoLGPD = new Date();

      const updated = await this.prestacaoRepository.save(prestacao);
      logger.info(`LGPD consent updated for prestação: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating LGPD consent', { error });
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(id: string): Promise<{
    saldoInicial: number;
    totalReceitas: number;
    totalDespesas: number;
    totalPagamentos: number;
    saldoFinal: number;
  } | null> {
    try {
      const prestacao = await this.prestacaoRepository.findOne({ where: { id } });
      if (!prestacao) return null;

      return {
        saldoInicial: prestacao.saldoInicial,
        totalReceitas: prestacao.totalReceitas,
        totalDespesas: prestacao.totalDespesas,
        totalPagamentos: prestacao.totalPagamentos,
        saldoFinal: prestacao.saldoFinal,
      };
    } catch (error) {
      logger.error('Error getting financial summary', { error });
      throw error;
    }
  }

  /**
   * Update financial totals
   */
  async updateFinancialTotals(
    id: string,
    updates: {
      saldoInicial?: number;
      totalReceitas?: number;
      totalDespesas?: number;
      totalPagamentos?: number;
      saldoFinal?: number;
    },
  ): Promise<Prestacao> {
    try {
      const prestacao = await this.prestacaoRepository.findOne({ where: { id } });
      if (!prestacao) {
        throw new Error('Prestação not found');
      }

      if (updates.saldoInicial !== undefined) prestacao.saldoInicial = updates.saldoInicial;
      if (updates.totalReceitas !== undefined) prestacao.totalReceitas = updates.totalReceitas;
      if (updates.totalDespesas !== undefined) prestacao.totalDespesas = updates.totalDespesas;
      if (updates.totalPagamentos !== undefined)
        prestacao.totalPagamentos = updates.totalPagamentos;
      if (updates.saldoFinal !== undefined) prestacao.saldoFinal = updates.saldoFinal;

      const updated = await this.prestacaoRepository.save(prestacao);
      logger.info(`Financial totals updated for prestação: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating financial totals', { error });
      throw error;
    }
  }
}

export const prestacaoService = new PrestacaoService();
