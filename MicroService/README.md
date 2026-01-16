# Audio Transcription Microservice

Production-ready FastAPI microservice for audio chunk transcription using local OpenAI Whisper models.

## Features

- **Local Whisper Transcription**: No cloud API dependencies - runs 100% locally
- **Audio Processing Pipeline**: Noise reduction, VAD silence removal, re-encoding to 16kHz mono WAV
- **Synchronous & Async Modes**: Get transcript immediately or queue for background processing
- **Retry Logic**: 3x retry with exponential backoff for failures
- **Production Ready**: Gunicorn + Uvicorn workers, logging, metrics
- **Docker Support**: Containerized deployment with Render.com support
- **Multi-Model Support**: Choose from tiny, base, small, medium, or large Whisper models
- **Auto Language Detection**: Automatically detects and transcribes multiple languages

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Testing](#testing-the-service)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- ffmpeg (required by Whisper for audio processing)
- Optional: Docker for containerized deployment
- Optional: CUDA-capable GPU for faster transcription (CPU works but slower)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd audio-transcription-service
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install ffmpeg (required by Whisper)
# On Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg

# On macOS:
brew install ffmpeg

# On Windows:
# Download from https://ffmpeg.org/download.html

# Install all required packages
pip install -r app/requirements.txt
```

**Note**: Installation may take 5-10 minutes as it includes PyTorch and Whisper models will be downloaded on first use.

### Step 4: Verify Installation

```bash
# Test imports
python -c "from app.main import app; print('✓ Installation successful!')"
```

## Configuration

### Step 1: Create Environment File

```bash
# Copy example environment file
cp .env.example .env
```

### Step 2: Edit Configuration

Open `.env` file and configure:

```env
# Whisper Configuration
WHISPER_MODEL=base
WHISPER_LANGUAGE=auto

# Backend Configuration
BACKEND_URL=http://localhost:8000
BACKEND_ENDPOINT=/daily-context/add

# Retry Configuration
MAX_RETRIES=3
RETRY_BACKOFF_BASE=2.0

# Queue Configuration
MAX_QUEUE_SIZE=1000
WORKER_COUNT=4

# Audio Processing
SAMPLE_RATE=16000
```

### Configuration Options

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WHISPER_MODEL` | Whisper model size | `base` | No |
| `WHISPER_LANGUAGE` | Language code or 'auto' | `auto` | No |
| `BACKEND_URL` | Main backend service URL | `http://localhost:8000` | No |
| `BACKEND_ENDPOINT` | Backend callback endpoint | `/daily-context/add` | No |
| `MAX_RETRIES` | Retry attempts on failure | `3` | No |
| `RETRY_BACKOFF_BASE` | Exponential backoff base | `2.0` | No |
| `WORKER_COUNT` | Number of async workers | `4` | No |
| `MAX_QUEUE_SIZE` | Max queue capacity | `1000` | No |
| `SAMPLE_RATE` | Audio sample rate (Hz) | `16000` | No |

**Available Whisper Models:**
- `tiny` - Fastest, least accurate (~1GB RAM, ~32x realtime on CPU)
- `base` - Good balance (~1GB RAM, ~16x realtime on CPU) **[Recommended]**
- `small` - Better accuracy (~2GB RAM, ~6x realtime on CPU)
- `medium` - High accuracy (~5GB RAM, ~2x realtime on CPU)
- `large` - Best accuracy (~10GB RAM, ~1x realtime on CPU)

**Language Options:**
- `auto` - Automatic language detection (recommended)
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `zh` - Chinese
- ... (supports 99+ languages)

## Running the Service

### Development Mode (with auto-reload)

```bash
# Activate virtual environment
source venv/bin/activate

# Run with Uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access the service at: `http://localhost:8000`

### Production Mode (with Gunicorn)

```bash
# Activate virtual environment
source venv/bin/activate

# Run with Gunicorn + Uvicorn workers
gunicorn app.main:app -c gunicorn.conf.py
```

**Gunicorn Configuration** (in `gunicorn.conf.py`):
- Workers: `cpu_count * 2 + 1` (auto-scales based on CPU)
- Worker class: `uvicorn.workers.UvicornWorker`
- Bind: `0.0.0.0:8000`
- Timeout: 120 seconds

### Verify Service is Running

```bash
# Check health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy"}
```

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 2. Transcribe Audio Chunk (Synchronous)

**Endpoint:** `POST /transcribe-chunk`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `audio_file` (file, required): Audio file (any format - WAV, MP3, M4A, etc.)
- `chunk_number` (integer, required): Sequence number of the audio chunk
- `time` (string, required): ISO 8601 timestamp or Unix timestamp

**Request Example:**
```bash
curl -X POST http://localhost:8000/transcribe-chunk \
  -F "audio_file=@/path/to/audio.wav" \
  -F "chunk_number=1" \
  -F "time=2026-01-13T10:30:00Z"
```

**Response (200 OK):**
```json
{
  "status": "completed",
  "chunk": 1,
  "text": "This is the transcribed text from the audio chunk",
  "time": "2026-01-13T10:30:00Z"
}
```

**Notes:**
- Returns transcript immediately (synchronous processing)
- Backend callback happens asynchronously in background
- Processing time: 1-10 seconds depending on audio length and model size
- Silent audio is automatically detected and skipped

---

### 3. Transcribe Audio Chunk (Async Queue)

**Endpoint:** `POST /transcribe-chunk/async`

**Content-Type:** `multipart/form-data`

**Parameters:** Same as synchronous endpoint

**Request Example:**
```bash
curl -X POST http://localhost:8000/transcribe-chunk/async \
  -F "audio_file=@/path/to/audio.wav" \
  -F "chunk_number=1" \
  -F "time=2026-01-13T10:30:00Z"
```

**Response (202 Accepted):**
```json
{
  "status": "queued",
  "chunk": 1
}
```

**Notes:**
- Returns immediately after enqueueing
- Processing happens in background
- Use for high-volume scenarios

---

### 4. Backend Callback (Automatic)

After successful transcription, the service automatically calls your backend:

**Endpoint:** `POST {BACKEND_URL}/daily-context/add`

**Payload:**
```json
{
  "chunk_number": 1,
  "text": "This is the transcribed text from the audio chunk",
  "time": "2026-01-13T10:30:00Z",
  "source": "ai-pendant"
}
```

## Deployment

### Deploy with Docker

#### Step 1: Build Docker Image

```bash
docker build -t audio-transcription-service .
```

#### Step 2: Run Container

```bash
docker run -d \
  -p 8000:8000 \
  -e WHISPER_MODEL=base \
  -e BACKEND_URL=http://your-backend-url \
  --name transcription-service \
  audio-transcription-service
```

#### Step 3: Verify Container

```bash
# Check container status
docker ps

# Check logs
docker logs transcription-service

# Test health endpoint
curl http://localhost:8000/health
```

### Deploy with Docker Compose

```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Deploy to Render.com

#### Option 1: Using render.yaml (Recommended)

1. **Push code to GitHub**
2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variables:**
   - In Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add `WHISPER_MODEL` (optional, defaults to 'base')
   - Add `BACKEND_URL` with your backend service URL

4. **Deploy:**
   - Render will automatically build and deploy
   - Access your service at the provided URL

#### Option 2: Manual Setup

1. **Create New Web Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your repository

2. **Configure Service:**
   - **Name:** `audio-transcription-service`
   - **Runtime:** Docker
   - **Branch:** `main`
   - **Dockerfile Path:** `./Dockerfile`

3. **Set Environment Variables:**
   ```
   WHISPER_MODEL=base
   WHISPER_LANGUAGE=auto
   BACKEND_URL=your_backend_url
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for build to complete

### Deploy to Other Platforms

#### Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create audio-transcription-service

# Set environment variables
heroku config:set WHISPER_MODEL=base

# Deploy
git push heroku main
```

#### AWS ECS / Google Cloud Run / Azure Container Instances

Use the provided `Dockerfile` to build and deploy to your preferred container platform.

## Testing the Service

### 1. Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### 2. Create a Test Audio File
```bash
# Generate a 5-second test audio file using ffmpeg
ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" -ar 16000 test_audio.wav
```

### 3. Test Transcription Endpoint
```bash
curl -X POST http://localhost:8000/transcribe-chunk \
  -F "audio_file=@test_audio.wav" \
  -F "chunk_number=1" \
  -F "time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -v
```

### 4. Check Logs
```bash
# If running with Gunicorn, logs appear in terminal
# Check for processing status:
# - "Enqueued chunk X for transcription"
# - "Worker Y processing chunk X"
# - "Chunk X processed successfully"
```

### 5. Test with Multiple Chunks
```bash
# Send multiple chunks to test queue ordering
for i in {1..5}; do
  curl -X POST http://localhost:8000/transcribe-chunk \
    -F "audio_file=@test_audio.wav" \
    -F "chunk_number=$i" \
    -F "time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" &
done
wait
```

## Architecture

```
app/
├── main.py              # FastAPI app with lifespan management
├── config.py            # Settings and configuration
├── routes/
│   └── audio.py         # POST /transcribe-chunk endpoint
├── services/
│   ├── filter.py        # Audio filtering pipeline
│   ├── transcribe.py    # Local Whisper transcription
│   └── callback.py      # Backend callback
├── queue/
│   └── worker.py        # Async task queue and workers
└── schemas/
    ├── request.py       # Request models
    └── response.py      # Response models
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `WHISPER_MODEL` | Whisper model size | `base` |
| `WHISPER_LANGUAGE` | Language code or 'auto' | `auto` |
| `BACKEND_URL` | Main backend service URL | `http://localhost:8000` |
| `BACKEND_ENDPOINT` | Backend callback endpoint | `/daily-context/add` |
| `MAX_RETRIES` | Retry attempts on failure | `3` |
| `RETRY_BACKOFF_BASE` | Exponential backoff base | `2.0` |
| `WORKER_COUNT` | Number of async workers | `4` |
| `MAX_QUEUE_SIZE` | Max queue capacity | `1000` |
| `SAMPLE_RATE` | Audio sample rate (Hz) | `16000` |

## Processing Flow

1. **Client uploads audio chunk** → Returns `202 Accepted` immediately
2. **Task enqueued** with priority based on `chunk_number` (lower = higher priority)
3. **Worker picks task** and processes:
   - Load audio file (any format)
   - Convert to mono if stereo
   - Apply noise reduction (noisereduce)
   - Remove silence with VAD (webrtcvad)
   - Resample to 16kHz
   - Normalize and convert to int16
   - Re-encode to WAV format
   - Transcribe with local Whisper model
   - Callback to backend with transcript
4. **Retry logic**: Up to 3x on failure with exponential backoff (1s, 2s, 4s)

## Monitoring

### Logs
All operations are logged with timestamps:
```
2026-01-13 19:20:21 - app.routes.audio - INFO - Enqueued chunk 1 for transcription
2026-01-13 19:20:21 - app.queue.worker - INFO - Worker 0 processing chunk 1, attempt 1
2026-01-13 19:20:22 - app.services.filter - INFO - Loaded audio: 80000 samples at 16000Hz
2026-01-13 19:20:22 - app.services.filter - INFO - Applied noise reduction
2026-01-13 19:20:22 - app.services.filter - INFO - Applied VAD silence removal
2026-01-13 19:20:23 - app.services.transcribe - INFO - Transcription successful: 145 chars
2026-01-13 19:20:23 - app.services.callback - INFO - Backend callback successful for chunk 1
2026-01-13 19:20:23 - app.queue.worker - INFO - Chunk 1 processed successfully in 2.34s
```

### Metrics
Available in worker logs:
- **Queue depth**: Current number of pending tasks
- **Total processed**: Successfully completed chunks
- **Total failures**: Failed chunks after all retries
- **Average latency**: Mean processing time per chunk

### Health Check
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
gunicorn app.main:app -b 0.0.0.0:8001 -c gunicorn.conf.py
```

### Missing Dependencies
```bash
# Reinstall all dependencies
source venv/bin/activate
pip install -r app/requirements.txt --upgrade
```

### ElevenLabs API Errors
- **No longer applicable** - service runs 100% locally with Whisper
- If you see Whisper model download errors, check your internet connection (models download on first use)
- Whisper models are cached in `~/.cache/whisper/` after first download

### Backend Callback Failures
- Ensure `BACKEND_URL` is accessible from the service
- Check backend endpoint accepts POST requests
- Verify payload format matches backend expectations

## Requirements

- Python 3.11+
- PyTorch (for Whisper)
- ffmpeg (for audio processing)
- Backend service endpoint for callbacks
- Optional: Docker for containerized deployment
- Optional: CUDA-capable GPU for faster transcription

## Performance

- **Throughput**: Handles 100+ concurrent requests with default worker configuration
- **Latency**: 
  - `tiny` model: ~0.5-2 seconds per chunk (CPU)
  - `base` model: ~1-3 seconds per chunk (CPU)
  - `small` model: ~2-5 seconds per chunk (CPU)
  - `medium` model: ~5-10 seconds per chunk (CPU)
  - `large` model: ~10-20 seconds per chunk (CPU)
  - GPU: 5-10x faster than CPU
- **Queue**: Supports up to 1000 pending tasks
- **Workers**: Auto-scales based on CPU count (default: `cpu_count * 2 + 1`)
- **Memory**: 
  - `tiny/base`: ~1-2GB RAM per worker
  - `small`: ~2-3GB RAM per worker
  - `medium`: ~5-6GB RAM per worker
  - `large`: ~10-12GB RAM per worker
