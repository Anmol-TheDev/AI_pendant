# Quick Start Guide - Transcript System with ChromaDB

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**
```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017/ai_pendent

# Clerk Auth
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Gemini AI (for embeddings & summaries)
GEMINI_API_KEY=your_gemini_api_key_here

# ChromaDB
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=audio_chunks
```

### 3. Start Services

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- ChromaDB on port 8000
- API server on port 4000

**Option B: Local Development**
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start ChromaDB
pip install chromadb
chroma run --path ./chroma_data --port 8000

# Terminal 3: Start API
npm run dev
```

### 4. Verify Setup

```bash
# Check API health
curl http://localhost:4000/api/healthz

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

## 📝 Usage Examples

### 1. Ingest Transcript Chunk

```bash
curl -X POST http://localhost:4000/api/transcripts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "679f1f77bcf86cd799439011",
    "text": "I went to the gym this morning and had a great workout. Feeling energized!",
    "startTimestamp": "2026-01-12T08:15:00.000Z",
    "endTimestamp": "2026-01-12T08:15:15.000Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Transcript chunk ingested successfully",
  "data": {
    "chunkId": "679f1f77bcf86cd799439012",
    "chatroomId": "679f1f77bcf86cd799439013",
    "segmentId": "679f1f77bcf86cd799439014",
    "embeddingId": "679f1f77bcf86cd799439012"
  }
}
```

### 2. Semantic Search

```bash
curl "http://localhost:4000/api/transcripts/context/search?userId=679f1f77bcf86cd799439011&query=gym+workout&limit=5"
```

**Response:**
```json
{
  "success": true,
  "message": "Semantic search completed",
  "data": {
    "query": "gym workout",
    "chunks": [
      {
        "id": "679f1f77bcf86cd799439012",
        "text": "I went to the gym this morning...",
        "score": 0.92,
        "date": "2026-01-12",
        "hour": 8,
        "sentiment": "positive",
        "topics": ["gym", "workout", "morning"]
      }
    ]
  }
}
```

### 3. Get Daily Context

```bash
curl "http://localhost:4000/api/transcripts/context/daily?userId=679f1f77bcf86cd799439011&date=2026-01-12"
```

### 4. Generate Daily Summary

```bash
curl "http://localhost:4000/api/transcripts/summary/daily?userId=679f1f77bcf86cd799439011&date=2026-01-12"
```

## 🧪 Testing with Bruno

1. Open Bruno and load the collection from `./bruno`
2. Select the `local` environment
3. Navigate to `transcripts` folder
4. Run requests in order:
   - Ingest Transcript
   - Get Daily Context
   - Semantic Search
   - Get Daily Summary

## 📊 System Architecture

```
External STT → POST /ingest → MongoDB + ChromaDB
                                    ↓
                            Query APIs (search, context, summaries)
```

**Data Organization:**
- **Daily Chatroom**: 1 per user per day
- **Hourly Segments**: 24 per chatroom (0-23)
- **Chunks**: 10-20 second text segments

**Storage:**
- **MongoDB**: Raw text, metadata, timestamps, relationships
- **ChromaDB**: Vector embeddings for semantic search

## 🔍 Key Features

✅ **Automatic Organization**: Daily chatrooms + hourly segments  
✅ **NLP Analysis**: Sentiment + topic extraction  
✅ **Vector Search**: Semantic similarity using embeddings  
✅ **AI Summaries**: Daily and weekly summaries via LLM  
✅ **Scalable**: Handles 1.5M+ chunks/year/user  
✅ **Persistent**: Docker volumes for data persistence  

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcripts/ingest` | POST | Ingest transcript chunk |
| `/api/transcripts/context/daily` | GET | Get daily context |
| `/api/transcripts/context/hour` | GET | Get hourly context |
| `/api/transcripts/context/search` | GET | Semantic search |
| `/api/transcripts/context/similar` | GET | Find similar events |
| `/api/transcripts/summary/daily` | GET | Generate daily summary |
| `/api/transcripts/summary/weekly` | GET | Generate weekly summary |
| `/api/transcripts/chatrooms` | GET | Get user's chatrooms |

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📖 Documentation

- **Full Integration Guide**: See `CHROMA_INTEGRATION.md`
- **API Documentation**: See `bruno/README.md`
- **Bruno Collection**: See `bruno/transcripts/` folder

## 🐛 Troubleshooting

### ChromaDB not connecting
```bash
# Check if ChromaDB is running
docker ps | grep chroma

# Restart ChromaDB
docker-compose restart chroma
```

### Embedding generation fails
```bash
# Verify Gemini API key
echo $GEMINI_API_KEY

# System will use fallback embeddings if API fails
```

### MongoDB connection issues
```bash
# Check MongoDB is running
docker ps | grep mongo

# Check connection string in .env
```

## 🎯 Next Steps

1. ✅ Ingest some test transcript chunks
2. ✅ Try semantic search queries
3. ✅ Generate daily summaries
4. ✅ Explore similar events feature
5. ✅ Integrate with your STT microservice

## 📞 Support

- Check logs: `docker-compose logs -f`
- Review documentation: `CHROMA_INTEGRATION.md`
- Test with Bruno collection: `bruno/transcripts/`

---

**Ready to go!** Start ingesting transcripts and exploring semantic search capabilities. 🚀
