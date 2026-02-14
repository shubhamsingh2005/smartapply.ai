from app.core.config import settings
import httpx
import asyncio

async def test_gemini3():
    key = settings.GOOGLE_AI_API_KEY
    model = "gemini-3-pro-preview"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    
    payload = {
        "contents": [{"parts": [{"text": "hi"}]}]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini3())
