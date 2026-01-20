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

  @Column('varchar', { length: 50 })
  numero: string;

  @Column('text')
  descricao: string;

  @Column('date')
  dataInicio: Date;

  @Column('date', { nullable: true })
  dataFim: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  valorTotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  valorExecutado: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  valorPendente: number;

  @Column('varchar', { length: 255, nullable: true })
  fornecedor: string;

  @Column('varchar', { length: 14, nullable: true })
  cnpjFornecedor: string;

  @Column('varchar', { length: 255, nullable: true })
  nomeResponsavel: string;

  @Column('varchar', { length: 11, nullable: true })
  cpfResponsavel: string;

  @Column('boolean', { default: true })
  ativo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  termos: Array<{
    numero: string;
    descricao: string;
    valor: number;
    data: string;
  }>;

  @Column('text', { nullable: true })
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
