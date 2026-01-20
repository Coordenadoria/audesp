// backend/src/entities/DocumentoFiscal.ts
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

export enum DocumentoTipo {
  REC = 'REC', // Recebimento
  DES = 'DES', // Despesa
  ORC = 'ORC', // Orçamento
}

@Entity('documentos_fiscais')
@Index(['prestacaoId', 'numero'])
@Index(['data'])
export class DocumentoFiscal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 50 })
  numero: string;

  @Column('varchar', { length: 10 })
  serie: string;

  @Column({ type: 'enum', enum: DocumentoTipo })
  tipo: DocumentoTipo;

  @Column('date')
  data: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column('text', { nullable: true })
  descricao: string;

  @Column('varchar', { length: 255, nullable: true })
  fornecedor: string;

  @Column('varchar', { length: 14, nullable: true })
  cnpjFornecedor: string;

  @Column('varchar', { length: 50, nullable: true })
  contaContabil: string;

  @Column({ type: 'jsonb', nullable: true })
  itens: Array<{
    descricao: string;
    quantidade: number;
    unitario: number;
    subtotal: number;
  }>;

  @Column('varchar', { length: 255, nullable: true })
  caminhoArquivo: string;

  @Column('varchar', { length: 64, nullable: true })
  hashArquivo: string;

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

  @ManyToOne(() => Prestacao, (prestacao) => prestacao.documentosFiscais, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestacaoId' })
  prestacao: Prestacao;
}
