import mongoose, { Schema, Document } from 'mongoose';

/**
 * Individual transcript chunk (10-20 seconds of text)
 * Contains raw text + metadata + vector DB reference
 */
export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface ITranscriptChunk extends Document {
  chatroomId: mongoose.Types.ObjectId;
  segmentId: mongoose.Types.ObjectId;
  text: string;
  timestamp: Date;
  chunkNumber?: number; // Optional sequential chunk number
  sentiment: SentimentType;
  topics: string[];
  embeddingId: string; // Vector DB reference
  createdAt: Date;
}

const TranscriptChunkSchema = new Schema<ITranscriptChunk>(
  {
    chatroomId: {
      type: Schema.Types.ObjectId,
      ref: 'TranscriptChatroom',
      required: true,
      index: true,
    },
    segmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TranscriptSegment',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    chunkNumber: {
      type: Number,
      index: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
      index: true,
    },
    topics: {
      type: [String],
      default: [],
      index: true,
    },
    embeddingId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound indexes for efficient querying
TranscriptChunkSchema.index({ chatroomId: 1, timestamp: 1 });
TranscriptChunkSchema.index({ segmentId: 1, timestamp: 1 });
TranscriptChunkSchema.index({ chatroomId: 1, chunkNumber: 1 });

// Text index for basic text search
TranscriptChunkSchema.index({ text: 'text' });

export const TranscriptChunk = mongoose.model<ITranscriptChunk>(
  'TranscriptChunk',
  TranscriptChunkSchema
);
