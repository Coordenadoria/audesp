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

  @Column()
  nome: string;

  @Column()
  cpf: string;

  @Column({ type: 'enum', enum: ResponsavelTipo })
  tipo: ResponsavelTipo;

  @Column()
  cargo: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telefone: string;

  @Column()
  dataInicio: Date;

  @Column({ nullable: true })
  dataFim: Date;

  @Column({ default: false })
  consentimentoLGPD: boolean;

  @Column({ nullable: true })
  dataConsentimento: Date;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
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
