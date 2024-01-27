import os
import json
import csv

# Define the base path to the 'locates' folder
base_path = '../../public/locales'

# Read the language codes from the languages.csv
language_codes = []
with open('languages.csv', newline='', encoding='utf-8') as csvfile:  # Note the encoding
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        language_codes.append(row[0])  # Assuming the language code is in the first column

# Read the target keys (keys to be deleted) from json_target_keys.csv
target_keys = []
with open('target_keys.csv', newline='', encoding='utf-8') as csvfile:  # Note the encoding
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        target_keys.append(row[0])  # Assuming the key is in the first column

# For each language code and each JSON file, remove the target keys
for lang_code in language_codes:
    for file_name in os.listdir(os.path.join(base_path, lang_code)):
        if file_name.endswith('.json'):
            # Construct the file path
            file_path = os.path.join(base_path, lang_code, file_name)

            # Read the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Remove the target keys
            modified = False
            for key in target_keys:
                if key in data:
                    del data[key]
                    modified = True
            
            # Save the modified JSON file
            if modified:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=2)
                print(f'Updated file: {file_path}')
            else:
                print(f'No changes made to file: {file_path}')

print('Finished updating JSON files.')