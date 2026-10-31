import time
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.message import AnalyzeRequest, AnalysisResponse
from backend.app.services.checker import check_with_ollama, analyze_locally

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_message_endpoint(req: AnalyzeRequest):
    start = time.time()
    clean_msg = req.message.strip()
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    model_used = req.model or "gemma3"
    is_fallback = False

    if req.prefer_local:
        res = analyze_locally(clean_msg, req.language or "hinglish")
        model_used = "Local Rule Engine"
    else:
        try:
            res = check_with_ollama(clean_msg, model=model_used, host=req.ollama_url or "http://localhost:11434")
        except Exception as e:
            # Fallback cleanly to local rule engine without exposing raw trace
            res = analyze_locally(clean_msg, req.language or "hinglish")
            model_used = "Local Rule Engine (Fallback)"
            is_fallback = True

    latency_ms = int((time.time() - start) * 1000)

    return AnalysisResponse(
        id="res_" + str(uuid.uuid4())[:8],
        message=clean_msg,
        verdict=res["verdict"],
        summary=res["summary"],
        explanation=res["explanation"],
        warning_signs=res.get("warning_signs", []),
        suspicious_indicators=res.get("suspicious_indicators", []),
        recommended_actions=res.get("recommended_actions", []),
        model_used=model_used,
        latency_ms=latency_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
        engine=res.get("engine", "local_rule_engine"),
        is_fallback=is_fallback
    )

@router.get("/health")
async def health_check(ollama_url: str = Query("http://localhost:11434")):
    import httpx
    ollama_ok = False
    models = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{ollama_url.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                ollama_ok = True
                models = [m.get("name") for m in resp.json().get("models", [])]
    except Exception:
        ollama_ok = False

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ollama": {
            "connected": ollama_ok,
            "url": ollama_url,
            "models": models
        },
        "local_rule_engine": {
            "available": True,
            "offline_ready": True
        }
    }

@router.get("/models")
async def list_models():
    return {
        "models": [
            {"id": "local_engine", "name": "Local Rule Engine (Offline, Instant)", "provider": "local", "isDefault": True},
            {"id": "gemma3", "name": "Gemma 3 (4B via Ollama)", "provider": "ollama"},
            {"id": "gemma3:1b", "name": "Gemma 3 (1B via Ollama)", "provider": "ollama"}
        ]
    }
