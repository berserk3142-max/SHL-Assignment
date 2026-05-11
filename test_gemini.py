from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyBUfKyZe3LYy8MdoCdPLRdI-oCYy-qWc90")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Say hello in JSON format",
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
    ),
)

print("SUCCESS!")
print(response.text)
