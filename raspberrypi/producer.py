# producer.py
import sounddevice as sd
import numpy as np
import os
from datetime import datetime
import redis
from scipy.io.wavfile import write
import subprocess

# ================= CONFIG =================
SAMPLE_RATE = 44100
CHUNK_DURATION = 10  # seconds
CHUNK_FRAMES = SAMPLE_RATE * CHUNK_DURATION
BASE_FOLDER = "recordings"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
MP3_BITRATE = "192k"
# =========================================

# Redis connection
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

# Create folders
os.makedirs(BASE_FOLDER, exist_ok=True)

session_name = datetime.now().strftime("session_%Y-%m-%d_%H-%M-%S")
session_path = os.path.join(BASE_FOLDER, session_name)
os.makedirs(session_path)

queue_name = f"audio_queue:{session_name}"

print("🎙 Recording started")
print("👉 Speak now... Press ENTER to stop\n")

buffer = []
chunk_index = 0

def wav_to_mp3(wav_path, mp3_path):
    """Convert WAV → MP3 using ffmpeg"""
    subprocess.run(
        [
            "ffmpeg",
            "-y",               # overwrite
            "-loglevel", "error",
            "-i", wav_path,
            "-acodec", "libmp3lame",
            "-ab", MP3_BITRATE,
            mp3_path
        ],
        check=True
    )

def save_mp3(audio_np, index):
    wav_path = os.path.join(session_path, f"chunk_{index:03d}.wav")
    mp3_path = os.path.join(session_path, f"chunk_{index:03d}.mp3")

    # Write WAV
    write(wav_path, SAMPLE_RATE, audio_np)

    # Convert to MP3
    wav_to_mp3(wav_path, mp3_path)

    # Remove WAV
    os.remove(wav_path)

    return mp3_path

def callback(indata, frames, time, status):
    global buffer, chunk_index

    buffer.append(indata.copy())
    total_frames = sum(len(b) for b in buffer)

    if total_frames >= CHUNK_FRAMES:
        chunk_index += 1

        audio_data = np.concatenate(buffer, axis=0)
        chunk_audio = audio_data[:CHUNK_FRAMES]
        remaining = audio_data[CHUNK_FRAMES:]

        buffer = [remaining] if len(remaining) > 0 else []

        mp3_path = save_mp3(chunk_audio, chunk_index)

        # Push MP3 path into Redis (ORDER SAFE)
        r.rpush(queue_name, mp3_path)

        print(f"📦 Chunk {chunk_index} queued → MP3")

# Start recording
with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, callback=callback):
    input()

print("\n🛑 Recording stopped")

# Save remaining audio
if buffer:
    chunk_index += 1
    audio_data = np.concatenate(buffer, axis=0)

    mp3_path = save_mp3(audio_data, chunk_index)
    r.rpush(queue_name, mp3_path)

    print(f"📦 Final chunk {chunk_index} queued → MP3")

print("\n✅ Recording session complete")
print(f"📁 Session folder: {session_path}")
print(f"🧵 Redis queue: {queue_name}")
