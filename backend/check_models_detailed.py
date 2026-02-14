from app.core.config import settings
import httpx
import asyncio

async def list_models():
    key = settings.GOOGLE_AI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url)
            if res.status_code == 200:
                models = res.json().get('models', [])
                for m in models:
                    methods = m.get('supportedGenerationMethods', [])
                    if 'generateContent' in methods:
                        print(f"MODEL: {m['name']}")
            else:
                print(f"Error: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
