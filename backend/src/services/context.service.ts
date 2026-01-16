import { TranscriptChatroom } from '../models/TranscriptChatroom';
import { TranscriptSegment } from '../models/TranscriptSegment';
import { TranscriptChunk } from '../models/TranscriptChunk';
import { semanticSearch, findSimilarChunks, ChromaMetadata } from './chroma.service';
import { logger } from '../utils';

/**
 * Context Service
 * Provides structured context retrieval for AI agents
 */

interface DailyContext {
  chatroomName: string;
  dayNumber: number;
  startTime: Date;
  endTime: Date;
  segments: {
    hour: number;
    chunks: {
      text: string;
      startTimestamp: Date;
      endTimestamp: Date;
      sentiment: string;
      topics: string[];
    }[];
    stats: {
      wordCount: number;
      sentiment: Record<string, number>;
    };
  }[];
  totalChunks: number;
  totalWords: number;
}

interface HourlyContext {
  chatroomName: string;
  dayNumber: number;
  hour: number;
  chunks: {
    id: string;
    text: string;
    startTimestamp: Date;
    endTimestamp: Date;
    sentiment: string;
    topics: string[];
  }[];
  stats: {
    wordCount: number;
    sentiment: Record<string, number>;
  };
}

interface SemanticSearchResult {
  chunks: {
    id: string;
    text: string;
    score: number;
    date: string;
    hour: number;
    sentiment: string;
    topics: string[];
  }[];
  query: string;
}

/**
 * Get daily structured context (not raw dump)
 * Now retrieves context by day number instead of date
 */
export async function getDailyContext(userId: string, dayNumber: number): Promise<DailyContext | null> {
  const chatroom = await TranscriptChatroom.findOne({ userId, dayNumber });
  if (!chatroom) return null;

  const segments = await TranscriptSegment.find({ chatroomId: chatroom._id })
    .sort({ hour: 1 })
    .lean();

  const result: DailyContext = {
    chatroomName: chatroom.name,
    dayNumber: chatroom.dayNumber,
    startTime: chatroom.startTime,
    endTime: chatroom.endTime,
    segments: [],
    totalChunks: 0,
    totalWords: 0,
  };

  for (const segment of segments) {
    const chunks = await TranscriptChunk.find({ segmentId: segment._id })
      .sort({ timestamp: 1 })
      .select('text timestamp sentiment topics')
      .lean();

    result.segments.push({
      hour: segment.hour,
      chunks: chunks.map(c => ({
        text: c.text,
        startTimestamp: c.timestamp,
        endTimestamp: c.timestamp,
        sentiment: c.sentiment,
        topics: c.topics,
      })),
      stats: {
        wordCount: segment.stats.wordCount,
        sentiment: segment.stats.sentiment,
      },
    });

    result.totalChunks += chunks.length;
    result.totalWords += segment.stats.wordCount;
  }

  return result;
}

/**
 * Get hourly context
 * Now works with day number instead of date
 */
export async function getHourlyContext(
  userId: string,
  dayNumber: number,
  hour: number
): Promise<HourlyContext | null> {
  const chatroom = await TranscriptChatroom.findOne({ userId, dayNumber });
  if (!chatroom) return null;

  const segment = await TranscriptSegment.findOne({ chatroomId: chatroom._id, hour });
  if (!segment) return null;

  const chunks = await TranscriptChunk.find({ segmentId: segment._id })
    .sort({ timestamp: 1 })
    .lean();

  return {
    chatroomName: chatroom.name,
    dayNumber: chatroom.dayNumber,
    hour,
    chunks: chunks.map(c => ({
      id: c._id.toString(),
      text: c.text,
      startTimestamp: c.timestamp,
      endTimestamp: c.timestamp,
      sentiment: c.sentiment,
      topics: c.topics,
    })),
    stats: {
      wordCount: segment.stats.wordCount,
      sentiment: segment.stats.sentiment,
    },
  };
}

/**
 * Semantic search across transcripts using ChromaDB
 */
export async function semanticSearchTranscripts(
  userId: string,
  query: string,
  options?: { date?: string; limit?: number }
): Promise<SemanticSearchResult> {
  const filters: Partial<ChromaMetadata> = { userId };
  if (options?.date) filters.date = options.date;

  const results = await semanticSearch(query, filters, options?.limit || 10);

  return {
    query,
    chunks: results.map(r => ({
      id: r.id,
      text: r.text,
      score: r.score,
      date: r.metadata.date,
      hour: r.metadata.hour,
      sentiment: r.metadata.sentiment,
      topics: r.metadata.topics.split(',').filter(t => t.length > 0),
    })),
  };
}

/**
 * Find similar events/chunks to a given chunk using ChromaDB
 */
export async function findSimilarEvents(
  userId: string,
  chunkId: string,
  limit = 10
) {
  const chunk = await TranscriptChunk.findById(chunkId);
  if (!chunk) {
    return { chunks: [], sourceChunk: null };
  }

  const results = await findSimilarChunks(chunk.embeddingId, { userId }, limit);

  return {
    sourceChunk: {
      id: chunk._id.toString(),
      text: chunk.text,
      date: chunk.timestamp.toISOString().split('T')[0],
    },
    chunks: results.map(r => ({
      id: r.id,
      text: r.text,
      score: r.score,
      date: r.metadata.date,
      hour: r.metadata.hour,
    })),
  };
}

/**
 * Get user's chatroom history
 */
export async function getUserChatrooms(userId: string, limit = 30) {
  return TranscriptChatroom.find({ userId })
    .sort({ dayNumber: -1 })
    .limit(limit)
    .select('name dayNumber startTime endTime createdAt updatedAt')
    .lean();
}

/**
 * Get chatroom by timestamp
 */
export async function getChatroomByTimestamp(userId: string, timestamp: Date) {
  return TranscriptChatroom.findOne({
    userId,
    startTime: { $lte: timestamp },
    endTime: { $gt: timestamp },
  }).lean();
}

/**
 * Get current active chatroom (most recent)
 */
export async function getCurrentChatroom(userId: string) {
  return TranscriptChatroom.findOne({ userId })
    .sort({ dayNumber: -1 })
    .lean();
}
