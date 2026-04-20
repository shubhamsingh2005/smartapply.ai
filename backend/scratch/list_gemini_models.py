import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_AI_API_KEY")

async def list_models():
    if not API_KEY:
        print("Error: No API Key found")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                models = response.json().get('models', [])
                for m in models:
                    print(f"- {m['name']}")
            else:
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
