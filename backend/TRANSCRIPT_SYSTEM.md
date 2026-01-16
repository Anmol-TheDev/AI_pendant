# Transcript Storage & AI Query System

## Overview

A scalable backend system for storing continuous transcript text, segmented by day/hour, and indexed for semantic AI querying using MongoDB + Vector DB.

**Important**: This system receives transcript chunks from an external transcription microservice. We do NOT implement transcription.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External STT Service                      │
│              (Provides transcript chunks)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  POST /api/transcripts/ingest                │
│                    (Ingestion Pipeline)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ MongoDB │    │ NLP      │    │ Vector   │
   │ Storage │    │ Analysis │    │ DB       │
   └─────────┘    └──────────┘    └──────────┘
        │                │                │
        └────────────────┴────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Context & Summary API Endpoints                 │
│  /context/daily | /context/search | /summary/daily          │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### 1. TranscriptChatroom (Daily Container)
```typescript
{
  _id: ObjectId,
  userId: ObjectId,          // Reference to User
  date: "2026-01-12",        // YYYY-MM-DD format
  createdAt: Date,
  updatedAt: Date
}
```
- **One chatroom per user per day**
- Unique index: `(userId, date)`

### 2. TranscriptSegment (Hourly Bucket)
```typescript
{
  _id: ObjectId,
  chatroomId: ObjectId,      // Reference to TranscriptChatroom
  hour: 14,                  // 0-23
  startTime: Date,
  endTime: Date,
  stats: {
    wordCount: 1250,
    sentiment: {
      positive: 15,
      neutral: 42,
      negative: 3
    },
    topicDistribution: {
      "work": 12,
      "meeting": 8,
      "project": 5
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```
- **One segment per chatroom per hour**
- Unique index: `(chatroomId, hour)`

### 3. TranscriptChunk (Text + Metadata)
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  chatroomId: ObjectId,
  segmentId: ObjectId,
  text: "I went to the gym this morning...",
  startTimestamp: Date,
  endTimestamp: Date,
  durationSec: 15.3,
  sentiment: "positive",     // positive | neutral | negative
  topics: ["gym", "morning", "workout"],
  embeddingId: "uuid-v4",    // Vector DB reference
  createdAt: Date
}
```
- Indexes: `(userId, startTimestamp)`, `(chatroomId, startTimestamp)`, `(segmentId, startTimestamp)`

### 4. Vector DB Record
```typescript
{
  id: "uuid-v4",
  vector: [0.123, -0.456, ...],  // 768-dimensional embedding
  metadata: {
    userId: "...",
    chatroomId: "...",
    segmentId: "...",
    date: "2026-01-12",
    hour: 14,
    sentiment: "positive",
    topics: ["gym", "workout"]
  },
  text: "I went to the gym this morning..."
}
```

## API Endpoints

### Ingestion

#### POST `/api/transcripts/ingest`
Ingest a transcript chunk from external STT service.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "text": "I went to the gym this morning and had a great workout",
  "startTimestamp": "2026-01-12T14:30:00.000Z",
  "endTimestamp": "2026-01-12T14:30:15.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transcript chunk ingested successfully",
  "data": {
    "chunkId": "...",
    "chatroomId": "...",
    "segmentId": "...",
    "embeddingId": "..."
  }
}
```

**Pipeline Steps:**
1. Resolve/create daily chatroom
2. Resolve/create hourly segment
3. Run NLP analysis (sentiment + topics)
4. Generate embedding & store in Vector DB
5. Store chunk in MongoDB
6. Update segment stats
7. Update chatroom timestamp

### Context Retrieval

#### GET `/api/transcripts/context/daily`
Get structured daily context (not raw dump).

**Query Params:**
- `userId` (required): User ID
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-12",
    "segments": [
      {
        "hour": 14,
        "chunks": [
          {
            "text": "...",
            "startTimestamp": "...",
            "endTimestamp": "...",
            "sentiment": "positive",
            "topics": ["gym", "workout"]
          }
        ],
        "stats": {
          "wordCount": 1250,
          "sentiment": { "positive": 15, "neutral": 42, "negative": 3 }
        }
      }
    ],
    "totalChunks": 60,
    "totalWords": 15000
  }
}
```

#### GET `/api/transcripts/context/hour`
Get hourly segment context.

**Query Params:**
- `userId` (required)
- `date` (required): YYYY-MM-DD
- `hour` (required): 0-23

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-12",
    "hour": 14,
    "chunks": [...],
    "stats": {...}
  }
}
```

