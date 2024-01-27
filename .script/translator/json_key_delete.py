import os
import json
import csv

# Define the base path to the 'locates' folder
base_path = '../../public/locales'

# Read the language codes from the languages.csv
language_codes = []
with open('languages.csv', newline='', encoding='utf-8') as csvfile:
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        language_codes.append(row[0])

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

# For each language code and each target file, remove the specified target keys
for lang_code in language_codes:
    for file_name, keys_to_delete in target_keys_per_file.items():
        # Construct the file path
        file_path = os.path.join(base_path, lang_code, file_name + '.json')
        
        # Check if the file exists
        if os.path.isfile(file_path):
            # Read the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Remove the target keys
            modified = False
            for key in keys_to_delete:
                if key in data:
                    del data[key]
                    modified = True
            
            # Save the modified JSON file
            if modified:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=2)
                print(f'Updated file: {file_path} with {len(keys_to_delete)} keys removed.')
            else:
                print(f'No changes made to file: {file_path}')
        else:
            print(f'File {file_path} does not exist.')

print('Finished updating JSON files.')