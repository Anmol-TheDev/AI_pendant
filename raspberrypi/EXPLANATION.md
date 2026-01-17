# Complete System Explanation

## 🎯 What You Want (Simple Method)

**Single command that:**
1. ✅ Records audio continuously
2. ✅ Splits into 10-second MP3 chunks
3. ✅ Saves locally FIRST
4. ✅ Sends to backend immediately after saving
5. ✅ Stops when you press Ctrl+C

---

## 📁 File Responsibilities

### record_and_send.py ⭐ (USE THIS - All-in-One Solution)

**What it does:**
```
┌─────────────────────────────────────────────────────────┐
│  record_and_send.py                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 🎤 Records from microphone (10 seconds)             │
│     ↓                                                    │
│  2. 🔄 Converts to MP3 format                           │
│     ↓                                                    │
│  3. 💾 SAVES LOCALLY FIRST                              │
│     → recorded_audio/chunk_0001_20260117_220000.mp3     │
│     ↓                                                    │
│  4. 📤 SENDS TO BACKEND                                 │
│     → POST http://your-backend:8000/transcribe-chunk    │
│     ↓                                                    │
│  5. 🔁 Repeats (next 10 seconds)                        │
│                                                          │
│  Press Ctrl+C to stop                                   │
└─────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- ✅ Microphone recording
- ✅ MP3 conversion
- ✅ Local file storage
- ✅ HTTP API calls to backend
- ✅ Timestamp generation (microseconds)
- ✅ Error handling

**Does NOT need:**
- ❌ Redis
- ❌ Separate consumer script
- ❌ Multiple terminals

---

### consumer_api.py (Advanced - Queue Method)

**What it does:**
```
┌─────────────────────────────────────────────────────────┐
│  consumer_api.py                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 📥 Reads from Redis queue                           │
│     ↓                                                    │
│  2. 📤 Sends to backend API                             │
│     → POST http://your-backend:8000/transcribe-chunk    │
│     ↓                                                    │
│  3. 🔁 Waits for next chunk in queue                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- ✅ Reads from Redis queue
- ✅ Sends to backend API
- ✅ Handles network errors

**Requires:**
- ⚠️ Redis server running
- ⚠️ record_audio.py running separately

---

### record_audio.py (Advanced - Queue Method)

**What it does:**
```
┌─────────────────────────────────────────────────────────┐
│  record_audio.py                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 🎤 Records from microphone                          │
│     ↓                                                    │
│  2. 💾 Saves locally                                    │
│     ↓                                                    │
│  3. 📤 Puts in Redis queue                              │
│     (consumer_api.py will send to backend)              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- ✅ Microphone recording
- ✅ Local file storage
- ✅ Redis queue management

**Does NOT:**
- ❌ Send to backend (consumer_api.py does this)

---

## 🔄 Complete Flow Comparison

### Simple Method (record_and_send.py)
```
┌──────────────┐
│  Microphone  │
└──────┬───────┘
       │ 10 seconds
       ↓
┌──────────────────────────────────────┐
│  record_and_send.py                  │
│                                      │
│  1. Record audio                     │
│  2. Convert to MP3                   │
│  3. 💾 Save: chunk_0001.mp3          │
│  4. 📤 Send to backend               │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Backend API                         │
│  http://backend:8000/transcribe-chunk│
└──────────────────────────────────────┘

ONE COMMAND: python3 record_and_send.py
```

### Queue Method (Advanced)
```
┌──────────────┐
│  Microphone  │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│ record_audio.py  │
│ 1. Record        │
│ 2. Save locally  │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Redis Queue     │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ consumer_api.py  │
│ 1. Read queue    │
│ 2. Send to API   │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Backend API     │
└──────────────────┘

THREE COMMANDS:
1. redis-server
2. python3 consumer_api.py
3. python3 record_audio.py
```

---

## 📤 What Gets Sent to Backend

### HTTP Request
```http
POST http://your-backend:8000/transcribe-chunk
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="audio_file"; filename="chunk_0001_20260117_220000.mp3"
Content-Type: audio/mpeg

<binary MP3 data>
--boundary
Content-Disposition: form-data; name="chunk_number"

1
--boundary
Content-Disposition: form-data; name="time"

1737158400000000
--boundary
Content-Disposition: form-data; name="timestamp_us"

1737158400000000
--boundary--
```

### Backend Receives
```python
{
    "audio_file": <MP3 file object>,
    "chunk_number": "1",
    "time": "1737158400000000",  # microseconds
    "timestamp_us": "1737158400000000"
}
```

### Backend Can Extract
```python
from datetime import datetime

timestamp_us = 1737158400000000
dt = datetime.fromtimestamp(timestamp_us / 1_000_000)

# Get all time information:
year = dt.year          # 2026
month = dt.month        # 1 (January)
day = dt.day            # 17
hour = dt.hour          # 22
minute = dt.minute      # 0
second = dt.second      # 0
weekday = dt.weekday()  # 5 (Saturday)
```

---

## 🚀 Quick Start

### Installation
```bash
cd raspberrypi
./install.sh
```

Or manually:
```bash
pip3 install -r requirements.txt
brew install ffmpeg  # macOS
cp .env.example .env
nano .env  # Set BACKEND_BASE_URL
```

### Run
```bash
python3 record_and_send.py
```

### Stop
Press `Ctrl+C`

---

## 📊 Example Output

```
============================================================
🎤 AUDIO RECORDING & SENDING SYSTEM
============================================================
📁 Saving audio to: recorded_audio/
🌐 Backend API: http://192.168.1.100:8000/transcribe-chunk
🔊 Sample Rate: 16000Hz, Channels: 1
⏱️  Chunk Duration: 10 seconds
💾 Format: MP3
============================================================

🎙️  Press Ctrl+C to stop recording
🔴 Recording will start in 3 seconds...

🔴 RECORDING STARTED

🎙️  Recording chunk 1 (10s)...
   ⏸️  Recording complete
   🔄 Converting to MP3...
   💾 Saved locally: chunk_0001_20260117_220000.mp3
   📏 Size: 156.32 KB
   🕐 Timestamp: 2026-01-17 22:00:00
   📤 Sending to backend...
   ✅ Successfully sent to backend
   📊 Response: {"status": "success", "chunk_id": 1}

🎙️  Recording chunk 2 (10s)...
   ⏸️  Recording complete
   🔄 Converting to MP3...
   💾 Saved locally: chunk_0002_20260117_220010.mp3
   📏 Size: 158.45 KB
   🕐 Timestamp: 2026-01-17 22:00:10
   📤 Sending to backend...
   ✅ Successfully sent to backend
   📊 Response: {"status": "success", "chunk_id": 2}

^C
============================================================
🛑 RECORDING STOPPED
============================================================
📊 Total chunks recorded: 2
📁 Audio files saved in: recorded_audio/
⏱️  Total duration: 20 seconds
============================================================
```

---

## 🎯 Summary

**For your use case, use `record_and_send.py`:**

✅ Single command
✅ 10-second MP3 chunks
✅ Saves locally first
✅ Sends to backend immediately
✅ No Redis needed
✅ Simple and reliable

**Command:**
```bash
python3 record_and_send.py
```

That's it! 🎉
