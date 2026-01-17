# consumer.py
import redis
import time
import pickle
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ================= CONFIG =================
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
QUEUE_NAME = os.getenv("QUEUE_NAME", "audio_queue:PASTE_SESSION_NAME_HERE")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
API_ENDPOINT_PATH = os.getenv("API_ENDPOINT", "/transcribe-chunk")
API_ENDPOINT = f"{BACKEND_BASE_URL}{API_ENDPOINT_PATH}"
# =========================================

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

print("👂 Consumer started")
print(f"🧵 Listening on queue: {QUEUE_NAME}")
print(f"🌐 API Endpoint: {API_ENDPOINT}\n")


def send_to_api(payload):
    """Send audio chunk to transcription API using multipart form"""
    try:
        audio_info = payload["audio_file"]
        
        # Get current timestamp in microseconds (Unix epoch)
        timestamp_us = int(time.time() * 1_000_000)
        
        files = {
            "audio_file": (audio_info["filename"], audio_info["bytes"], "audio/mpeg")
        }
        
        data = {
            "chunk_number": payload["chunk_number"],
            "time": payload.get("time", timestamp_us),  # Use existing time or current timestamp
            "timestamp_us": timestamp_us  # Microsecond precision timestamp
        }
        
        response = requests.post(API_ENDPOINT, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            print(f"✅ Chunk {payload['chunk_number']} sent successfully")
            print(f"   Timestamp: {timestamp_us} ({time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp_us / 1_000_000))})")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Failed to send chunk {payload['chunk_number']}: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error sending chunk: {e}")
    except Exception as e:
        print(f"❌ Error processing chunk: {e}")


while True:
    item = r.blpop(QUEUE_NAME, timeout=5)

    if item:
        _, payload_bytes = item
        
        try:
            payload = pickle.loads(payload_bytes)
            print(f"🎧 Processing chunk: {payload['chunk_number']}")
            
            send_to_api(payload)
            
        except Exception as e:
            print(f"❌ Error deserializing payload: {e}")

    else:
        time.sleep(1)
