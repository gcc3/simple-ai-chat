import os
import csv
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
        type="json",
    )
    return completion.choices[0].message.content

# Read the source language code and document content
source_language_code = 'en'
with open(f'content_{source_language_code}.json', 'r', encoding='utf-8') as file:
    content = file.read()
    print(f'Content to translate:\n{content}')

# Read the CSV file containing language codes and names
with open('languages.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        language_code, language_name = row
        # Skip the source language
        if language_code != source_language_code:
            print(f'Translating content to {language_name}...')
            # Translate the content to the target language
            translated_content = translate(content, language_name)
            # Write the translated content to a new file
            output_filename = f'content_{language_code}.json'
            with open(output_filename, 'w', encoding='utf-8') as output_file:
                output_file.write(translated_content)
            print(f'Content translated to {language_name} and saved in {output_filename}')