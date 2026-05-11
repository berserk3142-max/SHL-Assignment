"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel
from typing import Literal


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


class Recommendation(BaseModel):
    name: str
    url: str
    test_type: list[str]
    duration: str | None = None
    remote_testing: bool = False
    adaptive_irt: bool = False
    description: str = ""


class ChatResponse(BaseModel):
    reply: str
    recommendations: list[Recommendation]
    end_of_conversation: bool
