"""LLM Agent for SHL Assessment recommendation conversations."""
import json
import os
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY, GEMINI_MODEL
from .retrieval import AssessmentRetriever

retriever = AssessmentRetriever()

SYSTEM_PROMPT = """You are an SHL Assessment Advisor. Your ONLY job is to help hiring managers and recruiters find the right SHL Individual Test Solutions from the official catalog.

## What you can do
- Ask clarifying questions to understand the hiring need
- Recommend 1-10 SHL assessments once you have enough context
- Compare specific assessments when asked
- Refine recommendations when the user changes requirements

## What you CANNOT do
- Recommend assessments not in the provided catalog data
- Give general hiring advice, legal advice, or HR consulting
- Answer questions unrelated to SHL assessments
- Make up URLs, product names, or test details

## When to CLARIFY (do NOT recommend yet)
- The query is vague (e.g., "I need an assessment", "help me hire someone")
- You don't know at least TWO of: role/job function, seniority level, key skills needed
- Ask focused, specific questions to narrow down the need

## When to RECOMMEND
- You know the role, level, and at least one key requirement
- OR the user gave a detailed job description or specific assessment type
- Provide 1-10 items from the CATALOG DATA ONLY, with real URLs
- Include the test type codes and key details

## Conversation rules
- For vague first messages, ALWAYS clarify first - never recommend immediately
- If the user gives enough detail upfront (full job description, specific test name), you CAN recommend on turn 1
- Always honor mid-conversation refinements (add/remove constraints)
- Set end_of_conversation: true only when user explicitly says they're done or satisfied

## CATALOG DATA (retrieved assessments relevant to this conversation)
{retrieved_context}

## Output format
ALWAYS respond with valid JSON only (no markdown, no code fences):
{{
  "reply": "Your conversational reply here",
  "recommendations": [
    {{
      "name": "Assessment Name",
      "url": "https://www.shl.com/...",
      "test_type": ["K"],
      "remote_testing": true,
      "adaptive_irt": false,
      "description": "Brief description"
    }}
  ],
  "end_of_conversation": false
}}

If clarifying or refusing, set recommendations to an empty array [].
"""


def _extract_query(messages: list[dict]) -> str:
    """Synthesize conversation into a retrieval query."""
    user_msgs = [m["content"] for m in messages if m["role"] == "user"]
    # Use last 4 user messages for context
    return " ".join(user_msgs[-4:])


def _format_context(assessments: list[dict]) -> str:
    """Format retrieved assessments as context for the LLM."""
    if not assessments:
        return "No specific assessments retrieved. Ask clarifying questions."

    lines = []
    for i, a in enumerate(assessments, 1):
        types_str = ", ".join(a.get("test_type", []))
        remote = "Yes" if a.get("remote_testing") else "No"
        adaptive = "Yes" if a.get("adaptive_irt") else "No"
        desc = a.get("description", "")[:200]
        lines.append(
            f"{i}. {a['name']}\n"
            f"   URL: {a['url']}\n"
            f"   Type: {types_str} | Remote: {remote} | Adaptive: {adaptive}\n"
            f"   {desc}"
        )
    return "\n".join(lines)


def _sanitize_response(result: dict, retrieved: list[dict]) -> dict:
    """Validate URLs against whitelist, enforce schema."""
    valid_urls = retriever.valid_urls

    clean_recs = []
    for rec in result.get("recommendations", []):
        url = rec.get("url", "")
        if url in valid_urls:
            clean_recs.append({
                "name": rec.get("name", ""),
                "url": url,
                "test_type": rec.get("test_type", []),
                "duration": rec.get("duration"),
                "remote_testing": bool(rec.get("remote_testing", False)),
                "adaptive_irt": bool(rec.get("adaptive_irt", False)),
                "description": rec.get("description", ""),
            })

    # If LLM hallucinated all URLs, fall back to retrieved results
    if not clean_recs and result.get("recommendations"):
        for a in retrieved[:5]:
            clean_recs.append({
                "name": a["name"],
                "url": a["url"],
                "test_type": a.get("test_type", []),
                "duration": a.get("duration"),
                "remote_testing": bool(a.get("remote_testing", False)),
                "adaptive_irt": bool(a.get("adaptive_irt", False)),
                "description": a.get("description", "")[:200],
            })

    return {
        "reply": result.get("reply", "I can help you find the right SHL assessment. Could you tell me more about the role you're hiring for?"),
        "recommendations": clean_recs[:10],
        "end_of_conversation": bool(result.get("end_of_conversation", False)),
    }


