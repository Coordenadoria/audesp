// backend/src/entities/Prestacao.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User';
import { DocumentoFiscal } from './DocumentoFiscal';
import { Pagamento } from './Pagamento';
import { Responsavel } from './Responsavel';
import { Contrato } from './Contrato';

export enum PrestacaoStatus {
  RASCUNHO = 'rascunho',
  ENVIADA = 'enviada',
  EM_ANALISE = 'em_analise',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
  PENDENTE_CORRECAO = 'pendente_correcao',
}

@Entity('prestacoes')
@Index(['competencia', 'usuarioCriadorId'])
@Index(['status'])
export class Prestacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 50 })
  numero: string;

  @Column('varchar', { length: 7 })
  competencia: string; // YYYY-MM format

  @Column({ type: 'enum', enum: PrestacaoStatus, default: PrestacaoStatus.RASCUNHO })
  status: PrestacaoStatus;

  // Descritor data
  @Column('varchar', { length: 255, nullable: true })
  nomeGestor: string;

  @Column('varchar', { length: 11, nullable: true })
  cpfGestor: string;

  @Column('varchar', { length: 255, nullable: true })
  nomeResponsavelPrincipal: string;

  @Column('varchar', { length: 11, nullable: true })
  cpfResponsavelPrincipal: string;

  @Column('varchar', { length: 255, nullable: true })
  nomeOrgaoOrigem: string;

  @Column('varchar', { length: 50, nullable: true })
  codigoOrgaoOrigem: string;

  // Financial data
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  saldoInicial: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  saldoFinal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalReceitas: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalDespesas: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPagamentos: number;

  // LGPD Compliance
  @Column('boolean', { default: false })
  possuiDadosPessoais: boolean;

  @Column('boolean', { default: false })
  consentimentoLGPD: boolean;

  @Column('date', { nullable: true })
  dataConsentimentoLGPD: Date;

  // Validation
  @Column('boolean', { default: false })
  validado: boolean;

  @Column('date', { nullable: true })
  dataValidacao: Date;

  @Column('text', { nullable: true })
  validacaoErros: string; // JSON stringified errors

  @Column('text', { nullable: true })
  validacaoAvisos: string; // JSON stringified warnings

  // Metadata
  @Column('text', { nullable: true })
  observacoes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadados: Record<string, any>;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Foreign keys
  @Column('uuid')
  usuarioCriadorId: string;

  @ManyToOne(() => User, (user) => user.prestacoes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuarioCriadorId' })
  usuarioCriador: User;

  // Relationships
  @OneToMany(() => DocumentoFiscal, (doc) => doc.prestacao, { cascade: ['remove'] })
  documentosFiscais: DocumentoFiscal[];

  @OneToMany(() => Pagamento, (pag) => pag.prestacao, { cascade: ['remove'] })
  pagamentos: Pagamento[];

  @OneToMany(() => Responsavel, (resp) => resp.prestacao, { cascade: ['remove'] })
  responsaveis: Responsavel[];

  @OneToMany(() => Contrato, (cont) => cont.prestacao, { cascade: ['remove'] })
  contratos: Contrato[];
}
