import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger.js';
import { config } from './config/env.js';
import { initializeDatabase } from './config/database.js';

const app: Express = express();

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Status
app.get('/api/status', (req: Request, res: Response) => {
  res.status(200).json({
    service: 'AUDESP Backend API',
    status: 'operational',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
import authRoutes from './routes/auth.js';
import prestacaoRoutes from './routes/prestacoes.js';
import validacaoRoutes from './routes/validacao.js';
app.use('/api/auth', authRoutes);
app.use('/api/prestacoes', prestacaoRoutes);
app.use('/api/validacao', validacaoRoutes);

// TODO: Importar rotas adicionais
// import auditoriaRoutes from './routes/auditoria.js';
// app.use('/api/auditoria', auditoriaRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  logger.error(`${status} - ${message}`);

  res.status(status).json({
    status,
    message,
    ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================

const PORT = config.server.port;
const HOST = config.server.host;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    app.listen(PORT, HOST, () => {
      logger.info(
        `🚀 Servidor iniciado em http://${HOST}:${PORT} (${config.server.nodeEnv})`,
      );
      logger.info(`📝 Documentação: http://${HOST}:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar servidor', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

startServer();

export default app;
