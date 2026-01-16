from pydantic import BaseModel

class TranscribeResponse(BaseModel):
    status: str
    chunk: int

class TranscribeResponseWithText(BaseModel):
    status: str
    chunk: int
    text: str
    time: str

class BackendPayload(BaseModel):
    chunk_number: int
    text: str
    time: str
    source: str = "ai-pendant"
