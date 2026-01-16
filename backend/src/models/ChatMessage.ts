import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for chat messages within a chatroom
 */
export interface IChatMessage extends Document {
    chatroomId: mongoose.Types.ObjectId; // Reference to Chatroom
    userId?: mongoose.Types.ObjectId; // Reference to User (optional for system messages)
    messageType: 'user' | 'system' | 'transcription'; // Type of message
    content: string; // Message content
    metadata?: {
        transcriptionId?: mongoose.Types.ObjectId; // Link to transcription if message is from audio
        replyTo?: mongoose.Types.ObjectId; // Reference to another message if this is a reply
        reactions?: {
            emoji: string;
            users: mongoose.Types.ObjectId[];
        }[];
        isEdited?: boolean;
        editedAt?: Date;
    };

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        chatroomId: {
            type: Schema.Types.ObjectId,
            ref: 'Chatroom',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        messageType: {
            type: String,
            enum: ['user', 'system', 'transcription'],
            default: 'user',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        metadata: {
            transcriptionId: {
                type: Schema.Types.ObjectId,
                ref: 'Transcription',
            },
            replyTo: {
                type: Schema.Types.ObjectId,
                ref: 'ChatMessage',
            },
            reactions: [
                {
                    emoji: { type: String },
                    users: [
                        {
                            type: Schema.Types.ObjectId,
                            ref: 'User',
                        },
                    ],
                },
            ],
            isEdited: {
                type: Boolean,
                default: false,
            },
            editedAt: { type: Date },
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient chatroom message queries
ChatMessageSchema.index({ chatroomId: 1, createdAt: -1 });

// Index for finding messages by user
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

// Text index for searching message content
ChatMessageSchema.index({ content: 'text' });

// Post-save hook to update chatroom stats
ChatMessageSchema.post('save', async function () {
    const Chatroom = mongoose.model('Chatroom');
    await Chatroom.findByIdAndUpdate(this.chatroomId, {
        'stats.lastMessageAt': this.createdAt,
        $inc: { 'stats.totalMessages': 1 },
    });
});

export const ChatMessage = mongoose.model<IChatMessage>(
    'ChatMessage',
    ChatMessageSchema
);
