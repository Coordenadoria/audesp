// backend/src/services/UserService.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { logger } from '../config/logger';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    password: string;
    nome: string;
    cpf?: string;
    cnpj?: string;
    role?: UserRole;
    telefone?: string;
  }): Promise<User> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const hashedPassword = await hashPassword(data.password);

      const user = this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        nome: data.nome,
        cpf: data.cpf,
        cnpj: data.cnpj,
        role: data.role || UserRole.VIEWER,
        telefone: data.telefone,
      });

      const savedUser = await this.userRepository.save(user);
      logger.info(`User created: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      logger.error('Error finding user by ID', { error });
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await comparePassword(password, user.password);
    } catch (error) {
      logger.error('Error verifying password', { error });
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new Error('User not found');
      }

      Object.assign(user, data);
      const updated = await this.userRepository.save(user);
      logger.info(`User updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating user', { error });
      throw error;
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.userRepository.update(id, { ultimoLogin: new Date() });
    } catch (error) {
      logger.error('Error updating last login', { error });
      throw error;
    }
  }

  /**
   * List all users (admin only)
   */
  async listUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    try {
      const [users, total] = await this.userRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { criadoEm: 'DESC' },
      });

      return { users, total };
    } catch (error) {
      logger.error('Error listing users', { error });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepository.delete(id);
      logger.info(`User deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting user', { error });
      throw error;
    }
  }
}

export const userService = new UserService();
