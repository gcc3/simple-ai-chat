import os
import json
import csv
from dotenv import load_dotenv
from openai import OpenAI

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
                "content": "You're an awesome translator! I'm going to give you a text to translate.\n"
                         + "Now you're translating for an AI website called \"Simple AI\".\n"
                         + "The content (word or sentence) is in Documentation, Usage, Subscriptions, and Prvacy Policy page.\n"
                         + "Remember:\n"
                         + "1. Don't translate word \"Simple AI\", keep it.\n"
                         + "2. Don't translate word \"Midjourney\", keep it.\n"
                         + "3. Don't translate word \"token\", keep it.\n"
                         + "4. Keep the HTML tag if it's in the text.\n"
                         + "5. Keep the escape charactors if it's in the text.\n"
                         + "6. Don't translate command, a command starts with `:`, example: `:login [username] [password]`.\n"
                         + "7. Don't translate the text inside {{ }}, example: banking fee {{bankingFee}} included\n"
                         + "8, When translating the word `usage`, it means `how much` user used, not means `how to use`, and the word transted should be short.\n"
            },
            {
                "role": "user",
                "content": f"Translate the following text to {target_language_name} and response with json format:\n\n"
                           + "\n\n" + text
                           + "\n\n" + "json format: {\"content\": \"translated text\"}",
            },
        ],
        temperature=0,
        model="gpt-4-1106-preview",
        response_format={ "type": "json_object" }
    )
    # Extract the translated text from the generated JSON format
    translated_json = json.loads(completion.choices[0].message.content)
    return translated_json['content']

# Define the base path to the 'locales' folder
base_path = '../../public/locales'

# Read the source language code (will not translate this)
source_language_code = 'en'

# Read the language codes and names from the languages.csv
languages = {}
with open('languages.csv', newline='', encoding='utf-8') as csvfile:
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        code, name = row
        languages[code] = name

# Read the target keys and associated file names from target_keys.csv
# and map them to each file
target_keys_per_file = {}
with open('target_keys.csv', newline='', encoding='utf-8') as csvfile:
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        file_name, key = row
        if file_name not in target_keys_per_file:
            target_keys_per_file[file_name] = set()
        target_keys_per_file[file_name].add(key)

# Read the source language file to get the base values for translation
source_data = {}
for file_name in target_keys_per_file:
    source_file_path = os.path.join(base_path, source_language_code, file_name + '.json')
    if os.path.isfile(source_file_path):
        with open(source_file_path, 'r', encoding='utf-8') as file:
            source_data[file_name] = json.load(file)

# Translate and update each target language file with translated values from the source language file
for lang_code, lang_name in languages.items():
    if lang_code == source_language_code:
        continue  # Skip the source language
    
    for file_name, keys_to_translate in target_keys_per_file.items():
        target_file_path = os.path.join(base_path, lang_code, file_name + '.json')
        
        # If the target file exists, read it, otherwise create a new dictionary
        if os.path.isfile(target_file_path):
            with open(target_file_path, 'r', encoding='utf-8') as file:
                target_data = json.load(file)
        else:
            target_data = {}
        
        # Translate and update the target data
        for key in keys_to_translate:
            if key in source_data[file_name]:
                original_text = source_data[file_name][key]
                translated_text = translate(original_text, lang_name)
                target_data[key] = translated_text
            else:
                print(f'Key: `{key}` not found in source data.')
        
        # Save the updated target language file
        with open(target_file_path, 'w', encoding='utf-8') as file:
            json.dump(target_data, file, ensure_ascii=False, indent=2)
        print(f'Updated file: {target_file_path} with keys translated to {lang_name}.')

print('Finished updating JSON files.')