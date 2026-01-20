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

  @Column()
  numero: string;

  @Column()
  competencia: string; // YYYY-MM format

  @Column({ type: 'enum', enum: PrestacaoStatus, default: PrestacaoStatus.RASCUNHO })
  status: PrestacaoStatus;

  // Descritor data
  @Column({ nullable: true })
  nomeGestor: string;

  @Column({ nullable: true })
  cpfGestor: string;

  @Column({ nullable: true })
  nomeResponsavelPrincipal: string;

  @Column({ nullable: true })
  cpfResponsavelPrincipal: string;

  @Column({ nullable: true })
  nomeOrgaoOrigem: string;

  @Column({ nullable: true })
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
  @Column({ default: false })
  possuiDadosPessoais: boolean;

  @Column({ default: false })
  consentimentoLGPD: boolean;

  @Column({ nullable: true })
  dataConsentimentoLGPD: Date;

  // Validation
  @Column({ default: false })
  validado: boolean;

  @Column({ nullable: true })
  dataValidacao: Date;

  @Column({ nullable: true })
  validacaoErros: string; // JSON stringified errors

  @Column({ nullable: true })
  validacaoAvisos: string; // JSON stringified warnings

  // Metadata
  @Column({ nullable: true })
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
