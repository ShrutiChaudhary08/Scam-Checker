from typing import List, Optional, Literal
from pydantic import BaseModel, Field

VerdictType = Literal["SCAM", "SUSPICIOUS", "SAFE", "UNKNOWN"]

class AnalyzeRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="The SMS or WhatsApp message content")
    model: Optional[str] = Field("gemma3", description="The Ollama model to invoke (e.g. gemma3, gemma3:1b)")
    ollama_url: Optional[str] = Field("http://localhost:11434", description="Ollama server host URL")
    prefer_local: Optional[bool] = Field(False, description="Whether to bypass model inference and use local rule engine")
    language: Optional[Literal["hinglish", "english"]] = Field("hinglish", description="Explanation language")

class SuspiciousIndicator(BaseModel):
    text: str = Field(..., description="Extract of suspicious phrase or URL from the message")
    reason: str = Field(..., description="Why this phrase is concerning")
    severity: Optional[Literal["critical", "high", "medium", "low"]] = "medium"

class AnalysisResponse(BaseModel):
    id: str
    message: str
    verdict: VerdictType
    summary: str
    explanation: str
    warning_signs: List[str] = Field(default_factory=list)
    suspicious_indicators: List[SuspiciousIndicator] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    model_used: str
    latency_ms: int
    timestamp: str
    engine: str
    is_fallback: bool = False
