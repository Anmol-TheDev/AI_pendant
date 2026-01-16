import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 24-hour window chatroom for transcript storage
 * Chatrooms are created based on 24-hour windows from the first transcript
 * Named as "Day 1", "Day 2", etc.
 */
export interface ITranscriptChatroom extends Document {
  userId: mongoose.Types.ObjectId;
  name: string; // "Day 1", "Day 2", etc.
  dayNumber: number; // 1, 2, 3, etc.
  startTime: Date; // Start of 24-hour window
  endTime: Date; // End of 24-hour window (startTime + 24 hours)
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptChatroomModel extends Model<ITranscriptChatroom> {
  getOrCreateForTimestamp(userId: string, timestamp: Date): Promise<ITranscriptChatroom>;
}

const TranscriptChatroomSchema = new Schema<ITranscriptChatroom>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: one chatroom per user per day number
TranscriptChatroomSchema.index({ userId: 1, dayNumber: 1 }, { unique: true });

// Index for efficient time-based queries
TranscriptChatroomSchema.index({ userId: 1, startTime: 1, endTime: 1 });

// Static method to get or create chatroom based on timestamp
TranscriptChatroomSchema.statics.getOrCreateForTimestamp = async function (
  userId: string,
  timestamp: Date
): Promise<ITranscriptChatroom> {
  // Try to find an existing chatroom that contains this timestamp
  let chatroom = await this.findOne({
    userId,
    startTime: { $lte: timestamp },
    endTime: { $gt: timestamp },
  });

  if (chatroom) {
    return chatroom;
  }

  // No existing chatroom found, need to create a new one
  // Find the highest day number for this user
  const lastChatroom = await this.findOne({ userId })
    .sort({ dayNumber: -1 })
    .select('dayNumber endTime')
    .lean();

  let dayNumber: number;
  let startTime: Date;

  if (!lastChatroom) {
    // First chatroom for this user
    dayNumber = 1;
    startTime = timestamp;
  } else {
    // Check if timestamp is after the last chatroom's end time
    if (timestamp >= lastChatroom.endTime) {
      dayNumber = lastChatroom.dayNumber + 1;
      startTime = lastChatroom.endTime;
    } else {
      // Timestamp is before the last chatroom - this shouldn't happen in normal flow
      // but handle it by creating a new chatroom anyway
      dayNumber = lastChatroom.dayNumber + 1;
      startTime = timestamp;
    }
  }

  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  const name = `Day ${dayNumber}`;

  chatroom = await this.create({
    userId,
    name,
    dayNumber,
    startTime,
    endTime,
  });

  return chatroom;
};

export const TranscriptChatroom = mongoose.model<ITranscriptChatroom, TranscriptChatroomModel>(
  'TranscriptChatroom',
  TranscriptChatroomSchema
);
