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

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  ultimoLogin: Date;

  @Column({ nullable: true })
  telefone: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Relationships
  @OneToMany(() => Prestacao, (prestacao) => prestacao.usuarioCriador)
  prestacoes: Prestacao[];
}
