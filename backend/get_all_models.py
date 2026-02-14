from app.core.config import settings
import httpx
import asyncio

async def list_models():
    key = settings.GOOGLE_AI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            models = [m['name'] for m in res.json().get('models', [])]
            with open("all_models.txt", "w") as f:
                f.write("\n".join(models))
        else:
            print(f"Error: {res.status_code}")

if __name__ == "__main__":
    asyncio.run(list_models())
