# AI Pendent Backend - Transcript System

A scalable backend system for storing continuous transcript text, segmented by day/hour, with semantic AI querying using MongoDB + ChromaDB Vector Database.

## 🌟 Features

- **Automatic Organization**: Daily chatrooms with hourly segments
- **NLP Analysis**: Sentiment detection and topic extraction
- **Vector Search**: Semantic similarity search using ChromaDB
- **AI Summaries**: Daily and weekly summaries powered by Gemini
- **Scalable Architecture**: Handles 1.5M+ chunks/year/user
- **Real-time Ingestion**: Process transcript chunks from external STT services
- **Metadata Filtering**: Query by time, sentiment, topics, and more

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              External STT Microservice                       │
│         (Provides 10-20 second transcript chunks)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Ingestion Pipeline                          │
│  1. Resolve daily chatroom                                   │
│  2. Resolve hourly segment                                   │
│  3. NLP analysis (sentiment + topics)                        │
│  4. Generate embeddings                                      │
│  5. Store in MongoDB + ChromaDB                              │
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
│              Query & Context APIs                            │
│  • Daily/Hourly Context                                      │
│  • Semantic Search                                           │
│  • Similar Events                                            │
│  • AI Summaries                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Gemini API key (for embeddings & summaries)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ai-pendent-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start services (MongoDB + ChromaDB + API)
docker-compose up -d

# Verify setup
curl http://localhost:4000/api/healthz
```

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

## 📊 Data Model

### MongoDB Collections

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
  stats: {
    wordCount: 320,
    sentiment: { positive: 5, neutral: 2, negative: 1 },
    topicDistribution: { gym: 3, workout: 2 }
  }
}
```

**TranscriptChunk** (Text segment)
```typescript
{
  userId: ObjectId,
  text: "I went to the gym...",
  startTimestamp: Date,
  endTimestamp: Date,
  sentiment: "positive",
  topics: ["gym", "workout"],
  embeddingId: "chunk-id"
}
```

### ChromaDB Collection

**Collection:** `audio_chunks`

**Metadata:**
```typescript
{
  userId: string,
  date: "2026-01-12",
  hour: 14,
  sentiment: "positive",
  topics: "gym,workout,morning"
}
```

**Vector:** 768-dimensional embedding from Gemini

## 🔌 API Endpoints

### Ingestion

```bash
POST /api/transcripts/ingest
{
  "userId": "679f1f77bcf86cd799439011",
  "text": "I went to the gym this morning...",
  "startTimestamp": "2026-01-12T08:15:00.000Z",
  "endTimestamp": "2026-01-12T08:15:15.000Z"
}
```

### Context Retrieval

```bash
# Daily context
GET /api/transcripts/context/daily?userId=xxx&date=2026-01-12

# Hourly context
GET /api/transcripts/context/hour?userId=xxx&date=2026-01-12&hour=14

# Semantic search
GET /api/transcripts/context/search?userId=xxx&query=gym+workout&limit=10

# Similar events
GET /api/transcripts/context/similar?userId=xxx&chunkId=xxx&limit=10
```

### Summaries

```bash
# Daily summary
GET /api/transcripts/summary/daily?userId=xxx&date=2026-01-12

# Weekly summary
GET /api/transcripts/summary/weekly?userId=xxx&endDate=2026-01-12
```

See [bruno/README.md](bruno/README.md) for complete API documentation.

## 🧪 Testing

### Using Bruno (Recommended)

1. Open Bruno
2. Load collection from `./bruno`
3. Select `local` environment
4. Navigate to `transcripts` folder
5. Run requests

### Using cURL

```bash
# Ingest a chunk
curl -X POST http://localhost:4000/api/transcripts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "679f1f77bcf86cd799439011",
    "text": "I went to the gym this morning",
    "startTimestamp": "2026-01-12T08:15:00.000Z",
    "endTimestamp": "2026-01-12T08:15:15.000Z"
  }'

# Search semantically
curl "http://localhost:4000/api/transcripts/context/search?userId=679f1f77bcf86cd799439011&query=gym"
```

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint & format
npm run lint
npm run format
```

## 📁 Project Structure

```
src/
├── config/
│   ├── chroma.ts              # ChromaDB client
│   ├── db.ts                  # MongoDB connection
│   └── index.ts               # App configuration
├── models/
│   ├── TranscriptChatroom.ts  # Daily chatroom
│   ├── TranscriptSegment.ts   # Hourly segment
│   └── TranscriptChunk.ts     # Text chunk
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

## 🔧 Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URL=mongodb://localhost:27017/ai_pendent

# ChromaDB
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=audio_chunks

# Gemini AI
GEMINI_API_KEY=your_api_key_here

# Clerk Auth
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Docker Services

```yaml
services:
  mongo:     # Port 27017
  chroma:    # Port 8000
  api:       # Port 4000
```

## 📈 Performance & Scaling

### Current Capacity
- **Chunks**: 1.5M+ per year per user
- **Storage**: MongoDB + ChromaDB with persistent volumes
- **Search**: Sub-second semantic queries

### Optimization Tips
- Use batch ingestion for multiple chunks
- Implement Redis caching for frequent queries
- Scale ChromaDB horizontally for production
- Add indexes to MongoDB collections

See [CHROMA_INTEGRATION.md](CHROMA_INTEGRATION.md) for production considerations.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[CHROMA_INTEGRATION.md](CHROMA_INTEGRATION.md)** - Complete integration guide
- **[bruno/README.md](bruno/README.md)** - API documentation
- **[bruno/transcripts/](bruno/transcripts/)** - API examples

## 🐛 Troubleshooting

### ChromaDB Connection Issues
```bash
docker-compose logs chroma
docker-compose restart chroma
```

### Embedding Generation Fails
- Check Gemini API key in `.env`
- System uses fallback embeddings if API unavailable

### MongoDB Connection Issues
```bash
docker-compose logs mongo
docker-compose restart mongo
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- **ChromaDB** - Vector database
- **Gemini** - Embeddings & LLM
- **MongoDB** - Document storage
- **Express** - Web framework

---

**Built with ❤️ for scalable transcript management and semantic search**
