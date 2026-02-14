from app.core.config import settings
import httpx
import asyncio

async def test_all_variants():
    key = settings.GOOGLE_AI_API_KEY
    # Common variants for Flash and Pro
    variants = [
        ("v1", "gemini-1.5-flash"),
        ("v1beta", "gemini-1.5-flash"),
        ("v1", "gemini-1.5-pro"),
        ("v1beta", "gemini-1.5-pro"),
        ("v1beta", "gemini-2.0-flash"),
    ]
    
    payload = {
        "contents": [{"parts": [{"text": "Respond with the word 'OK' only."}]}]
    }
    
    payload_json = {
        "contents": [{"parts": [{"text": "Respond with {'status': 'OK'} in JSON."}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    async with httpx.AsyncClient() as client:
        for version, model in variants:
            print(f"\n--- Testing {version}/{model} ---")
            url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
            
            # Test 1: Simple call
            try:
                res = await client.post(url, json=payload)
                print(f"Simple Call: {res.status_code}")
                if res.status_code != 200:
                    print(f"  Error: {res.text[:100]}")
            except Exception as e:
                print(f"  Exception: {e}")
                
            # Test 2: JSON call
            try:
                res = await client.post(url, json=payload_json)
                print(f"JSON Output Call: {res.status_code}")
                if res.status_code != 200:
                    print(f"  Error: {res.text[:100]}")
            except Exception as e:
                print(f"  Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_variants())
