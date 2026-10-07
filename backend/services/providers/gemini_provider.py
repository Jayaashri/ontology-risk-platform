
import os

from dotenv import load_dotenv
from google import genai
from PIL import Image
from io import BytesIO

load_dotenv()


def analyze_with_gemini(image_bytes, prompt):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "Gemini is not configured. Add GEMINI_API_KEY to .env."
        )

    client = genai.Client(api_key=api_key)

    image = Image.open(BytesIO(image_bytes))

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[prompt, image]
    )

    return response.text