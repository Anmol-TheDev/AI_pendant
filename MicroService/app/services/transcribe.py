
import logging
import asyncio
import io
import tempfile
import os
from typing import Dict, Any, Optional
import whisper
import numpy as np
import soundfile as sf
from app.config import settings

logger = logging.getLogger(__name__)

# Global model cache to avoid reloading
_whisper_model = None
_model_lock = asyncio.Lock()

async def get_whisper_model():
    """
    Load and cache Whisper model.
    Thread-safe singleton pattern for model loading.
    """
    global _whisper_model
    
    async with _model_lock:
        if _whisper_model is None:
            logger.info(f"Loading Whisper model: {settings.whisper_model}")
            
            def _load_model():
                return whisper.load_model(settings.whisper_model)
            
            _whisper_model = await asyncio.to_thread(_load_model)
            logger.info(f"Whisper model '{settings.whisper_model}' loaded successfully")
    
    return _whisper_model

def is_audio_silent(audio_data: bytes, threshold: float = 0.01) -> bool:
    """
    Check if audio is silent or unusable.
    Returns True if audio energy is below threshold.
    """
    try:
        audio_io = io.BytesIO(audio_data)
        data, _ = sf.read(audio_io)
        
        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        
        # Calculate RMS energy
        rms = np.sqrt(np.mean(data ** 2))
        
        return rms < threshold
    except Exception as e:
        logger.warning(f"Error checking audio silence: {e}")
        return False

async def transcribe_audio_chunk(
    audio_data: bytes,
    chunk_number: int,
    timestamp: str,
    skip_if_silent: bool = True
) -> Dict[str, Any]:
    """
    Transcribe audio chunk using local Whisper model.
    
    Args:
        audio_data: Raw audio bytes (WAV format expected)
        chunk_number: Chunk sequence number
        timestamp: ISO or Unix timestamp
        skip_if_silent: If True, skip silent audio
    
    Returns:
        Dict with transcription result or skip status
    """
    try:
        # Check if audio is silent (from filtering step)
        if skip_if_silent and is_audio_silent(audio_data):
            logger.info(f"Chunk {chunk_number} is silent, skipping transcription")
            return {
                "text": None,
                "chunk": chunk_number,
                "timestamp": timestamp,
                "status": "skipped"
            }
        
        # Load model
        model = await get_whisper_model()
        
        # Transcribe in thread pool (Whisper is CPU-intensive)
        def _transcribe():
            # Write audio to temporary file (Whisper expects file path)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name
            
            try:
                # Transcribe with Whisper
                result = model.transcribe(
                    tmp_path,
                    language=settings.whisper_language if settings.whisper_language != "auto" else None,
                    fp16=False,  # Use FP32 for CPU compatibility
                    verbose=False
                )
                
                return result
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        
        import time
        start_time = time.time()
        result = await asyncio.to_thread(_transcribe)
        duration = time.time() - start_time
        
        # Extract clean text
        text = result["text"].strip()
        
        logger.info(f"Chunk {chunk_number} transcribed: {len(text)} chars in {duration:.2f}s")
        
        return {
            "text": text,
            "chunk": chunk_number,
            "timestamp": timestamp,
            "duration": duration
        }
    
    except Exception as e:
        logger.error(f"Transcription failed for chunk {chunk_number}: {str(e)}")
        raise

async def transcribe_audio(audio_data: bytes) -> str:
    """
    Legacy interface for backward compatibility.
    Returns only the transcribed text.
    """
    result = await transcribe_audio_chunk(
        audio_data=audio_data,
        chunk_number=0,
        timestamp="",
        skip_if_silent=False
    )
    
    if result.get("text") is None:
        return ""
    
    return result["text"]
