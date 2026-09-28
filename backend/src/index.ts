/**
 * SAB KUCH BACKEND — Entry Point
 *
 * Bootstraps the Express application and starts the HTTP server.
 * All application configuration is delegated to src/app.ts to keep
 * this file minimal and focused on process-level concerns only.
 */

import 'dotenv/config';
import { createApp } from './app';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap() {
  try {
    // 1. Verify database connectivity before accepting traffic
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // 2. Create the Express app
    const app = createApp();

    // 3. Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Sab Kuch API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    // 4. Graceful shutdown — close DB connections and in-flight requests
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully…`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Bye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
