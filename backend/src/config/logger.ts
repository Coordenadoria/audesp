import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const transports = [
  // Console transport
  new winston.transports.Console(),

  // File transport - error logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs', 'error.log'),
    level: 'error',
    format: winston.format.uncolorize(),
  }),

  // File transport - all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs', 'all.log'),
    format: winston.format.uncolorize(),
  }),
];

export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
});

// Tipagem estendida para Express
declare global {
  namespace Express {
    interface Request {
      logger?: typeof logger;
    }
  }
}

export default logger;
