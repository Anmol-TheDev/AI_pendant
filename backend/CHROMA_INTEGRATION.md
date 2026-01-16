# ChromaDB Integration Guide

## Overview

This system integrates ChromaDB as a vector database for semantic search and context retrieval of transcript chunks. The architecture combines MongoDB for structured data storage and ChromaDB for vector embeddings.

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
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│    MongoDB       │           │    ChromaDB      │
│                  │           │                  │
│ • Raw text       │           │ • Embeddings     │
│ • Metadata       │           │ • Metadata       │
│ • Timestamps     │           │ • Vectors        │
│ • Relationships  │           │                  │
└──────────────────┘           └──────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Query & Context Retrieval APIs                  │
│  • Daily/Hourly Context                                      │
│  • Semantic Search                                           │
│  • Similar Events                                            │
│  • AI Summaries                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Ingestion Pipeline

```typescript
POST /api/transcripts/ingest
{
  "userId": "679f1f77bcf86cd799439011",
  "text": "I went to the gym this morning...",
  "startTimestamp": "2026-01-12T08:15:00.000Z",
  "endTimestamp": "2026-01-12T08:15:15.000Z"
}
```

**Processing Steps:**
1. Resolve/create daily chatroom (1 per user per day)
2. Resolve/create hourly segment (0-23)
3. Run NLP analysis (sentiment + topics)
4. Store chunk in MongoDB
5. Generate embedding (768-dim vector)
6. Store in ChromaDB with metadata
7. Update segment statistics

### 2. Data Models

#### MongoDB Collections

**TranscriptChatroom** (Daily container)
```typescript
{
  userId: ObjectId,
  date: "2026-01-12",  // YYYY-MM-DD
  createdAt: Date,
  updatedAt: Date
}
```

**TranscriptSegment** (Hourly bucket)
```typescript
{
  chatroomId: ObjectId,
  hour: 14,  // 0-23
  startTime: Date,
  endTime: Date,
  stats: {
    wordCount: 320,
    sentiment: { positive: 5, neutral: 2, negative: 1 },
    topicDistribution: { gym: 3, workout: 2 }
  }
}
```

**TranscriptChunk** (Individual text segment)
```typescript
{
  userId: ObjectId,
  chatroomId: ObjectId,
  segmentId: ObjectId,
  text: "I went to the gym...",
  startTimestamp: Date,
  endTimestamp: Date,
  durationSec: 15,
  sentiment: "positive",
  topics: ["gym", "workout"],
  embeddingId: "chunk-id-string"
}
```

#### ChromaDB Collection

**Collection Name:** `audio_chunks`

**Metadata Schema:**
```typescript
{
  userId: string,
  chatroomId: string,
  segmentId: string,
  date: "2026-01-12",
  hour: 14,
  sentiment: "positive",
  topics: "gym,workout,morning",  // comma-separated
  timestamp: "2026-01-12T08:15:00.000Z"
}
```

**Vector:** 768-dimensional embedding from Gemini text-embedding-004

## Installation & Setup

### 1. Install Dependencies

```bash
npm install chromadb @google/generative-ai
```

Already installed in package.json:
- `chromadb`: ^3.2.0
- `@google/generative-ai`: ^0.24.1

### 2. Environment Variables

Add to `.env`:
```bash
# ChromaDB Configuration
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=audio_chunks

# Gemini AI (for embeddings)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Docker Setup

#### Option A: Docker Compose (Recommended)

```bash
# Start all services (MongoDB + ChromaDB + API)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The `docker-compose.yml` includes:
- MongoDB on port 27017
- ChromaDB on port 8000
- API service on port 4000

#### Option B: Local ChromaDB

```bash
# Install ChromaDB locally
pip install chromadb

# Run ChromaDB server
chroma run --path ./chroma_data --port 8000
```

### 4. Verify Installation

```bash
# Check ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Expected response: timestamp in nanoseconds
```

## API Endpoints

### Ingestion

**POST /api/transcripts/ingest**
```bash
curl -X POST http://localhost:4000/api/transcripts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "679f1f77bcf86cd799439011",
    "text": "I went to the gym this morning and had a great workout.",
    "startTimestamp": "2026-01-12T08:15:00.000Z",
    "endTimestamp": "2026-01-12T08:15:15.000Z"
  }'
```

### Context Retrieval

**GET /api/transcripts/context/daily**
```bash
curl "http://localhost:4000/api/transcripts/context/daily?userId=679f1f77bcf86cd799439011&date=2026-01-12"
```

**GET /api/transcripts/context/hour**
```bash
curl "http://localhost:4000/api/transcripts/context/hour?userId=679f1f77bcf86cd799439011&date=2026-01-12&hour=14"
```

### Semantic Search

**GET /api/transcripts/context/search**
```bash
# Basic search
curl "http://localhost:4000/api/transcripts/context/search?userId=679f1f77bcf86cd799439011&query=gym+workout"

# With date filter
curl "http://localhost:4000/api/transcripts/context/search?userId=679f1f77bcf86cd799439011&query=gym&date=2026-01-12&limit=5"
```

**GET /api/transcripts/context/similar**
```bash
curl "http://localhost:4000/api/transcripts/context/similar?userId=679f1f77bcf86cd799439011&chunkId=679f1f77bcf86cd799439012&limit=10"
```

### Summaries

**GET /api/transcripts/summary/daily**
```bash
curl "http://localhost:4000/api/transcripts/summary/daily?userId=679f1f77bcf86cd799439011&date=2026-01-12"
```

