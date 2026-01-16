import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for individual audio transcription entry
 */
export interface ITranscriptionEntry {
    audioTimestamp: Date; // Original timestamp from Raspberry Pi
    transcribedText: string;
    audioMetadata?: {
        duration?: number; // in seconds
        fileSize?: number; // in bytes
        format?: string; // e.g., 'wav', 'mp3'
        sampleRate?: number;
    };
    processingMetadata?: {
        processedAt: Date;
        serviceVersion?: string;
        confidence?: number; // transcription confidence score
    };
}

/**
 * Interface for hourly transcription document
 * Each document represents one hour of audio transcriptions for a specific day
 */
export interface ITransription extends Document {
    date: Date; // Date (YYYY-MM-DD) - set to start of day
    hour: number; // Hour (0-23)
    entries: ITranscriptionEntry[]; // All transcriptions within this hour
    stats: {
        totalEntries: number;
        firstEntryAt?: Date;
        lastEntryAt?: Date;
        totalDuration?: number; // total audio duration in seconds
    };
    createdAt: Date;
    updatedAt: Date;
}

const TranscriptionEntrySchema = new Schema<ITranscriptionEntry>(
    {
        audioTimestamp: {
            type: Date,
            required: true,
            index: true,
        },
        transcribedText: {
            type: String,
            required: true,
            trim: true,
        },
        audioMetadata: {
            duration: { type: Number },
            fileSize: { type: Number },
            format: { type: String },
            sampleRate: { type: Number },
        },
        processingMetadata: {
            processedAt: {
                type: Date,
                default: Date.now,
            },
            serviceVersion: { type: String },
            confidence: {
                type: Number,
                min: 0,
                max: 1,
            },
        },
    },
    { _id: false }
);

const TranscriptionSchema = new Schema<ITransription>(
    {
        date: {
            type: Date,
            required: true,
            index: true,
        },
        hour: {
            type: Number,
            required: true,
            min: 0,
            max: 23,
            index: true,
        },
        entries: [TranscriptionEntrySchema],
        stats: {
            totalEntries: {
                type: Number,
                default: 0,
            },
            firstEntryAt: { type: Date },
            lastEntryAt: { type: Date },
            totalDuration: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

// Compound index for efficient querying by date and hour
TranscriptionSchema.index({ date: 1, hour: 1 }, { unique: true });

// Index for searching transcribed text
TranscriptionSchema.index({ 'entries.transcribedText': 'text' });

// Pre-save hook to update stats
TranscriptionSchema.pre('save', function () {
    if (this.entries && this.entries.length > 0) {
        this.stats.totalEntries = this.entries.length;
        this.stats.firstEntryAt = this.entries[0].audioTimestamp;
        this.stats.lastEntryAt = this.entries[this.entries.length - 1].audioTimestamp;

        // Calculate total duration if available
        const totalDuration = this.entries.reduce((sum, entry) => {
            return sum + (entry.audioMetadata?.duration || 0);
        }, 0);
        this.stats.totalDuration = totalDuration;
    }
});

export const Transcription = mongoose.model<ITransription>(
    'Transcription',
    TranscriptionSchema
);
