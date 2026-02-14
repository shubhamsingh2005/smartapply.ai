from app.core.config import settings
import httpx
import asyncio

async def list_all():
    key = settings.GOOGLE_AI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            data = res.json()
            for m in data.get('models', []):
                print(f"NAME: {m['name']}")
                print(f"METHODS: {m.get('supportedGenerationMethods')}")
        else:
            print(f"Error {res.status_code}: {res.text}")

if __name__ == "__main__":
    asyncio.run(list_all())