**GET /api/transcripts/summary/weekly**
```bash
curl "http://localhost:4000/api/transcripts/summary/weekly?userId=679f1f77bcf86cd799439011&endDate=2026-01-12"
```

## Code Examples

### Embedding Generation

```typescript
import { generateEmbedding } from './services/embedding.service';

// Generate single embedding
const vector = await generateEmbedding("I went to the gym");
// Returns: number[] (768 dimensions)

// Batch generation
const vectors = await batchGenerateEmbeddings([
  "Text 1",
  "Text 2",
  "Text 3"
]);
```

### ChromaDB Operations

```typescript
import { addChunk, semanticSearch } from './services/chroma.service';

// Add chunk
await addChunk('chunk-id', 'I went to the gym', {
  userId: 'user-123',
  chatroomId: 'chatroom-456',
  segmentId: 'segment-789',
  date: '2026-01-12',
  hour: 8,
  sentiment: 'positive',
  topics: ['gym', 'workout'],
  timestamp: '2026-01-12T08:15:00.000Z'
});

// Semantic search
const results = await semanticSearch('gym workout', {
  userId: 'user-123',
  date: '2026-01-12'
}, 10);

// Results include: id, text, score, metadata
```

### Query Patterns

```typescript
// A. Simple semantic search
const results = await semanticSearch("gym");

// B. Filter by date
const results = await semanticSearch("meeting", {
  date: "2026-01-12"
});

// C. Filter by user + hour
const results = await semanticSearch("coffee", {
  userId: "user-123",
  hour: 14
});

// D. Find similar chunks
const similar = await findSimilarChunks("chunk-id", {
  userId: "user-123"
}, 10);
```

## Production Considerations

### 1. Persistence

ChromaDB data is persisted in Docker volume `chroma-data`:
```yaml
volumes:
  chroma-data:
```

**Backup Strategy:**
```bash
# Backup ChromaDB data
docker run --rm -v chroma-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/chroma-backup.tar.gz /data

# Restore
docker run --rm -v chroma-data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/chroma-backup.tar.gz -C /
```

### 2. Scaling

**Horizontal Scaling:**
- Use ChromaDB Cloud or self-hosted cluster
- Implement connection pooling
- Add Redis caching layer

**Vertical Scaling:**
- Increase ChromaDB memory allocation
- Use SSD storage for better performance
- Optimize batch sizes

### 3. Performance Tuning

**Batch Operations:**
```typescript
// Instead of individual inserts
for (const chunk of chunks) {
  await addChunk(chunk.id, chunk.text, chunk.metadata);
}

// Use batch insert
await batchAddChunks(chunks);
```

**Caching:**
```typescript
// Cache frequent queries in Redis
const cacheKey = `search:${userId}:${query}`;
let results = await redis.get(cacheKey);
if (!results) {
  results = await semanticSearch(query, { userId });
  await redis.setex(cacheKey, 3600, JSON.stringify(results));
}
```

### 4. Monitoring

**Health Checks:**
```typescript
// Check ChromaDB health
const stats = await getCollectionStats();
console.log(`Total vectors: ${stats.count}`);

// Monitor embedding generation
logger.info('Embedding generated', {
  textLength: text.length,
  vectorDimensions: vector.length,
  duration: Date.now() - startTime
});
```

### 5. Error Handling

```typescript
try {
  await addChunk(id, text, metadata);
} catch (error) {
  logger.error('Failed to add chunk to ChromaDB', { error, id });
  // Fallback: store in MongoDB only
  // Queue for retry
}
```

## Folder Structure

```
src/
├── config/
│   ├── chroma.ts              # ChromaDB client initialization
│   ├── db.ts                  # MongoDB connection
│   └── index.ts               # App configuration
├── models/
│   ├── TranscriptChatroom.ts  # Daily chatroom model
│   ├── TranscriptSegment.ts   # Hourly segment model
│   └── TranscriptChunk.ts     # Chunk model
├── services/
│   ├── embedding.service.ts   # Embedding generation
│   ├── chroma.service.ts      # ChromaDB operations
│   ├── transcript.service.ts  # Ingestion pipeline
│   ├── context.service.ts     # Context retrieval
│   ├── summary.service.ts     # AI summaries
│   └── nlp.service.ts         # NLP analysis
├── controllers/
│   └── transcript.controller.ts
├── routes/
│   └── transcript.routes.ts
└── schemas/
    └── transcript.schema.ts
```

## Troubleshooting

### ChromaDB Connection Failed

```bash
# Check if ChromaDB is running
docker ps | grep chroma

# Check logs
docker-compose logs chroma

# Restart ChromaDB
docker-compose restart chroma
```

### Embedding Generation Failed

```bash
# Check Gemini API key
echo $GEMINI_API_KEY

# Test API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
```

### Slow Queries

- Reduce batch size for embeddings
- Add indexes to MongoDB collections
- Use metadata filters in ChromaDB queries
- Implement caching layer

## Migration from In-Memory Vector Store

The old `vector.service.ts` used an in-memory Map. To migrate:

1. ✅ New chunks automatically use ChromaDB
2. Old chunks remain in memory (lost on restart)
3. To migrate old data:
   - Export from MongoDB
   - Re-generate embeddings
   - Batch insert to ChromaDB

## Testing

```bash
# Run tests
npm test

# Test ingestion
npm run dev
# Then use Bruno collection or curl commands above
```

## Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)
