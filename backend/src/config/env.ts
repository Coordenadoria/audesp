import 'dotenv/config';

interface Config {
  server: {
    nodeEnv: string;
    port: number;
    host: string;
  };
  database: {
    type: 'postgres';
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    db: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  bcrypt: {
    rounds: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  externalServices: {
    audespApi: {
      url: string;
      key: string;
      timeout: number;
    };
  };
  features: {
    ocrEnabled: boolean;
    pdfImportEnabled: boolean;
    audespIntegrationEnabled: boolean;
    emailNotificationsEnabled: boolean;
  };
}

const getConfig = (): Config => {
  const corsOrigin = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }

  return {
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    database: {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      name: process.env.DATABASE_NAME || 'audesp_dev',
      user: process.env.DATABASE_USER || 'audesp',
      password: process.env.DATABASE_PASSWORD || 'audesp_password',
      ssl: process.env.DATABASE_SSL === 'true',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      db: parseInt(process.env.REDIS_DB || '0', 10),
      password: process.env.REDIS_PASSWORD,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },
    cors: {
      origin: corsOrigin.length > 0 ? corsOrigin : ['http://localhost:5173'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/audesp.log',
    },
    externalServices: {
      audespApi: {
        url: process.env.AUDESP_API_URL || 'https://api.audesp.gov.br',
        key: process.env.AUDESP_API_KEY || '',
        timeout: parseInt(process.env.AUDESP_API_TIMEOUT || '30000', 10),
      },
    },
    features: {
      ocrEnabled: process.env.FEATURE_OCR_ENABLED === 'true',
      pdfImportEnabled: process.env.FEATURE_PDF_IMPORT_ENABLED === 'true',
      audespIntegrationEnabled: process.env.FEATURE_AUDESP_INTEGRATION_ENABLED === 'true',
      emailNotificationsEnabled: process.env.FEATURE_EMAIL_NOTIFICATIONS_ENABLED === 'true',
    },
  };
};

export const config = getConfig();
