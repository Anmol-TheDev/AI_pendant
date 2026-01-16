# AI Pendant - Audio Recording & Transcription System

An intelligent audio recording system that processes audio from Raspberry Pi, converts speech to text using AI services, and provides context-aware AI assistance through 24-hour chatrooms.

## 🏗️ System Architecture

```
┌─────────────────┐
│  Raspberry Pi   │
│ Audio Recording │
└────────┬────────┘
         │ HTTP POST (Audio)
         ▼
┌─────────────────────────────┐
│  FastAPI Microservice       │
│  - Audio Preprocessing      │
│  - Noise Reduction          │
│  - Voice Activity Detection │
│  - Whisper STT              │
└────────┬────────────────────┘
         │ HTTP POST (Transcript)
         ▼
┌─────────────────────────────────────┐
│  Express.js Main Backend            │
│  - Transcript Storage (MongoDB)     │
│  - Vector Embeddings (Vector DB)    │
│  - 24-Hour Chatroom Management      │
│  - AI Chatbot (Socket.io)           │
└─────────────────────────────────────┘
         │
         ▼
┌──────────────────┬──────────────────┐
│    MongoDB       │    Vector DB     │
│  Raw Transcripts │   Embeddings     │
└──────────────────┴──────────────────┘
```

## 📋 Features

### Audio Processing Microservice
- **Audio Preprocessing**: Noise reduction and audio enhancement
- **Voice Activity Detection (VAD)**: Filter out silence and non-speech segments
- **Speech-to-Text**: OpenAI Whisper integration with timestamp extraction
- **Multiple Format Support**: WAV, MP3, M4A, OGG, FLAC
- **Async Processing**: Fast, non-blocking audio processing

### Main Backend
- **24-Hour Chatrooms**: Automatic daily chatroom creation with context boundaries
- **Dual Database Storage**:
  - **MongoDB**: Store raw transcripts with metadata and timestamps
  - **Vector DB**: Store embeddings for semantic search and context retrieval
- **Real-time Chat**: Socket.io integration for live messaging
- **AI Chatbot**: Context-aware AI assistant that understands your daily audio recordings
- **Semantic Search**: Find relevant transcript segments based on meaning

## 🛠️ Tech Stack

### Microservice (FastAPI)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
python-multipart==0.0.6
numpy==1.26.3
soundfile==0.12.1
torch>=2.0.0
noisereduce==3.0.0
webrtcvad==2.0.10
scipy==1.11.4
python-dotenv==1.0.0
openai-whisper
```

### Main Backend (Express.js)
```
express
mongoose
socket.io
dotenv
cors
helmet
morgan
```

**Databases**:
- MongoDB (for raw data)
- Vector DB (Pinecone/Qdrant for embeddings)

## 📁 Project Structure

```
AI_pendant/
├── README.md
├── microservice/                 # FastAPI Audio Processing Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Configuration management
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── transcript.py # Audio processing endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── audio_processor.py  # Audio preprocessing
│   │   │   └── whisper_service.py  # Whisper STT integration
│   │   ├── clients/
│   │   │   ├── __init__.py
│   │   │   └── backend_client.py   # HTTP client for main backend
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── logger.py           # Logging utilities
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
│
└── backend/                      # Express.js Main Backend
    ├── src/
    │   ├── server.js            # Server entry point
    │   ├── models/
    │   │   ├── User.js          # User model
    │   │   ├── Transcript.js    # Transcript model
    │   │   ├── Chatroom.js      # 24-hour chatroom model
    │   │   └── Message.js       # Chat message model
    │   ├── routes/
    │   │   ├── transcriptRoutes.js
    │   │   ├── chatroomRoutes.js
    │   │   └── chatRoutes.js
    │   ├── services/
    │   │   ├── vectorService.js    # Vector DB operations
    │   │   ├── chatroomService.js  # Chatroom management
    │   │   └── aiService.js        # AI chatbot integration
    │   ├── sockets/
    │   │   └── socketHandlers.js   # Socket.io event handlers
    │   ├── middleware/
    │   │   ├── auth.js             # Authentication middleware
    │   │   └── errorHandler.js     # Error handling
    │   └── config/
    │       ├── database.js         # MongoDB connection
    │       └── vectorDb.js         # Vector DB configuration
    ├── package.json
    ├── .env.example
    └── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** (for microservice)
- **Node.js 18+** (for main backend)
- **MongoDB** (local or cloud instance)
- **Vector Database** (Pinecone/Qdrant account)
- **Raspberry Pi** (for audio recording)

### Microservice Setup

1. **Navigate to microservice directory**
   ```bash
   cd microservice
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the microservice**
   ```bash
   # Development
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Production
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the backend**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Configuration

### Microservice (.env)
```env
# Server
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

# Backend Service
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your_backend_api_key_here

# Whisper Configuration
WHISPER_MODEL=base  # Options: tiny, base, small, medium, large
WHISPER_DEVICE=cpu  # Options: cpu, cuda
WHISPER_LANGUAGE=en

# Audio Processing
MAX_AUDIO_SIZE_MB=50
ALLOWED_AUDIO_FORMATS=wav,mp3,m4a,ogg,flac

# Logging
LOG_LEVEL=INFO
```

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai_pendant

# Vector Database (Pinecone example)
VECTOR_DB_TYPE=pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=transcripts

# AI Service (OpenAI example)
OPENAI_API_KEY=your_openai_api_key
AI_MODEL=gpt-3.5-turbo

# Security
JWT_SECRET=your_jwt_secret_here
API_KEY=your_backend_api_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📡 API Overview

### Microservice Endpoints
- **POST** `/api/v1/process-audio` - Upload and process audio files
- **GET** `/health` - Health check endpoint

