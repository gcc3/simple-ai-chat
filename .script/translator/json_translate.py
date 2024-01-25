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
                "role": "user",
                "content": f"Translate the following text to {target_language_name} and response with json format:\n\n"
                           + "\n\n" + text
                           + "\n\n" + "json format: {\"content\": \"translated text\"}",
            },
        ],
        model="gpt-4-1106-preview",
        response_format={ "type": "json_object" }
    )
    # Extract the translated text from the generated JSON format
    translated_json = json.loads(completion.choices[0].message.content)
    return translated_json['content']
    
# Read the source language code
source_language_code = 'en'
source_filename = f'content_{source_language_code}.json'

# Read the CSV file containing language codes and names
with open('languages.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        language_code, language_name = row
        # Skip the source language
        if language_code != source_language_code:
            target_filename = f'content_{language_code}.json'
            # Load existing translations if the file exists
            if os.path.exists(target_filename):
                with open(target_filename, 'r', encoding='utf-8') as target_file:
                    existing_translations = json.load(target_file)
            else:
                existing_translations = {}

            # Load the content to be translated
            with open(source_filename, 'r', encoding='utf-8') as source_file:
                content_dict = json.load(source_file)

            # Create or update the dictionary for the translated content
            translated_content_dict = existing_translations.copy()
            for key, value in content_dict.items():
                if key not in translated_content_dict:  # Check if the key already exists
                    print(f'Translating key: {key}')
                    translated_text = translate(value, language_code)
                    translated_content_dict[key] = translated_text

            # Write the combined translated content to the target JSON file
            with open(target_filename, 'w', encoding='utf-8') as target_file:
                json.dump(translated_content_dict, target_file, ensure_ascii=False, indent=2)

            print(f'Content translated to {language_name} and updated in {target_filename}')