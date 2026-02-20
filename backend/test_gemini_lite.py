from google import genai
from google.genai import types
import os

def test_gemini():
    print(f"Project: {os.environ.get('GCP_PROJECT')}")
    try:
        client = genai.Client(vertexai=True, project=os.environ.get("GCP_PROJECT"), location="us-central1")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="What is AI",
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
            )
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gemini()
