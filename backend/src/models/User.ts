// src/models/User.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Email inválido'),
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
    .refine((cpf) => validateCPF(cpf), 'CPF inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  senhaHash: z.string().min(60, 'Senha hash inválida').optional(),
  ativo: z.boolean().default(true),
  criadoEm: z.date().optional(),
  atualizadoEm: z.date().optional(),
  deletadoEm: z.date().nullable().optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
    .refine((cpf) => validateCPF(cpf), 'CPF inválido (módulo 11)'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
  senha: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos 1 maiúscula e 1 número',
    ),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// CPF Validator (Módulo 11)
export function validateCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  
  // Check if all digits are the same (invalid)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // First digit validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit >= 10) firstDigit = 0;
  if (firstDigit !== parseInt(cpf[9])) return false;

  // Second digit validation
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit >= 10) secondDigit = 0;
  if (secondDigit !== parseInt(cpf[10])) return false;

  return true;
}

// CNPJ Validator (Módulo 11)
export function validateCNPJ(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj)) return false;

  // Check if all digits are the same (invalid)
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // First digit validation
  const seq = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * seq[i];
  }
  let firstDigit = sum % 11;
  firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;
  if (firstDigit !== parseInt(cnpj[12])) return false;

  // Second digit validation
  const seq2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * seq2[i];
  }
  let secondDigit = sum % 11;
  secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;
  if (secondDigit !== parseInt(cnpj[13])) return false;

  return true;
}
