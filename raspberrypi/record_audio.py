#!/usr/bin/env python3
"""
Audio Recording Producer - Records from microphone and enqueues chunks to Redis
"""
import sounddevice as sd
import numpy as np
import redis
import pickle
import time
import os
from datetime import datetime
from scipy.io.wavfile import write
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# ================= CONFIG =================
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
QUEUE_NAME = os.getenv("QUEUE_NAME", "audio_queue:PASTE_SESSION_NAME_HERE")

# Audio settings
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))  # 16kHz for speech
CHUNK_DURATION = int(os.getenv("CHUNK_DURATION", "10"))  # seconds per chunk
CHANNELS = int(os.getenv("CHANNELS", "1"))  # Mono

# Storage settings
AUDIO_FOLDER = os.getenv("AUDIO_FOLDER", "recorded_audio")
# =========================================

# Create audio storage folder
Path(AUDIO_FOLDER).mkdir(exist_ok=True)

# Connect to Redis
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

print("🎤 Audio Recording Producer Started")
print(f"📁 Saving audio to: {AUDIO_FOLDER}/")
print(f"🧵 Queue: {QUEUE_NAME}")
print(f"🔊 Sample Rate: {SAMPLE_RATE}Hz, Channels: {CHANNELS}")
print(f"⏱️  Chunk Duration: {CHUNK_DURATION}s\n")

# List available audio devices
print("Available audio devices:")
print(sd.query_devices())
print()

chunk_number = 0

try:
    while True:
        chunk_number += 1
        
        # Get timestamp in microseconds
        timestamp_us = int(time.time() * 1_000_000)
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        print(f"🎙️  Recording chunk {chunk_number}...")
        
        # Record audio
        recording = sd.rec(
            int(CHUNK_DURATION * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype='int16'
        )
        sd.wait()  # Wait until recording is finished
        
        # Save to file
        filename = f"chunk_{chunk_number:04d}_{timestamp_str}.wav"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        write(filepath, SAMPLE_RATE, recording)
        
        print(f"💾 Saved: {filepath}")
        
        # Read file as bytes for API transmission
        with open(filepath, 'rb') as f:
            audio_bytes = f.read()
        
        # Create payload
        payload = {
            "chunk_number": chunk_number,
            "time": timestamp_us,
            "audio_file": {
                "filename": filename,
                "bytes": audio_bytes,
                "filepath": filepath
            }
        }
        
        # Enqueue to Redis
        r.rpush(QUEUE_NAME, pickle.dumps(payload))
        print(f"📤 Enqueued chunk {chunk_number} to Redis")
        print(f"   Timestamp: {timestamp_us}")
        print(f"   Time: {datetime.fromtimestamp(timestamp_us / 1_000_000).strftime('%Y-%m-%d %H:%M:%S')}\n")

except KeyboardInterrupt:
    print("\n\n🛑 Recording stopped by user")
    print(f"📊 Total chunks recorded: {chunk_number}")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
