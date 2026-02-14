from app.core.config import settings
import httpx
import asyncio

async def test_latest():
    key = settings.GOOGLE_AI_API_KEY
    model = "gemini-flash-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]})
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text[:100]}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_latest())
