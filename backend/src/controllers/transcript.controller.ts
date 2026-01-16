import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccessResponse } from '../utils/responseHandler';
import { BadRequestError } from '../utils/ApiError';
import * as transcriptService from '../services/transcript.service';
import * as contextService from '../services/context.service';
import * as summaryService from '../services/summary.service';

// Default userId for single-user system
const DEFAULT_USER_ID = '000000000000000000000000';

/**
 * Ingest a transcript chunk
 * POST /api/transcripts/ingest
 */
export const ingestTranscript = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { text, timestamp, chunkNumber } = req.body;

    const time = new Date(timestamp);

    const result = await transcriptService.ingestTranscript({
      text,
      timestamp: time,
      chunkNumber,
    });

    sendSuccessResponse(res, 201, 'Transcript chunk ingested successfully', result);
  }
);

/**
 * Get daily context
 * GET /api/transcripts/context/daily?dayNumber=1
 */
export const getDailyContext = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { dayNumber } = req.query as { dayNumber: string };

    const context = await contextService.getDailyContext(DEFAULT_USER_ID, parseInt(dayNumber));

    if (!context) {
      sendSuccessResponse(res, 200, 'No data found for this day', { dayNumber: parseInt(dayNumber), segments: [] });
      return;
    }

    sendSuccessResponse(res, 200, 'Daily context retrieved', context);
  }
);

/**
 * Get hourly context
 * GET /api/transcripts/context/hour?dayNumber=1&hour=14
 */
export const getHourlyContext = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { dayNumber, hour } = req.query as { dayNumber: string; hour: string };

    const context = await contextService.getHourlyContext(DEFAULT_USER_ID, parseInt(dayNumber), parseInt(hour));

    if (!context) {
      sendSuccessResponse(res, 200, 'No data found for this hour', { dayNumber: parseInt(dayNumber), hour: parseInt(hour), chunks: [] });
      return;
    }

    sendSuccessResponse(res, 200, 'Hourly context retrieved', context);
  }
);

/**
 * Semantic search
 * GET /api/transcripts/context/search?query=gym&date=2026-01-12&limit=10
 */
export const semanticSearch = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { query, date, limit } = req.query as {
      query: string;
      date?: string;
      limit?: string;
    };

    const results = await contextService.semanticSearchTranscripts(DEFAULT_USER_ID, query, {
      date,
      limit: limit ? parseInt(limit) : undefined,
    });

    sendSuccessResponse(res, 200, 'Semantic search completed', results);
  }
);

/**
 * Find similar events
 * GET /api/transcripts/context/similar?chunkId=xxx&limit=10
 */
export const findSimilarEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { chunkId, limit } = req.query as {
      chunkId: string;
      limit?: string;
    };

    const results = await contextService.findSimilarEvents(
      DEFAULT_USER_ID,
      chunkId,
      limit ? parseInt(limit) : undefined
    );

    sendSuccessResponse(res, 200, 'Similar events found', results);
  }
);

/**
 * Generate daily summary
 * GET /api/transcripts/summary/daily?dayNumber=1
 */
export const getDailySummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { dayNumber } = req.query as { dayNumber: string };

    const summary = await summaryService.generateDailySummary(DEFAULT_USER_ID, parseInt(dayNumber));

    if (!summary) {
      sendSuccessResponse(res, 200, 'No data available for summary', { dayNumber: parseInt(dayNumber) });
      return;
    }

    sendSuccessResponse(res, 200, 'Daily summary generated', summary);
  }
);

/**
 * Generate weekly summary
 * GET /api/transcripts/summary/weekly?startDay=1&endDay=7
 */
export const getWeeklySummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { startDay, endDay } = req.query as { startDay: string; endDay: string };

    const summary = await summaryService.generateWeeklySummary(
      DEFAULT_USER_ID, 
      parseInt(startDay), 
      parseInt(endDay)
    );

    if (!summary) {
      sendSuccessResponse(res, 200, 'No data available for weekly summary', { startDay: parseInt(startDay), endDay: parseInt(endDay) });
      return;
    }

    sendSuccessResponse(res, 200, 'Weekly summary generated', summary);
  }
);

/**
 * Get chatroom history
 * GET /api/transcripts/chatrooms?limit=30
 */
export const getUserChatrooms = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { limit } = req.query as { limit?: string };

    const chatrooms = await contextService.getUserChatrooms(
      DEFAULT_USER_ID,
      limit ? parseInt(limit) : undefined
    );

    sendSuccessResponse(res, 200, 'Chatrooms retrieved', { chatrooms });
  }
);
