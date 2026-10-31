from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints import router as api_router

app = FastAPI(
    title="Scam Checker API",
    description="Local-first AI message verification backend powered by Gemma 3 and Ollama",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "Scam Checker API",
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
