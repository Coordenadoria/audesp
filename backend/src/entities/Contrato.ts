// backend/src/entities/Contrato.ts
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

@Entity('contratos')
@Index(['prestacaoId', 'numero'])
@Index(['dataInicio', 'dataFim'])
export class Contrato {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column()
  descricao: string;

  @Column()
  dataInicio: Date;

  @Column({ nullable: true })
  dataFim: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  valorTotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  valorExecutado: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  valorPendente: number;

  @Column({ nullable: true })
  fornecedor: string;

  @Column({ nullable: true })
  cnpjFornecedor: string;

  @Column({ nullable: true })
  nomeResponsavel: string;

  @Column({ nullable: true })
  cpfResponsavel: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  termos: Array<{
    numero: string;
    descricao: string;
    valor: number;
    data: string;
  }>;

  @Column({ nullable: true })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Foreign key
  @Column('uuid')
  prestacaoId: string;

  @ManyToOne(() => Prestacao, (prestacao) => prestacao.contratos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestacaoId' })
  prestacao: Prestacao;
}