### Backend Endpoints
- **POST** `/api/transcripts` - Receive transcripts from microservice
- **GET** `/api/chatrooms/current` - Get current 24-hour chatroom
- **GET** `/api/chatrooms/:chatroomId/transcripts` - Get chatroom transcripts
- **GET** `/api/transcripts/search` - Search transcripts

### Socket.io Events
- **Client → Server**: `join-chatroom`, `send-message`, `ai-request`
- **Server → Client**: `new-transcript`, `ai-response`, `message-received`

## 🗄️ Database Schemas

### MongoDB Collections

#### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Chatrooms
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  startTime: Date,        // 00:00:00 of the day
  endTime: Date,          // 23:59:59 of the day
  contextSummary: String, // AI-generated summary
  status: String,         // 'active' | 'archived'
  transcriptCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transcripts
```javascript
{
  _id: ObjectId,
  chatroomId: ObjectId,
  userId: ObjectId,
  text: String,
  segments: [{
    text: String,
    start: Number,
    end: Number,
    confidence: Number
  }],
  audioMetadata: {
    duration: Number,
    filePath: String,
    recordedAt: Date
  },
  vectorId: String,
  processingStatus: String,
  createdAt: Date
}
```

#### Messages
```javascript
{
  _id: ObjectId,
  chatroomId: ObjectId,
  sender: String,         // 'user' | 'ai'
  content: String,
  contextReferences: [ObjectId],
  createdAt: Date
}
```

### Vector Database

```javascript
{
  id: String,             // MongoDB transcript ID
  values: [Number],       // Embedding vector (e.g., 1536 dims)
  metadata: {
    chatroomId: String,
    userId: String,
    text: String,
    recordedAt: String,
    segmentIndex: Number
  }
}
```

## 🔄 System Flow

### 1. Audio Recording & Processing
```
Raspberry Pi records audio
    ↓
POST audio to Microservice (/api/v1/process-audio)
    ↓
Microservice preprocesses audio
    ↓
Whisper converts speech to text
    ↓
Microservice forwards transcript to Backend
    ↓
Backend stores in MongoDB + generates embeddings
    ↓
Embeddings stored in Vector DB
```

### 2. Chatroom Management
```
User accesses system
    ↓
Backend checks for chatroom in current 24-hour window
    ↓
If none exists, create new chatroom
    ↓
Load all transcripts for this chatroom
    ↓
Generate context summary from transcripts
    ↓
Return chatroom with context
```

### 3. AI Chat Interaction
```
User sends message via Socket.io
    ↓
Backend searches Vector DB for relevant segments
    ↓
Construct prompt with:
  - Chatroom context summary
  - Relevant transcript segments
  - User's question
    ↓
Call AI API (GPT/Claude)
    ↓
Stream response back to user
```

## 🧪 Testing

### Microservice Testing
- Test audio upload endpoint with sample audio files
- Verify health check endpoint returns proper status
- Check audio processing and transcript generation

### Backend Testing
- Test transcript storage and retrieval
- Verify chatroom creation and management
- Test Socket.io connections and events
- Validate AI chatbot responses with context

## 📱 Raspberry Pi Integration

The Raspberry Pi should:
1. **Record audio** using PyAudio or similar library
2. **Save audio files** in supported formats (WAV recommended at 16kHz)
3. **Send via HTTP POST** to the microservice `/api/v1/process-audio` endpoint
4. **Continuous recording** in chunks (recommended: 30-60 second segments)
5. **Error handling** for network failures and retry logic

**Recommended libraries**: `pyaudio`, `requests`, `wave`

## 🔒 Security Considerations

1. **API Authentication**: Use API keys for microservice-to-backend communication
2. **User Authentication**: Implement JWT for user sessions
3. **CORS**: Configure appropriate CORS policies
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Input Validation**: Validate all audio files and inputs
6. **Environment Variables**: Never commit sensitive data to version control

## 🚀 Deployment

### Production Checklist
- [ ] Set `WHISPER_MODEL` to appropriate size (medium/large for better accuracy)
- [ ] Enable GPU for Whisper if available (`WHISPER_DEVICE=cuda`)
- [ ] Set up MongoDB replica set for high availability
- [ ] Configure Vector DB with proper indexing
- [ ] Set up reverse proxy (Nginx) for SSL/TLS
- [ ] Enable logging and monitoring
- [ ] Set up backup strategy for databases
- [ ] Configure appropriate rate limits

## 📊 Performance Optimization

1. **Whisper Model Selection**:
   - `tiny`: Fastest, lowest accuracy
   - `base`: Good balance (default)
   - `small`: Better accuracy, slower
   - `medium`: High accuracy, requires more resources
   - `large`: Best accuracy, GPU recommended

2. **Audio Processing**:
   - Use VAD to skip silence
   - Downsample audio to 16kHz for Whisper
   - Process audio in chunks for long recordings

3. **Vector Search**:
   - Use appropriate number of dimensions (1536 for OpenAI embeddings)
   - Index regularly for faster queries
   - Cache frequently accessed embeddings

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📝 License

MIT License

## 🐛 Troubleshooting

### Whisper Installation Issues
- If torch installation fails, try installing from PyTorch official wheel repository
- For GPU support, ensure CUDA is installed and use appropriate torch version
- Check Python version compatibility (3.9+ required)

### MongoDB Connection Issues
- Verify MongoDB service is running
- Check connection string in environment variables
- Ensure network access between services

### Audio Processing Errors
- Ensure audio files are in supported formats (WAV, MP3, M4A, OGG, FLAC)
- Check file size is within configured limits
- Verify audio quality (16kHz+ sample rate recommended)
- Check microservice logs for detailed error messages

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ for intelligent audio processing and AI-powered assistance**