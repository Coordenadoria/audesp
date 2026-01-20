// backend/src/utils/password.ts
import bcryptjs from 'bcryptjs';
import { envConfig } from '../config/env';

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}
