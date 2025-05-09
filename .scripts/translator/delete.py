import os
import json
import csv
import argparse

# Define command line arguments
parser = argparse.ArgumentParser(description='Delete translation keys from locale files')
parser.add_argument('--keys', nargs='+', help='Keys to delete in format "filename:key"', required=False)
parser.add_argument('--csv', help='Path to a CSV file containing filename,key pairs', required=False)
args = parser.parse_args()

# Define the base path to the 'locates' folder
base_path = "../../public/locales"

# Read the language codes from the languages.csv
language_codes = []
with open("languages.csv", newline="", encoding="utf-8") as csvfile:
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        language_codes.append(row[0])

# Map keys to each file based on user input
keys_per_file = {}

# Function to add keys to the keys_per_file dictionary
def add_key_to_file(file_name, key):
    if file_name not in keys_per_file:
        keys_per_file[file_name] = set()
    keys_per_file[file_name].add(key)

# Process input from --keys argument
if args.keys:
    for item in args.keys:
        # Split the input by colon (filename:key)
        parts = item.split(':', 1)
        if len(parts) == 2:
            file_name, key = parts
            add_key_to_file(file_name, key)
        else:
            print(f"Warning: Invalid format for '{item}'. Expected 'filename:key'")

# Process input from --csv argument
elif args.csv:
    with open(args.csv, newline="", encoding="utf-8") as csvfile:
        csv_reader = csv.reader(csvfile)
        for row in csv_reader:
            if len(row) >= 2:
                file_name, key = row
                add_key_to_file(file_name, key)

# If no input method is provided, fall back to keys.csv for backward compatibility
else:
    try:
        with open("keys.csv", newline="", encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)
            for row in csv_reader:
                if len(row) >= 2:
                    file_name, key = row
                    add_key_to_file(file_name, key)
    except FileNotFoundError:
        print("Error: No input method specified and keys.csv not found.")
        print("Please provide keys using --keys or --csv option.")
        exit(1)

# Check if we have any keys to delete
if not keys_per_file:
    print("No keys specified for deletion. Exiting.")
    exit(0)

# For each language code and each target file, remove the specified target keys
for lang_code in language_codes:
    for file_name, keys_to_delete in keys_per_file.items():
        # Construct the file path
        file_path = os.path.join(base_path, lang_code, file_name + ".json")

        # Check if the file exists
        if os.path.isfile(file_path):
            # Read the JSON file
            with open(file_path, "r", encoding="utf-8") as file:
                data = json.load(file)

            # Remove the target keys
            modified = False
            for key in keys_to_delete:
                if key in data:
                    del data[key]
                    modified = True

            # Save the modified JSON file
            if modified:
                with open(file_path, "w", encoding="utf-8") as file:
                    json.dump(data, file, ensure_ascii=False, indent=2)
                print(
                    f"Updated file: {file_path} with {len(keys_to_delete)} keys removed."
                )
            else:
                print(f"No changes made to file: {file_path}")
        else:
            print(f"File {file_path} does not exist.")

print("Finished updating JSON files.")
