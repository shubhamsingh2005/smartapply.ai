import json
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_AI_API_KEY")

async def test_gemini():
    if not API_KEY:
        print("Error: No API Key found")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say hello world and return it as JSON with a key 'message'"}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
