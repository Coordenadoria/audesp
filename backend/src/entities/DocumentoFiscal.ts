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

  @Column()
  numero: string;

  @Column()
  serie: string;

  @Column({ type: 'enum', enum: DocumentoTipo })
  tipo: DocumentoTipo;

  @Column()
  data: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  fornecedor: string;

  @Column({ nullable: true })
  cnpjFornecedor: string;

  @Column({ nullable: true })
  contaContabil: string;

  @Column({ type: 'jsonb', nullable: true })
  itens: Array<{
    descricao: string;
    quantidade: number;
    unitario: number;
    subtotal: number;
  }>;

  @Column({ nullable: true })
  caminhoArquivo: string;

  @Column({ nullable: true })
  hashArquivo: string;

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

  @ManyToOne(() => Prestacao, (prestacao) => prestacao.documentosFiscais, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestacaoId' })
  prestacao: Prestacao;
}
