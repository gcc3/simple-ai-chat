import os
import csv
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load the API key from .env file
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Initialize the OpenAI client
openai = OpenAI(api_key=api_key)

# Function to translate text using OpenAI API
def translate(text, target_language_name):
    completion = openai.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You're a greate translator! I'll give you a text to translate. When you translating, don't translate the word `Simple AI`.",
            },
            {
                "role": "user",
                "content": f"Translate the following text to {target_language_name}:\n\n{text}",
            },
        ],
        model="gpt-4-1106-preview",
    )
    # Extract the translated text from the response
    translated_text = completion.choices[0].message.content
    return translated_text

# Specify the file name and key to translate
file_name = "translation.json"
key_to_translate = "welcome"

# Read the source language code
source_language_code = 'en'
source_file_path = f"../../public/locales/{source_language_code}/{file_name}"

# Define the path to the languages CSV file
languages_csv_path = 'languages.csv'

# Define the path to the locales directory
locales_dir = "../../public/locales"

# Open the CSV file containing language codes and names
with open(languages_csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        language_code, language_name = row
        # Skip the source language
        if language_code == source_language_code:
            continue

        target_file_path = f"{locales_dir}/{language_code}/{file_name}"

        # Load the source content
        with open(source_file_path, 'r', encoding='utf-8') as source_file:
            source_content = json.load(source_file)

        # Check if the key exists in the source content
        if key_to_translate not in source_content:
            print(f"Key '{key_to_translate}' not found in {source_file_path}")
            continue

        # Translate the content of the specific key
        text_to_translate = source_content[key_to_translate]
        translated_text = translate(text_to_translate, language_name)

        # Load the target content, if it exists, and update the specific key
        if os.path.exists(target_file_path):
            with open(target_file_path, 'r', encoding='utf-8') as target_file:
                target_content = json.load(target_file)
        else:
            target_content = {}

        target_content[key_to_translate] = translated_text

        # Write the updated content back to the target file
        with open(target_file_path, 'w', encoding='utf-8') as target_file:
            json.dump(target_content, target_file, ensure_ascii=False, indent=2)

        print(f"Key '{key_to_translate}' translated to {language_name} and updated in {file_name}")