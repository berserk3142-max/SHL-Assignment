"""Test OpenAI API directly to verify it works."""
import json
import os
from dotenv import load_dotenv
load_dotenv("backend/.env")

from openai import OpenAI

key = os.getenv("OPENAI_API_KEY", "")
print(f"Key found: {bool(key)}")
print(f"Key starts with: {key[:20]}...")

client = OpenAI(api_key=key)

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": 'You are an SHL Assessment Advisor. Respond with valid JSON: {"reply":"...","recommendations":[],"end_of_conversation":false}'},
            {"role": "user", "content": "I need assessments for hiring a senior Java developer"}
        ],
        temperature=0.1,
        max_tokens=2000,
        response_format={"type": "json_object"}
    )
    raw = response.choices[0].message.content
    result = json.loads(raw)
    print("\n=== OpenAI API WORKING! ===")
    print(f"Reply: {result.get('reply', '')[:200]}")
    print(f"Recommendations: {len(result.get('recommendations', []))}")
    print(f"Raw JSON:\n{json.dumps(result, indent=2)[:500]}")
except Exception as e:
    print(f"\n=== OpenAI API ERROR ===")
    print(f"Error: {e}")
