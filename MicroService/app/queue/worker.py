import asyncio
from typing import Dict, Any
import logging
from collections import defaultdict
from app.services.filter import filter_audio
from app.services.transcribe import transcribe_audio
from app.services.callback import send_to_backend
from app.config import settings

logger = logging.getLogger(__name__)

# Task queue with priority ordering
task_queue: asyncio.PriorityQueue = None
workers: list = []
running = False

# Metrics
metrics = {
    "queue_depth": 0,
    "total_processed": 0,
    "total_failures": 0,
    "latency_sum": 0.0
}

async def start_worker():
    """Initialize and start worker tasks."""
    global task_queue, workers, running
    
    task_queue = asyncio.PriorityQueue(maxsize=settings.max_queue_size)
    running = True
    
    # Start worker tasks
    workers = [
        asyncio.create_task(worker_loop(i))
        for i in range(settings.worker_count)
    ]
    
    logger.info(f"Started {settings.worker_count} worker tasks")

async def stop_worker():
    """Stop all worker tasks."""
    global running, workers
    
    running = False
    
    # Cancel all workers
    for worker in workers:
        worker.cancel()
    
    await asyncio.gather(*workers, return_exceptions=True)
    logger.info("All workers stopped")

async def enqueue_task(task_data: Dict[str, Any]):
    """
    Enqueue a transcription task.
    Tasks are ordered by chunk_number for processing.
    """
    chunk_number = task_data["chunk_number"]
    
    # Use chunk_number as priority (lower = higher priority)
    await task_queue.put((chunk_number, task_data))
    
    metrics["queue_depth"] = task_queue.qsize()
    logger.info(f"Task enqueued: chunk {chunk_number}, queue depth: {metrics['queue_depth']}")

async def worker_loop(worker_id: int):
    """
    Worker loop that processes tasks from the queue.
    """
    logger.info(f"Worker {worker_id} started")
    
    while running:
        try:
            # Get task with timeout to allow graceful shutdown
            priority, task_data = await asyncio.wait_for(
                task_queue.get(),
                timeout=1.0
            )
            
            metrics["queue_depth"] = task_queue.qsize()
            
            # Process task with retry logic
            await process_task_with_retry(task_data, worker_id)
            
            task_queue.task_done()
        
        except asyncio.TimeoutError:
            continue
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker {worker_id} error: {str(e)}")

async def process_task_with_retry(task_data: Dict[str, Any], worker_id: int):
    """
    Process a single task with exponential backoff retry.
    """
    chunk_number = task_data["chunk_number"]
    audio_data = task_data["audio_data"]
    time = task_data["time"]
    
    import time as time_module
    start_time = time_module.time()
    
    for attempt in range(settings.max_retries):
        try:
            logger.info(f"Worker {worker_id} processing chunk {chunk_number}, attempt {attempt + 1}")
            
            # Step 1: Filter audio
            filtered_audio = await asyncio.to_thread(
                filter_audio,
                audio_data,
                task_data.get("filename", "audio")
            )
            
            # Step 2: Transcribe with Whisper
            from app.services.transcribe import transcribe_audio_chunk
            result = await transcribe_audio_chunk(
                audio_data=filtered_audio,
                chunk_number=chunk_number,
                timestamp=time,
                skip_if_silent=True
            )
            
            # Step 3: Send to backend (only if not skipped)
            if result.get("status") != "skipped":
                await send_to_backend(chunk_number, result["text"], time)
            else:
                logger.info(f"Chunk {chunk_number} skipped (silent audio)")
            
            # Success
            elapsed = time_module.time() - start_time
            metrics["total_processed"] += 1
            metrics["latency_sum"] += elapsed
            
            logger.info(f"Chunk {chunk_number} processed successfully in {elapsed:.2f}s")
            return
        
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed for chunk {chunk_number}: {str(e)}")
            
            if attempt < settings.max_retries - 1:
                # Exponential backoff
                wait_time = settings.retry_backoff_base ** attempt
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                # Final failure
                metrics["total_failures"] += 1
                logger.error(f"Chunk {chunk_number} failed after {settings.max_retries} attempts")

def get_metrics() -> Dict[str, Any]:
    """Get current metrics."""
    avg_latency = 0.0
    if metrics["total_processed"] > 0:
        avg_latency = metrics["latency_sum"] / metrics["total_processed"]
    
    return {
        "queue_depth": metrics["queue_depth"],
        "total_processed": metrics["total_processed"],
        "total_failures": metrics["total_failures"],
        "average_latency": avg_latency
    }