#### GET `/api/transcripts/context/search`
Semantic search across transcripts.

**Query Params:**
- `userId` (required)
- `query` (required): Search query text
- `date` (optional): Filter by date (YYYY-MM-DD)
- `limit` (optional): Max results (default: 10, max: 100)

**Example:**
```
GET /api/transcripts/context/search?userId=xxx&query=gym%20conversation&date=2026-01-12&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "gym conversation",
    "chunks": [
      {
        "id": "...",
        "text": "I went to the gym this morning...",
        "score": 0.89,
        "date": "2026-01-12",
        "hour": 14,
        "sentiment": "positive",
        "topics": ["gym", "workout"]
      }
    ]
  }
}
```

#### GET `/api/transcripts/context/similar`
Find similar events to a given chunk.

**Query Params:**
- `userId` (required)
- `chunkId` (required): Source chunk ID
- `limit` (optional): Max results (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "sourceChunk": {
      "id": "...",
      "text": "...",
      "date": "2026-01-12"
    },
    "chunks": [
      {
        "id": "...",
        "text": "...",
        "score": 0.85,
        "date": "2026-01-10",
        "hour": 15
      }
    ]
  }
}
```

### Summaries

#### GET `/api/transcripts/summary/daily`
Generate AI-powered daily summary.

**Query Params:**
- `userId` (required)
- `date` (required): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-12",
    "summary": "The day started with a morning workout...",
    "highlights": [
      "Morning gym session",
      "Team meeting about project deadline",
      "Lunch with colleagues"
    ],
    "topTopics": ["gym", "work", "meeting", "project"],
    "sentiment": "positive",
    "wordCount": 15000
  }
}
```

#### GET `/api/transcripts/summary/weekly`
Generate weekly summary from 7 daily summaries.

**Query Params:**
- `userId` (required)
- `endDate` (required): End date (YYYY-MM-DD), will include 7 days before

**Response:**
```json
{
  "success": true,
  "data": {
    "startDate": "2026-01-06",
    "endDate": "2026-01-12",
    "summary": "This week was focused on...",
    "dailySummaries": [...],
    "trends": [
      "Increased focus on fitness",
      "More team collaboration",
      "Project deadline approaching"
    ],
    "topTopics": ["work", "gym", "meeting", "project", "team"]
  }
}
```

#### GET `/api/transcripts/chatrooms`
Get user's chatroom history.

