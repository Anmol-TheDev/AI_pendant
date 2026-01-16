import mongoose from 'mongoose';
import { TranscriptChatroom } from '../models/TranscriptChatroom';
import { TranscriptSegment } from '../models/TranscriptSegment';
import { TranscriptChunk, SentimentType } from '../models/TranscriptChunk';
import { analyzeText } from './nlp.service';
import { addChunk } from './chroma.service';
import { logger } from '../utils';

/**
 * Transcript Ingestion Service
 * Handles the full ingestion pipeline for transcript chunks
 */

interface IngestInput {
  text: string;
  timestamp: Date;
  chunkNumber?: number;
}

interface IngestResult {
  chunkId: string;
  chatroomId: string;
  segmentId: string;
  embeddingId: string;
  chunkNumber?: number;
}

/**
 * Extract date string (YYYY-MM-DD) from timestamp
 */
function getDateString(timestamp: Date): string {
  return timestamp.toISOString().split('T')[0];
}

/**
 * Extract hour (0-23) from timestamp
 */
function getHour(timestamp: Date): number {
  return timestamp.getUTCHours();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Main ingestion function - processes a transcript chunk through the full pipeline
 */
export async function ingestTranscript(input: IngestInput): Promise<IngestResult> {
  const { text, timestamp, chunkNumber } = input;
  const date = getDateString(timestamp);
  const hour = getHour(timestamp);

  logger.info('Ingesting transcript chunk', { timestamp, hour, chunkNumber });

  try {
    // Step 1: Resolve chatroom (create if needed) - automatically based on timestamp
    const defaultUserId = new mongoose.Types.ObjectId('000000000000000000000000');
    const chatroom = await TranscriptChatroom.getOrCreateForTimestamp(defaultUserId.toString(), timestamp);

    // Step 2: Resolve segment bucket (create if needed)
    const segment = await TranscriptSegment.getOrCreateForChatroomHour(
      chatroom._id.toString(),
      hour,
      timestamp
    );

    // Step 3: Run NLP analysis
    const { sentiment, topics } = await analyzeText(text);

    // Step 4: Generate a temporary ID for the chunk (will be the MongoDB _id)
    const tempChunkId = new mongoose.Types.ObjectId();
    const embeddingId = tempChunkId.toString();

    // Step 5: Store chunk in MongoDB with the pre-generated ID
    const chunk = await TranscriptChunk.create({
      _id: tempChunkId,
      chatroomId: chatroom._id,
      segmentId: segment._id,
      text,
      timestamp,
      chunkNumber,
      sentiment,
      topics,
      embeddingId,
    });

    // Step 6: Store in ChromaDB with chunk ID as embedding ID
    await addChunk(embeddingId, text, {
      userId: defaultUserId.toString(),
      chatroomId: chatroom._id.toString(),
      chatroomName: chatroom.name,
      dayNumber: chatroom.dayNumber.toString(),
      segmentId: segment._id.toString(),
      date,
      hour,
      sentiment,
      topics,
      timestamp: timestamp.toISOString(),
    });

    // Step 7: Update segment stats
    await updateSegmentStats(segment._id.toString(), text, sentiment, topics, timestamp);

    // Step 8: Update chatroom updatedAt
    await TranscriptChatroom.findByIdAndUpdate(chatroom._id, { updatedAt: new Date() });

    logger.info('Transcript chunk ingested successfully', { chunkId: chunk._id, chunkNumber });

    return {
      chunkId: chunk._id.toString(),
      chatroomId: chatroom._id.toString(),
      segmentId: segment._id.toString(),
      embeddingId,
      chunkNumber,
    };
  } catch (error) {
    logger.error('Error in transcript ingestion pipeline', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      date, 
      hour,
      chunkNumber
    });
    throw error;
  }
}

/**
 * Update segment statistics after adding a chunk
 */
async function updateSegmentStats(
  segmentId: string,
  text: string,
  sentiment: SentimentType,
  topics: string[],
  timestamp: Date
): Promise<void> {
  const wordCount = countWords(text);
  
  const incOps: Record<string, number> = {
    'stats.wordCount': wordCount,
    [`stats.sentiment.${sentiment}`]: 1,
  };

  // Update topic distribution
  for (const topic of topics) {
    incOps[`stats.topicDistribution.${topic}`] = 1;
  }

  await TranscriptSegment.findByIdAndUpdate(segmentId, {
    $inc: incOps,
    $max: { endTime: timestamp },
  });
}

/**
 * Get chunks for a specific day (by day number)
 */
export async function getDailyChunks(userId: string, dayNumber: number) {
  const chatroom = await TranscriptChatroom.findOne({ 
    userId: new mongoose.Types.ObjectId(userId), 
    dayNumber 
  });
  if (!chatroom) return [];

  return TranscriptChunk.find({ chatroomId: chatroom._id })
    .sort({ timestamp: 1 })
    .lean();
}

/**
 * Get chunks for a specific hour within a day
 */
export async function getHourlyChunks(userId: string, dayNumber: number, hour: number) {
  const chatroom = await TranscriptChatroom.findOne({ 
    userId: new mongoose.Types.ObjectId(userId), 
    dayNumber 
  });
  if (!chatroom) return [];

  const segment = await TranscriptSegment.findOne({ chatroomId: chatroom._id, hour });
  if (!segment) return [];

  return TranscriptChunk.find({ segmentId: segment._id })
    .sort({ timestamp: 1 })
    .lean();
}

/**
 * Get chunks within a time range
 */
export async function getChunksByTimeRange(
  startTime: Date,
  endTime: Date
) {
  return TranscriptChunk.find({
    timestamp: { $gte: startTime, $lte: endTime },
  })
    .sort({ timestamp: 1 })
    .lean();
}
