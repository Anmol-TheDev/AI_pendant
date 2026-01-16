# consumer.py
import redis
import time

# ================= CONFIG =================
REDIS_HOST = "localhost"
REDIS_PORT = 6379
QUEUE_NAME = "audio_queue:PASTE_SESSION_NAME_HERE"
# =========================================

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

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
