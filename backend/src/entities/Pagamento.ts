// backend/src/entities/Pagamento.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prestacao } from './Prestacao';

export enum PagamentoStatus {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  PAGO = 'pago',
  REJEITADO = 'rejeitado',
  DEVOLVIDO = 'devolvido',
}

@Entity('pagamentos')
@Index(['prestacaoId', 'status'])
@Index(['dataPagamento'])
export class Pagamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 50 })
  numero: string;

  @Column({ type: 'enum', enum: PagamentoStatus, default: PagamentoStatus.PENDENTE })
  status: PagamentoStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column('date')
  dataPagamento: Date;

  @Column('date', { nullable: true })
  dataProcessamento: Date;

  @Column('text', { nullable: true })
  descricao: string;

  @Column('varchar', { length: 255, nullable: true })
  beneficiario: string;

  @Column('varchar', { length: 14, nullable: true })
  cpfCnpjBeneficiario: string;

  @Column('varchar', { length: 20, nullable: true })
  contaBancaria: string;

  @Column('varchar', { length: 10, nullable: true })
  agenciaBancaria: string;

  @Column('varchar', { length: 10, nullable: true })
  bancoId: string;

  @Column('varchar', { length: 50, nullable: true })
  numeroDocumento: string;

  @Column('varchar', { length: 100, nullable: true })
  ordenacao: string;

  @Column({ type: 'jsonb', nullable: true })
  comprovantes: Array<{
    tipo: string;
    caminhoArquivo: string;
    dataUpload: Date;
  }>;

  @Column('boolean', { default: false })
  validado: boolean;

  @Column('text', { nullable: true })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Foreign key
  @Column('uuid')
  prestacaoId: string;

  @ManyToOne(() => Prestacao, (prestacao) => prestacao.pagamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestacaoId' })
  prestacao: Prestacao;
}
