import { Router } from 'express';
import { validate } from '../middlewares/validate';
import * as transcriptController from '../controllers/transcript.controller';
import * as transcriptSchema from '../schemas/transcript.schema';

const router = Router();

/**
 * POST /api/transcripts/ingest
 * Ingest a transcript chunk
 */
router.post(
  '/ingest',
  validate(transcriptSchema.ingestTranscriptSchema),
  transcriptController.ingestTranscript
);

/**
 * GET /api/transcripts/context/daily
 * Get daily structured context
 */
router.get(
  '/context/daily',
  validate(transcriptSchema.dailyContextSchema),
  transcriptController.getDailyContext
);

/**
 * GET /api/transcripts/context/hour
 * Get hourly context
 */
router.get(
  '/context/hour',
  validate(transcriptSchema.hourlyContextSchema),
  transcriptController.getHourlyContext
);

/**
 * GET /api/transcripts/context/search
 * Semantic search across transcripts
 */
router.get(
  '/context/search',
  validate(transcriptSchema.semanticSearchSchema),
  transcriptController.semanticSearch
);

/**
 * GET /api/transcripts/context/similar
 * Find similar events to a given chunk
 */
router.get(
  '/context/similar',
  validate(transcriptSchema.similarEventsSchema),
  transcriptController.findSimilarEvents
);

/**
 * GET /api/transcripts/summary/daily
 * Generate daily summary
 */
router.get(
  '/summary/daily',
  validate(transcriptSchema.dailySummarySchema),
  transcriptController.getDailySummary
);

/**
 * GET /api/transcripts/summary/weekly
 * Generate weekly summary
 */
router.get(
  '/summary/weekly',
  validate(transcriptSchema.weeklySummarySchema),
  transcriptController.getWeeklySummary
);

/**
 * GET /api/transcripts/chatrooms
 * Get user's chatroom history
 */
router.get('/chatrooms', transcriptController.getUserChatrooms);

export default router;