**Query Params:**
- `userId` (required)
- `limit` (optional): Max results (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "chatrooms": [
      {
        "_id": "...",
        "userId": "...",
        "date": "2026-01-12",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

## System Behavior (Step-by-Step)

### Ingestion Flow

1. **Receive transcript chunk** via `/ingest` endpoint
2. **Resolve chatroom**: Create one per `userId + date`
3. **Resolve segment bucket**: Bucket by hour using timestamp
4. **Store chunk in MongoDB**
5. **Run lightweight NLP tagging**:
   - Sentiment (positive/neutral/negative)
   - Topics (LLM or keyword-based)
6. **Generate embedding** using Gemini text-embedding-004
7. **Store vector + metadata in Vector DB**
8. **Update hourly segment stats**:
   - wordCount
   - sentiment distribution
   - topicDistribution
9. **Update chatroom updatedAt**

## Scalability

### Design for 1.5M+ chunks/year/user

**Storage Calculation:**
- 1.5M chunks/year = ~4,110 chunks/day
- Average chunk: ~100 words = ~500 bytes text
- With metadata: ~1KB per chunk
- Daily storage: ~4MB/day/user
- Yearly storage: ~1.5GB/year/user

**Indexes:**
- Compound indexes on `(userId, date)`, `(chatroomId, hour)`
- Time-based indexes for efficient range queries
- Text index for basic search (fallback)

**Vector DB:**
- In-memory store (current implementation)
- Can be swapped for Chroma/Pinecone/Weaviate/Milvus
- Embeddings: 768 dimensions (Gemini text-embedding-004)

## Services Architecture

### 1. `transcript.service.ts`
- Main ingestion pipeline
- Chunk storage and retrieval
- Time-range queries

### 2. `nlp.service.ts`
- Sentiment analysis (keyword-based + LLM)
- Topic extraction (LLM + fallback)
- Batch processing support

### 3. `vector.service.ts`
- Embedding generation (Gemini)
- Vector storage (in-memory, swappable)
- Semantic search
- Similarity search

### 4. `context.service.ts`
- Daily/hourly context retrieval
- Semantic search interface
- Similar events finder
- Chatroom history

### 5. `summary.service.ts`
- Daily summary generation (LLM)
- Weekly summary aggregation
- Trend analysis

## Environment Variables

Add to `.env`:
```bash
# Gemini AI (required for embeddings & summaries)
GEMINI_API_KEY=your_gemini_api_key_here
```

## Testing the System

### 1. Ingest a chunk
```bash
curl -X POST http://localhost:4000/api/transcripts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "text": "I went to the gym this morning and had a great workout",
    "startTimestamp": "2026-01-12T14:30:00.000Z",
    "endTimestamp": "2026-01-12T14:30:15.000Z"
  }'
```

### 2. Get daily context
```bash
curl "http://localhost:4000/api/transcripts/context/daily?userId=507f1f77bcf86cd799439011&date=2026-01-12"
```

### 3. Semantic search
```bash
curl "http://localhost:4000/api/transcripts/context/search?userId=507f1f77bcf86cd799439011&query=gym&limit=5"
```

### 4. Generate daily summary
```bash
curl "http://localhost:4000/api/transcripts/summary/daily?userId=507f1f77bcf86cd799439011&date=2026-01-12"
```

## Future Enhancements

### Vector DB Integration
Replace in-memory store with production vector DB:

**Chroma (Recommended for local/self-hosted):**
```typescript
import { ChromaClient } from 'chromadb';
const client = new ChromaClient();
const collection = await client.createCollection({ name: "transcripts" });
```

**Pinecone (Managed cloud):**
```typescript
import { PineconeClient } from '@pinecone-database/pinecone';
const pinecone = new PineconeClient();
await pinecone.init({ apiKey: process.env.PINECONE_API_KEY });
```

### Caching Layer
Add Redis for frequently accessed summaries:
```typescript
// Cache daily summaries for 24 hours
await redis.setex(`summary:${userId}:${date}`, 86400, JSON.stringify(summary));
```

### Batch Processing
Process multiple chunks in parallel:
```typescript
await Promise.all(chunks.map(chunk => ingestTranscript(chunk)));
```

### Privacy & Security
- Encryption at rest: MongoDB encryption
- Encryption in transit: TLS/SSL
- Access control: Clerk authentication
- Data retention: Automatic cleanup of old chunks

## File Structure

```
src/
├── models/
│   ├── TranscriptChatroom.ts    # Daily container
│   ├── TranscriptSegment.ts     # Hourly bucket
│   └── TranscriptChunk.ts       # Individual chunk
├── services/
│   ├── transcript.service.ts    # Ingestion pipeline
│   ├── nlp.service.ts           # Sentiment & topics
│   ├── vector.service.ts        # Embeddings & search
│   ├── context.service.ts       # Context retrieval
│   └── summary.service.ts       # LLM summaries
├── controllers/
│   └── transcript.controller.ts # API handlers
├── routes/
│   └── transcript.routes.ts     # Route definitions
└── schemas/
    └── transcript.schema.ts     # Zod validation
```

## Notes

- **No audio processing**: System only handles text chunks
- **External STT**: Transcription happens in separate microservice
- **Scalable design**: Handles 1.5M+ chunks/year/user
- **Time-based organization**: Daily chatrooms + hourly segments
- **Semantic search**: Vector embeddings for AI queries
- **LLM summaries**: Daily and weekly summaries
- **Metadata filtering**: Efficient time + semantic queries
