"""FastAPI application for SHL Assessment Recommender."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import ChatRequest, ChatResponse
from .agent import get_agent_reply, retriever
from .config import CORS_ORIGINS, PORT

app = FastAPI(
    title="SHL Assessment Recommender",
    description="Conversational AI agent that recommends SHL Individual Test Solutions",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "catalog_size": len(retriever.catalog),
        "indexed": retriever.tfidf_matrix is not None,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Main chat endpoint for assessment recommendations."""
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    messages = [m.model_dump() for m in request.messages]

    # Cap at 8 messages (4 turns)
    if len(messages) > 8:
        messages = messages[-8:]

    result = get_agent_reply(messages)
    return ChatResponse(**result)


@app.get("/api/catalog")
def get_catalog():
    """Return the full assessment catalog."""
    return {"assessments": retriever.get_all(), "total": len(retriever.catalog)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
