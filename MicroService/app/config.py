from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Whisper configuration
    whisper_model: str = "base"  # Options: tiny, base, small, medium, large
    whisper_language: str = "auto"  # Auto-detect or specify language code (e.g., "en", "es")
    
    # Main backend
    backend_url: str = "http://localhost:4000"
    backend_endpoint: str = "/api/transcripts/ingest"
    
    # Retry settings
    max_retries: int = 3
    retry_backoff_base: float = 2.0
    
    # Queue settings
    max_queue_size: int = 1000
    worker_count: int = 4
    
    # Audio processing
    sample_rate: int = 16000
    
    class Config:
        env_file = ".env"

settings = Settings()
