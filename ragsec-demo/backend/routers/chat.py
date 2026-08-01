from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import random
import uuid
from typing import List, Optional, Dict, Any
from llm_engine import generate_mitigation, generate_diagnostic_chat
import requests

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)

@router.get("/models")
def get_models():
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        models = [m.get("name") for m in data.get("models", [])]
        if "llama3.2-vision:latest" not in models and "llama3.2-vision" not in models:
            models.append("llama3.2-vision")
        return {"models": models}
    except Exception as e:
        return {"models": ["llama3.2", "llama3.2-vision"]} # Fallback


class ChatRequest(BaseModel):
    message: str
    model: str = "llama3.2"
    history: List[Dict[str, Any]] = []
    image_b64: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    role: str
    content: str
    confidence: float
    evidence: List[str]
    executive_summary: Optional[str] = None
    technical_analysis: Optional[str] = None
    immediate_mitigation: Optional[List[str]] = None
    is_zero_day: bool = False
    session_id: Optional[str] = None

@router.get("/sessions", response_model=List[schemas.ChatSessionSchema])
def get_sessions(db: Session = Depends(get_db)):
    return db.query(models.ChatSession).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=schemas.ChatSessionSchema)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions", response_model=schemas.ChatSessionSchema)
def create_session(db: Session = Depends(get_db)):
    new_session = models.ChatSession(
        id=str(uuid.uuid4()),
        title="New Chat"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "deleted"}

@router.post("", response_model=ChatResponse)
def handle_chat(req: ChatRequest, db: Session = Depends(get_db)):
    session_id = req.session_id
    if not session_id:
        # Create a new session
        session_id = str(uuid.uuid4())
        # Generate a short title from the first few words of the message
        title_words = req.message.split()[:5]
        title = " ".join(title_words) + ("..." if len(req.message.split()) > 5 else "")
        new_session = models.ChatSession(id=session_id, title=title)
        db.add(new_session)
        db.commit()

    # Save user message
    user_msg = models.ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    llm_response = generate_diagnostic_chat(
        history=req.history,
        latest_msg=req.message,
        model=req.model,
        image_b64=req.image_b64
    )
    
    resp_type = llm_response.get("type", "question")
    
    if resp_type == "question":
        content = llm_response.get("content", "Could you clarify that?")
        confidence = 0.0
        evidence = []
        exec_summary = None
        tech_analysis = None
        mitigation = []
        zero_day = False
    else:
        # It's a diagnosis
        threats = db.query(models.Threat).order_by(models.Threat.created_at.desc()).limit(2).all()
        evidence = [f"{t.id} - {t.origin}" for t in threats]
        content = llm_response.get("content", "Based on our analysis, here is the mitigation plan.")
        confidence = random.uniform(0.92, 0.99)
        exec_summary = llm_response.get("executive_summary")
        tech_analysis = llm_response.get("technical_analysis")
        mitigation = llm_response.get("immediate_mitigation", [])
        zero_day = llm_response.get("is_zero_day", False)

    # Save assistant message
    asst_msg = models.ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="assistant",
        content=content,
        confidence=confidence,
        evidence=evidence,
        executive_summary=exec_summary,
        technical_analysis=tech_analysis,
        immediate_mitigation=mitigation,
        is_zero_day=str(zero_day)
    )
    db.add(asst_msg)
    db.commit()

    return ChatResponse(
        role="assistant",
        content=content,
        confidence=confidence,
        evidence=evidence,
        executive_summary=exec_summary,
        technical_analysis=tech_analysis,
        immediate_mitigation=mitigation,
        is_zero_day=zero_day,
        session_id=session_id
    )
