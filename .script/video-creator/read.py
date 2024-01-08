import requests
import os
from dotenv import load_dotenv
import time

# Load the OpenAI API key from the .env file
load_dotenv('../../.env')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Function to call OpenAI API and generate speech from text
def generate_speech(input_text, filename):
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json',
    }

    data = {
        'model': 'tts-1-hd',
        'input': input_text,
        'voice': 'echo',
    }

    response = requests.post('https://api.openai.com/v1/audio/speech', headers=headers, json=data)
    
    if response.status_code == 200:
        # Save the response content (audio data) as an MP3 file
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Audio saved to '{filename}'")
    else:
        print(f"Error: {response.text}")
        
def format_number(n):
    return int(n) if n.is_integer() else n

def find_next_index(i_from, sentences):
    for i, sentence in enumerate(sentences, start=1):
        if i > i_from and sentence:
            # ignore lines that are already numbered
            if not sentence.startswith('['):
                # ignore lines that are already numbered
                continue
            return float(sentence[1: sentence.index(']')])
    return -1

def main():
    input_filename = 'content.txt'
    output_filename = 'content.txt'
    
    # Read sentences from the input file
    with open(input_filename, 'r') as file:
        sentences = file.read().strip().split('\n')

    # Generate speech for each sentence and write back to the file with numbering
    result_sentences = []
    index = float(1)
    for i, sentence in enumerate(sentences, start=1):
        if sentence:
            if sentence.startswith('#'):
                # found a comment
                result_sentences.append(sentence)
                continue
            
            if sentence.startswith('['):
                # found a numbered sentence
                result_sentences.append(sentence)
                
                # Read index from the []
                index = float(sentence[1: sentence.index(']')])
                next_index = find_next_index(i, sentences)
                if not next_index == -1:
                    index = float(index + next_index) / 2
                else: index += 1.0
                continue
            
            # Sentence not numbered, generate speech
            generate_speech(sentence, f"{format_number(index)}.mp3")
            
            # Sleep for 3 second to avoid hitting the OpenAI API rate limit
            time.sleep(3)
            
            result_sentences.append(f"[{format_number(index)}]{sentence}")
            
            next_index = find_next_index(i, sentences)
            if not next_index == -1:
                index = (index + next_index) / 2
            else: index += 1.0
        else:
            # Add empty line
            result_sentences.append('')

    # Write the numbered sentences back to the output file
    with open(output_filename, 'w') as file:
        file.write('\n'.join(result_sentences))

if __name__ == "__main__":
    main()