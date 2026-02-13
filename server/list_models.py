import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path(__file__).resolve().parent / '.env' # Assuming list_models.py is in root or similar, adjust if in server
# Actually aiAnalysis.py is in server/, so .env is in parent.
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("API Key not found!")
else:
    client = genai.Client(api_key=api_key)
    print("Listing models...")
    for m in client.models.list(config={"page_size": 100}):
        print(m.name)