from app.core.config import settings
import httpx
import asyncio

async def test_all_variants():
    key = settings.GOOGLE_AI_API_KEY
    variants = [
        ("v1", "gemini-1.5-flash"),
        ("v1beta", "gemini-1.5-flash"),
        ("v1", "gemini-1.5-pro"),
        ("v1beta", "gemini-1.5-pro"),
        ("v1beta", "gemini-2.0-flash"),
        ("v1", "gemini-pro"),
    ]
    
    results = []
    async with httpx.AsyncClient() as client:
        for version, model in variants:
            url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
            try:
                res = await client.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]})
                results.append(f"{version}/{model}: {res.status_code}")
                if res.status_code != 200:
                    results.append(f"  Error: {res.text[:50]}")
            except Exception as e:
                results.append(f"{version}/{model}: Exception {e}")
                
    with open("diag_results.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(test_all_variants())
