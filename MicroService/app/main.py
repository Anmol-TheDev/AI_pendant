from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
from app.routes import audio
from app.queue.worker import start_worker, stop_worker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await start_worker()
    yield
    # Shutdown
    await stop_worker()

app = FastAPI(
    title="Audio Transcription Microservice",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(audio.router)

@app.get("/health")
async def health():
    return {"status": "healthy"}
