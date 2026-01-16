import { createServer } from 'http';
import app from './app';
import { logger } from './utils';
import { dbInstance, appConfig } from './config';
import { initializeChroma, closeChroma } from './config/chroma';
import { initializeEmbeddingModel } from './services/embedding.service';
import mongoose from 'mongoose';
import { initializeSocketIO } from './socket';

const PORT = appConfig.port;

let server: any;
let io: any;

(async () => {
  try {
    await dbInstance(); // Connect to MongoDB

    // Initialize ChromaDB (optional - continue if it fails)
    try {
      await initializeChroma();
      logger.info('✅ ChromaDB initialized successfully');
    } catch (chromaError) {
      logger.warn('⚠️  ChromaDB not available - semantic search features will be disabled', { error: chromaError });
      logger.info('💡 To enable ChromaDB: Start Docker and run "docker-compose up chroma -d"');
    }

    // Initialize embedding model
    initializeEmbeddingModel();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    io = initializeSocketIO(httpServer);

    // Start server
    server = httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(
        `📊 Health check available at: http://localhost:${PORT}/healthz`
      );
      logger.info(`🔌 Socket.IO server initialized`);
      logger.info(`🔍 ChromaDB connected at: ${appConfig.chroma.url}`);
      logger.info(`🌍 Environment: ${appConfig.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Function to handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Close Socket.IO connections
  if (io) {
    io.close(() => {
      logger.info('Socket.IO connections closed.');
    });
  }

  // Close the HTTP server
  server.close(async (err: any) => {
    if (err) {
      logger.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    logger.info('HTTP server closed.');

    // Close ChromaDB connection
    try {
      await closeChroma();
      logger.info('ChromaDB connection closed.');
    } catch (chromaErr) {
      logger.error('Error closing ChromaDB connection:', chromaErr);
    }

    // Close MongoDB connection
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (dbErr) {
      logger.error('Error closing MongoDB connection:', dbErr);
      process.exit(1);
    }

    logger.info('Application gracefully shut down.');
    process.exit(0);
  });

  // Force close if server hasn't exited within a timeout
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
