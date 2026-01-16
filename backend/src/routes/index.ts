import { Router } from 'express';
import { logger } from '../utils';
import exampleRoutes from './example.routes';
import chatroomRoutes from './chatroom.routes';
import transcriptRoutes from './transcript.routes';

const router = Router();

/** Health check endpoint */
router.get('/healthz', (_, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Chatroom routes
router.use('/chatrooms', chatroomRoutes);

// Transcript routes
router.use('/transcripts', transcriptRoutes);

// Example routes
router.use('/examples', exampleRoutes);

export default router;
