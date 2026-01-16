import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for daily chatroom
 * Simple 1-on-1 chat between user and AI
 * Each chatroom is associated with a specific day
 */
export interface IChatroom extends Document {
    date: Date; // Date (YYYY-MM-DD) - set to start of day
    name: string; // e.g., "Daily Chat - 2026-01-11"
    description?: string;
    isActive: boolean; // Whether the chatroom is currently active
    stats: {
        totalMessages: number;
        lastMessageAt?: Date;
    };
    metadata?: {
        tags?: string[];
        category?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ChatroomSchema = new Schema<IChatroom>(
    {
        date: {
            type: Date,
            required: true,
            unique: true, // One chatroom per day
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        stats: {
            totalMessages: {
                type: Number,
                default: 0,
            },
            lastMessageAt: { type: Date },
        },
        metadata: {
            tags: [{ type: String }],
            category: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding active chatrooms
ChatroomSchema.index({ isActive: 1, date: -1 });

// Static method to get or create chatroom for a specific date
ChatroomSchema.statics.getOrCreateForDate = async function (date: Date) {
    // Normalize to start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let chatroom = await this.findOne({ date: startOfDay });

    if (!chatroom) {
        const formattedDate = startOfDay.toISOString().split('T')[0];
        chatroom = await this.create({
            date: startOfDay,
            name: `Daily Chat - ${formattedDate}`,
            description: `Chat with AI for ${formattedDate}`,
            isActive: true,
        });
    }

    return chatroom;
};

export const Chatroom = mongoose.model<IChatroom>('Chatroom', ChatroomSchema);
