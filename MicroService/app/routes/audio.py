from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.request import TranscribeRequest
from app.schemas.response import TranscribeResponse, TranscribeResponseWithText
from app.queue.worker import enqueue_task
from app.services.filter import filter_audio
from app.services.transcribe import transcribe_audio
from app.services.callback import send_to_backend
import logging
import asyncio

router = APIRouter(prefix="/transcribe-chunk", tags=["transcription"])
logger = logging.getLogger(__name__)

@router.post("", response_model=TranscribeResponseWithText, status_code=200)
async def transcribe_chunk(
    audio_file: UploadFile = File(...),
    chunk_number: int = Form(...),
    time: str = Form(...)
):
    """
    Receive audio chunk, process it, and return the transcript.
    Also sends the result to the backend asynchronously.
    """
    try:
        # Read audio data
        audio_data = await audio_file.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        logger.info(f"Processing chunk {chunk_number}")
        
        # Filter audio
        filtered_audio = await asyncio.to_thread(
            filter_audio,
            audio_data,
            audio_file.filename or "audio"
        )
        
        # Transcribe
        transcript = await transcribe_audio(filtered_audio)
        
        # Send to backend asynchronously (fire and forget)
        asyncio.create_task(send_to_backend(chunk_number, transcript, time))
        
        logger.info(f"Chunk {chunk_number} processed successfully, transcript length: {len(transcript)}")
        
        return TranscribeResponseWithText(
            status="completed",
            chunk=chunk_number,
            text=transcript,
            time=time
        )
    
    except Exception as e:
        logger.error(f"Failed to process chunk {chunk_number}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {str(e)}")

@router.post("/async", response_model=TranscribeResponse, status_code=202)
async def transcribe_chunk_async(
    audio_file: UploadFile = File(...),
    chunk_number: int = Form(...),
    time: str = Form(...)
):
    """
    Receive audio chunk and enqueue for transcription.
    Returns 202 immediately after enqueueing.
    """
    try:
        # Read audio data
        audio_data = await audio_file.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Enqueue task
        await enqueue_task({
            "audio_data": audio_data,
            "chunk_number": chunk_number,
            "time": time,
            "filename": audio_file.filename
        })
        
        logger.info(f"Enqueued chunk {chunk_number} for transcription")
        
        return TranscribeResponse(
            status="queued",
            chunk=chunk_number
        )
    
    except Exception as e:
        logger.error(f"Failed to enqueue chunk {chunk_number}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task: {str(e)}")
