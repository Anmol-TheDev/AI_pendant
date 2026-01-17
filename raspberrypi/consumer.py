# consumer.py
import redis
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ================= CONFIG =================
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
QUEUE_NAME = os.getenv("QUEUE_NAME", "audio_queue:PASTE_SESSION_NAME_HERE")
# =========================================

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

print("👂 Consumer started")
print(f"🧵 Listening on queue: {QUEUE_NAME}\n")

while True:
    item = r.blpop(QUEUE_NAME, timeout=5)

    if item:
        _, chunk_path = item
        chunk_path = chunk_path.decode()

        print(f"🎧 Processing chunk: {chunk_path}")

        # ---- PLACE YOUR LOGIC HERE ----
        # Speech-to-text
        # Upload to server
        # AI inference
        # Noise filtering
        # --------------------------------

    else:
        time.sleep(1)
        # print("⏳ Waiting for new chunks...")
