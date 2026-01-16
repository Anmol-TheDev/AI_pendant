import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Hourly segment within a daily chatroom
 * Buckets chunks by hour (0-23)
 */
export interface ISegmentStats {
  wordCount: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topicDistribution: Map<string, number>;
}

export interface ITranscriptSegment extends Document {
  chatroomId: mongoose.Types.ObjectId;
  hour: number; // 0-23
  startTime: Date;
  endTime: Date;
  stats: ISegmentStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptSegmentModel extends Model<ITranscriptSegment> {
  getOrCreateForChatroomHour(
    chatroomId: string,
    hour: number,
    timestamp: Date
  ): Promise<ITranscriptSegment>;
}

const TranscriptSegmentSchema = new Schema<ITranscriptSegment>(
  {
    chatroomId: {
      type: Schema.Types.ObjectId,
      ref: 'TranscriptChatroom',
      required: true,
      index: true,
    },
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    stats: {
      wordCount: { type: Number, default: 0 },
      sentiment: {
        positive: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 },
        negative: { type: Number, default: 0 },
      },
      topicDistribution: { type: Map, of: Number, default: new Map() },
    },
  },
  { timestamps: true }
);

// Compound unique index: one segment per chatroom per hour
TranscriptSegmentSchema.index({ chatroomId: 1, hour: 1 }, { unique: true });

// Static method to get or create segment
TranscriptSegmentSchema.statics.getOrCreateForChatroomHour = async function (
  chatroomId: string,
  hour: number,
  timestamp: Date
): Promise<ITranscriptSegment> {
  let segment = await this.findOne({ chatroomId, hour });
  if (!segment) {
    segment = await this.create({
      chatroomId,
      hour,
      startTime: timestamp,
      endTime: timestamp,
      stats: {
        wordCount: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        topicDistribution: new Map(),
      },
    });
  }
  return segment;
};

export const TranscriptSegment = mongoose.model<ITranscriptSegment, TranscriptSegmentModel>(
  'TranscriptSegment',
  TranscriptSegmentSchema
);
