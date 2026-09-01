import requests
import json

ollama_url = "http://localhost:11434/api/generate"
payload = {
    "model": "llama3.2:latest",
    "prompt": "Say hello world!",
    "stream": False
}

try:
    resp = requests.post(ollama_url, json=payload, timeout=45)
    print("Status:", resp.status_code)
    print("Response:", resp.json()["response"])
except Exception as e:
    print("Error:", e)