def _build_gemini_contents(messages: list[dict]) -> list[types.Content]:
    """Convert chat messages to Gemini Content format."""
    contents = []
    for msg in messages[-8:]:  # Last 8 messages (4 turns)
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg["content"])],
            )
        )
    return contents


def get_agent_reply(messages: list[dict]) -> dict:
    """Main agent function: takes conversation, returns structured response."""
    # Step 1: Extract query for retrieval
    query = _extract_query(messages)

    # Step 2: Retrieve relevant assessments
    retrieved = retriever.retrieve(query, top_k=10) if query.strip() else []

    # Step 3: Format context
    context = _format_context(retrieved)

    # Step 4: Build system prompt
    system = SYSTEM_PROMPT.format(retrieved_context=context)

    # Step 5: Call LLM
    if not GEMINI_API_KEY:
        # Fallback: rule-based response when no API key
        return _fallback_response(messages, retrieved)

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        contents = _build_gemini_contents(messages)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.1,
                max_output_tokens=2000,
                response_mime_type="application/json",
            ),
        )

        raw = response.text
        result = json.loads(raw)
        return _sanitize_response(result, retrieved)

    except Exception as e:
        print(f"LLM Error: {e}")
        return _fallback_response(messages, retrieved)


def _fallback_response(messages: list[dict], retrieved: list[dict]) -> dict:
    """Rule-based fallback when LLM is unavailable."""
    user_msg = messages[-1]["content"].lower() if messages else ""
    is_first_turn = len([m for m in messages if m["role"] == "user"]) == 1

    # Check if query is too vague
    vague_patterns = [
        "assessment", "test", "hire", "help", "need", "looking for",
        "recommend", "suggest", "find",
    ]
    is_vague = len(user_msg.split()) < 8 and any(p in user_msg for p in vague_patterns)

    # Off-topic check
    off_topic = any(w in user_msg for w in [
        "weather", "recipe", "movie", "joke", "hello", "hi", "hey",
        "who are you", "what are you",
    ])

    if off_topic and not any(w in user_msg for w in ["assessment", "test", "hire", "shl"]):
        return {
            "reply": "I'm the SHL Assessment Advisor. I can only help you find the right SHL assessments for your hiring needs. Could you tell me about the role you're looking to fill?",
            "recommendations": [],
            "end_of_conversation": False,
        }

    if is_vague and is_first_turn:
        return {
            "reply": "I'd love to help you find the right SHL assessment! To give you the best recommendations, could you tell me:\n\n1. **What role** are you hiring for?\n2. **What level** is this position? (entry-level, mid-level, senior, executive)\n3. **What key skills or competencies** are most important for this role?",
            "recommendations": [],
            "end_of_conversation": False,
        }

    # Have enough context - return retrieved results
    if retrieved:
        recs = []
        for a in retrieved[:6]:
            recs.append({
                "name": a["name"],
                "url": a["url"],
                "test_type": a.get("test_type", []),
                "duration": a.get("duration"),
                "remote_testing": bool(a.get("remote_testing", False)),
                "adaptive_irt": bool(a.get("adaptive_irt", False)),
                "description": a.get("description", "")[:200],
            })

        return {
            "reply": f"Based on your requirements, here are my recommended SHL assessments. These cover the key skills and competencies you mentioned. Would you like me to refine these recommendations or explain any of them in more detail?",
            "recommendations": recs,
            "end_of_conversation": False,
        }

    return {
        "reply": "I couldn't find specific assessments matching your criteria. Could you provide more details about the role, required skills, or the type of assessment you're looking for?",
        "recommendations": [],
        "end_of_conversation": False,
    }
