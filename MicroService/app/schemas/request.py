from pydantic import BaseModel, Field

class TranscribeRequest(BaseModel):
    chunk_number: int = Field(..., ge=0, description="Chunk sequence number")
    time: str = Field(..., description="ISO timestamp or unix timestamp")
