// backend/src/config/database.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envConfig } from './env';
import { User } from '../entities/User';
import { Prestacao } from '../entities/Prestacao';
import { DocumentoFiscal } from '../entities/DocumentoFiscal';
import { Pagamento } from '../entities/Pagamento';
import { Responsavel } from '../entities/Responsavel';
import { Contrato } from '../entities/Contrato';
import { logger } from './logger';

// Import migrations
import { CreateInitialSchema1705763200000 } from '../migrations/1705763200000-CreateInitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_NAME,
  synchronize: false, // Use migrations instead
  logging: envConfig.NODE_ENV === 'development',
  logger: 'advanced-console',
  entities: [User, Prestacao, DocumentoFiscal, Pagamento, Responsavel, Contrato],
  migrations: [CreateInitialSchema1705763200000],
  subscribers: [],
  dropSchema: false,
  ssl: envConfig.DB_SSL ? { rejectUnauthorized: false } : false,
});

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection established successfully');

      // Run pending migrations
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        logger.info('Running database migrations...');
        await AppDataSource.runMigrations();
        logger.info('Database migrations completed');
      }
    }
  } catch (error) {
    logger.error('Failed to initialize database connection', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Disconnect database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Failed to disconnect database', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
