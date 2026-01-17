# Raspberry Pi Audio Recording System

A simple audio recording and transcription system that records from microphone and sends to backend API.

## Quick Start (Simple Method - Recommended)

**Single command to record and send:**

```bash
python3 record_and_send.py
```

This will:
1. ✅ Record audio in 10-second MP3 chunks
2. ✅ Save each chunk locally to `recorded_audio/` folder FIRST
3. ✅ Then immediately send to your backend API
4. ✅ Press `Ctrl+C` to stop recording

**No Redis needed!**

---

## Architecture

### Simple Method (record_and_send.py)
```
Microphone → record_and_send.py → Save to recorded_audio/ → Send to Backend API
```

### Queue Method (Advanced - uses Redis)
```
Microphone → record_audio.py → Redis Queue → consumer_api.py → Backend API
                    ↓
              recorded_audio/
```

## Files

### Simple Method (No Redis)
- **record_and_send.py** - ⭐ **USE THIS** - Records audio, saves locally, sends to backend (all-in-one)

### Queue Method (Advanced - Requires Redis)
- **record_audio.py** - Records audio from microphone, saves to disk, and enqueues to Redis
- **consumer_api.py** - Consumes from Redis queue and sends audio chunks to backend API
- **consumer.py** - Basic Redis consumer template for custom processing

### Storage
- **recorded_audio/** - Folder where audio chunks are saved (MP3 format)

## Setup

1. Install dependencies:
```bash
pip3 install -r requirements.txt
```

**Note for macOS:** You also need ffmpeg for MP3 conversion:
```bash
brew install ffmpeg
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your backend URL
nano .env
```

Set your backend URL:
```bash
BACKEND_BASE_URL=http://192.168.1.100:8000
```

## Usage

### Simple Method (Recommended)

Just run one command:
```bash
python3 record_and_send.py
```

**What happens:**
1. 🎙️ Records 10-second chunks from microphone
2. 💾 Saves each chunk as MP3 to `recorded_audio/` folder
3. 📤 Sends to backend API immediately
4. 🔁 Repeats until you press `Ctrl+C`

**Example output:**
```
🎙️  Recording chunk 1 (10s)...
   ⏸️  Recording complete
   🔄 Converting to MP3...
   💾 Saved locally: chunk_0001_20260117_220000.mp3
   📏 Size: 156.32 KB
   🕐 Timestamp: 2026-01-17 22:00:00
   📤 Sending to backend...
   ✅ Successfully sent to backend
```

---

### Queue Method (Advanced - Requires Redis)

### Queue Method (Advanced - Requires Redis)

**Only use this if you need Redis queue functionality**

1. Start Redis:
```bash
redis-server
```

2. Start the API Consumer:
This sends audio chunks from Redis to your backend:
```bash
python3 consumer_api.py
```

3. Start Recording:
This records from your microphone and enqueues chunks:
```bash
python3 record_audio.py
```

Press `Ctrl+C` to stop recording.

## Configuration (.env)

```bash
# Backend API (REQUIRED)
BACKEND_BASE_URL=http://192.168.1.100:8000
API_ENDPOINT=/transcribe-chunk

# Audio Settings
SAMPLE_RATE=16000        # 16kHz for speech
CHUNK_DURATION=10        # 10 seconds per chunk
CHANNELS=1               # mono
AUDIO_FOLDER=recorded_audio

# Redis (only for queue method)
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_NAME=audio_queue:my_session
```

## How It Works

### record_and_send.py (Simple Method)

**What it does:**
1. Records audio from your microphone continuously
2. Splits into 10-second chunks
3. Converts each chunk to MP3 format
4. **Saves to local disk FIRST** (`recorded_audio/chunk_0001_20260117_220000.mp3`)
5. **Then sends to backend API** with timestamp in microseconds
6. Repeats until you press Ctrl+C

**Flow:**
```
[Microphone] 
    ↓ (10 seconds)
[Record Audio]
    ↓
[Convert to MP3]
    ↓
[💾 Save Locally FIRST] ← recorded_audio/chunk_0001.mp3
    ↓
[📤 Send to Backend] → http://your-backend:8000/transcribe-chunk
    ↓
[Repeat]
```

### consumer_api.py (Queue Method)

**What it does:**
1. Reads audio chunks from Redis queue
2. Sends them to backend API endpoint
3. Requires `record_audio.py` to be running separately

---

## Data Sent to Backend

Each chunk sends:
```python
# File (multipart/form-data)
audio_file: chunk_0001_20260117_220000.mp3 (binary MP3 data)

# Form data
chunk_number: 1
time: 1737158400000000  # microseconds since Unix epoch
timestamp_us: 1737158400000000  # same, for clarity
```

Backend can extract:
- Year, month, day, hour, minute, second
- Day of week
- Microsecond precision timing

---

## Payload Structure

Audio chunks are stored in Redis with this structure:
```python
{
    "chunk_number": 1,
    "time": 1737158400000000,  # microseconds since epoch
    "audio_file": {
        "filename": "chunk_0001_20260117_220000.wav",
        "bytes": b'...',  # audio file bytes
        "filepath": "recorded_audio/chunk_0001_20260117_220000.wav"
    }
}
```

## Troubleshooting

**No audio devices found:**
```bash
# List available devices
python3 -c "import sounddevice as sd; print(sd.query_devices())"
```

**Permission denied (macOS):**
- Go to System Preferences → Security & Privacy → Microphone
- Grant permission to Terminal/Python

**Redis connection error:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```
