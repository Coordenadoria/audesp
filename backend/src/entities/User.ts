// backend/src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Prestacao } from './Prestacao';

export enum UserRole {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  AUDITOR = 'auditor',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 255 })
  password: string;

  @Column('varchar', { length: 255 })
  nome: string;

  @Column('varchar', { length: 11, nullable: true })
  cpf: string;

  @Column('varchar', { length: 14, nullable: true })
  cnpj: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column('boolean', { default: true })
  ativo: boolean;

  @Column('timestamp', { nullable: true })
  ultimoLogin: Date;

  @Column('varchar', { length: 20, nullable: true })
  telefone: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Relationships
  @OneToMany(() => Prestacao, (prestacao) => prestacao.usuarioCriador)
  prestacoes: Prestacao[];
}
