import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

async def send_to_backend(chunk_number: int, text: str, time: str) -> bool:
    """
    Send transcription result to main backend service.
    """
    url = f"{settings.backend_url}{settings.backend_endpoint}"
    
    # Format payload according to backend requirements
    payload = {
        "text": text,
        "timestamp": time,
        "chunkNumber": chunk_number
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                url,
                json=payload
            )
            response.raise_for_status()
            
            logger.info(f"Backend callback successful for chunk {chunk_number}")
            return True
        
        except httpx.HTTPStatusError as e:
            logger.error(f"Backend callback failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Backend callback error: {str(e)}")
            raise
