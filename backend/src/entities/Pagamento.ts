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

  @Column()
  numero: string;

  @Column({ type: 'enum', enum: PagamentoStatus, default: PagamentoStatus.PENDENTE })
  status: PagamentoStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column()
  dataPagamento: Date;

  @Column({ nullable: true })
  dataProcessamento: Date;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  beneficiario: string;

  @Column({ nullable: true })
  cpfCnpjBeneficiario: string;

  @Column({ nullable: true })
  contaBancaria: string;

  @Column({ nullable: true })
  agenciaBancaria: string;

  @Column({ nullable: true })
  bancoId: string;

  @Column({ nullable: true })
  numeroDocumento: string;

  @Column({ nullable: true })
  ordenacao: string;

  @Column({ type: 'jsonb', nullable: true })
  comprovantes: Array<{
    tipo: string;
    caminhoArquivo: string;
    dataUpload: Date;
  }>;

  @Column({ default: false })
  validado: boolean;

  @Column({ nullable: true })
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
