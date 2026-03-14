import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("NO API KEY FOUND")
    exit(1)

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-1.5-pro")
    response = model.generate_content("What is fever?")
    print("SUCCESS: gemini-1.5-pro works!")
    print(response.text)
except Exception as e:
    print(f"FAILED with gemini-1.5-pro: {e}")
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("What is fever?")
        print("SUCCESS: gemini-1.5-flash works!")
    except Exception as e2:
         print(f"FAILED with gemini-1.5-flash as well: {e2}")
