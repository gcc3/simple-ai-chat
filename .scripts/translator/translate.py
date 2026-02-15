import os
import json
import csv
import sys
import click
import shutil
from dotenv import load_dotenv
from openai import OpenAI
from scan import scan_files

# Load the API key from .env file
load_dotenv("../../.env")
api_key = os.getenv("OPENAI_API_KEY")

# Initialize the OpenAI client
openai = OpenAI(api_key=api_key, base_url="https://api.openai.com/v1")


# Move translate out of main
def translate(text, target_language_name):
    completion = openai.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You're an awesome translator! I'm going to give you a text to translate.\n"
                + 'Now you\'re translating for an AI website called "Simple AI".\n'
                + "The content (word or sentence) is in Documentation, Usage, and Prvacy Policy page.\n"
                + "Remember:\n"
                + '1. Don\'t translate word "Simple AI", keep it, except if the target language is Chinese then translate to "Simple AI".\n'
                + '2. Don\'t translate word "token", keep it.\n'
                + "3. Keep the HTML tag if it's in the text.\n"
                + "4. Keep the escape charactors if it's in the text.\n"
                + "5. Don't translate command, a command starts with `:`, example: `:login [username] [password]`.\n"
                + "6. Don't translate the text inside {{ }}, example: banking fee {{bankingFee}} included, keep it can be use insert value.\n"
                + "7. When translating the word `usage`, it means `how much` user used, not means `how to use`, and the word transted should be short.\n"
                + "8. When translating the word `store` it means storage not a shop.\n"
                + "9. When translating the word `function`, it means a programming function.\n"
            },
            {
                "role": "user",
                "content": f"Translate the following text to {target_language_name} and response with json format:\n\n"
                + text
                + "\n\n"
                + 'json format: {"content": "translated text"}',
            },
        ],
        model="o4-mini",
        response_format={"type": "json_object"},
    )
    translated_json = json.loads(completion.choices[0].message.content)
    return translated_json["content"]


def is_key_exist(translation_file, key, language_code="en"):
    base_path = "../../public/locales"
    file_path = os.path.join(base_path, language_code, translation_file + ".json")
    with open(file_path, "r", encoding="utf-8") as file:
        target_data = json.load(file)
    return key in target_data


def add_key(translation_file, key, value=None, language_code="en"):
    base_path = "../../public/locales"
    file_path = os.path.join(base_path, language_code, translation_file + ".json")
    with open(file_path, "r", encoding="utf-8") as file:
        target_data = json.load(file)

    # Add the new key-value pair
    if not value:
        value = key
    target_data[key] = value

    # Write the updated data back to the file
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(target_data, file, ensure_ascii=False, indent=2)


def remove_key(translation_file, key, language_code="en"):
    base_path = "../../public/locales"
    file_path = os.path.join(base_path, language_code, translation_file + ".json")
    with open(file_path, "r", encoding="utf-8") as file:
        target_data = json.load(file)

    # Remove the key
    if key in target_data:
        del target_data[key]

    # Write the updated data back to the file
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(target_data, file, ensure_ascii=False, indent=2)


translation_files = [
    "documentation",
    "privacy_policy",
    "settings",
    "translation",
    "usage",
]


# Define the base path to the 'locales' folder
source_language_code = "en"
base_path = "../../public/locales"

# Ensure languages.csv exists, if not, create from languages.csv.example
if not os.path.exists("languages.csv"):
    if os.path.exists("languages.csv.example"):
        shutil.copy("languages.csv.example", "languages.csv")

# Read the language codes and names from the languages.csv
languages = {}
with open("languages.csv", newline="", encoding="utf-8") as csvfile:
    for row in csv.reader(csvfile):
        code, name = row
        languages[code] = name


# Parse command-line arguments
@click.command()
@click.option("--test", is_flag=True, help="Print keys and exit without translating")
def main(test):
    # Scan new keys
    print("Scanning for new keys...")
    scan_files()

    # Read the target keys and associated file names from keys.csv
    # and map them to each file
    keysets = {}
    with open("keys.csv", newline="", encoding="utf-8") as csvfile:
        for row in csv.reader(csvfile):
            file_name, key = row
            if file_name not in keysets:
                keysets[file_name] = set()
            keysets[file_name].add(key)

    # Loop all keys check if there is new keys
    print("Checking is there new keys scanned...")
    new_keys_count = 0
    for file_name, keyset in keysets.items():
        if file_name == "translation":
            # Skip the translation file, it will be handled manually
            continue

        for key in keyset:
            if not is_key_exist(file_name, key):
                print(f"New key: {file_name},{key}", end="")
                add_key(file_name, key)

                new_keys_count += 1
                print(" ...added.")
    if new_keys_count == 0:
        print("No new keys found.")
    else:
        print(f"{new_keys_count} new keys added.")

    # Loop all translation files for all languages and all existing keys, check is ther any extra keys
    print("Checking is there extra keys in translation files...")
    extra_keys_count = 0
    for target_lang_code, lang_name in languages.items():
        for translation_file in translation_files:
            if translation_file == "translation":
                # Skip the translation file, it will be handled manually
                continue

            with open(
                os.path.join(base_path, target_lang_code, translation_file + ".json"),
                "r",
                encoding="utf-8",
            ) as file:
                target_data = json.load(file)
            keyset = keysets.get(translation_file, set())
            for key in target_data.keys():
                if key not in keyset:
                    print(
                        f"Extra key: {target_lang_code},{translation_file},{key}",
                        end="",
                    )
                    remove_key(translation_file, key, target_lang_code)
                    extra_keys_count += 1
                    print(" ...removed.")
    if extra_keys_count == 0:
        print("No extra keys found.")
    else:
        print(f"{extra_keys_count} extra keys removed.")

    # Translate new keys
    # Read the source language translation file to get the base values for translation
    source_data = {}
    for translation_file in translation_files:
        source_file_path = os.path.join(
            base_path, source_language_code, translation_file + ".json"
        )
        with open(source_file_path, "r", encoding="utf-8") as file:
            source_data[translation_file] = json.load(file)

    # Translate and update each target language file with translated values from the source language file
    for target_lang_code, lang_name in languages.items():
        if target_lang_code == source_language_code:
            continue  # Skip the source language

        for translation_file in translation_files:
            target_file_path = os.path.join(
                base_path, target_lang_code, translation_file + ".json"
            )

            # If the target file exists, read it, otherwise create a new dictionary
            with open(target_file_path, "r", encoding="utf-8") as file:
                target_data = json.load(file)

            # Loop through source data and check if the keys exist in the target data
            # If the key does not exist, add it to the target data with translated value
            for key in source_data[translation_file]:
                if key not in target_data:
                    # Add the new key with the original text
                    original_text = source_data[translation_file][key]
                    if not test:
                        translated_text = translate(original_text, lang_name)
                        target_data[key] = translated_text
                        print(
                            f"Translate: {target_lang_code},{translation_file},{key} -> {translated_text}"
                        )
                    else:
                        print(f"Translate: {target_lang_code},{translation_file},{key}")

            # Save the updated target language file
            if not test:
                with open(target_file_path, "w", encoding="utf-8") as file:
                    json.dump(target_data, file, ensure_ascii=False, indent=2)

    print("---\nFinished updating JSON files.")


if __name__ == "__main__":
    main()
