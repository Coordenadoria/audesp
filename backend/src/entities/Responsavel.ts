// backend/src/entities/Responsavel.ts
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

export enum ResponsavelTipo {
  GESTOR = 'gestor',
  TESOUREIRO = 'tesoureiro',
  CONTADOR = 'contador',
  ORDENADOR = 'ordenador',
  OUTRO = 'outro',
}

@Entity('responsaveis')
@Index(['prestacaoId', 'tipo'])
export class Responsavel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  nome: string;

  @Column('varchar', { length: 11 })
  cpf: string;

  @Column({ type: 'enum', enum: ResponsavelTipo })
  tipo: ResponsavelTipo;

  @Column('varchar', { length: 100 })
  cargo: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('varchar', { length: 20, nullable: true })
  telefone: string;

  @Column('date')
  dataInicio: Date;

  @Column('date', { nullable: true })
  dataFim: Date;

  @Column('boolean', { default: false })
  consentimentoLGPD: boolean;

  @Column('date', { nullable: true })
  dataConsentimento: Date;

  @Column('boolean', { default: true })
  ativo: boolean;

  @Column('text', { nullable: true })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Foreign key
  @Column('uuid')
  prestacaoId: string;

  @ManyToOne(() => Prestacao, (prestacao) => prestacao.responsaveis, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestacaoId' })
  prestacao: Prestacao;
}
