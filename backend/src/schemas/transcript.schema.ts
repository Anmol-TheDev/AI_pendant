import { z } from 'zod';

/**
 * Schema for ingesting transcript chunks
 */
export const ingestTranscriptSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'text is required').max(5000, 'text too long'),
    timestamp: z.string().datetime('Invalid timestamp format'),
    chunkNumber: z.number().int().positive().optional(),
  }),
});

/**
 * Schema for daily context query
 */
export const dailyContextSchema = z.object({
  query: z.object({
    dayNumber: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  }),
});

/**
 * Schema for hourly context query
 */
export const hourlyContextSchema = z.object({
  query: z.object({
    dayNumber: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
    hour: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0).max(23)),
  }),
});

/**
 * Schema for semantic search
 */
export const semanticSearchSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'search query is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  }),
});

/**
 * Schema for similar events query
 */
export const similarEventsSchema = z.object({
  query: z.object({
    chunkId: z.string().min(1, 'chunkId is required'),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(50)).optional(),
  }),
});

/**
 * Schema for daily summary
 */
export const dailySummarySchema = z.object({
  query: z.object({
    dayNumber: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  }),
});

/**
 * Schema for weekly summary
 */
export const weeklySummarySchema = z.object({
  query: z.object({
    startDay: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
    endDay: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  }),
});

export type IngestTranscriptInput = z.infer<typeof ingestTranscriptSchema>['body'];
export type DailyContextQuery = z.infer<typeof dailyContextSchema>['query'];
export type HourlyContextQuery = z.infer<typeof hourlyContextSchema>['query'];
export type SemanticSearchQuery = z.infer<typeof semanticSearchSchema>['query'];
export type SimilarEventsQuery = z.infer<typeof similarEventsSchema>['query'];
export type DailySummaryQuery = z.infer<typeof dailySummarySchema>['query'];
export type WeeklySummaryQuery = z.infer<typeof weeklySummarySchema>['query'];
