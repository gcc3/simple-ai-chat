import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='../../.env')
BEARER_TOKEN = os.getenv('OPENAI_API_KEY')

# Function to call OpenAI API and generate speech from text
def generate_speech(input_text, filename):
    headers = {
        'Authorization': f'Bearer {BEARER_TOKEN}',
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

def main():
    input_filename = 'content.txt'
    output_filename = 'content.txt'
    
    # Check if input file exists
    if not os.path.exists(input_filename):
        print(f"Input file '{input_filename}' not found")
        return
    
    # Read sentences from the input file
    with open(input_filename, 'r') as file:
        sentences = file.read().strip().split('\n')

    # Generate speech for each sentence and write back to the file with numbering
    numbered_sentences = []
    for index, sentence in enumerate(sentences, start=1):
        if sentence:
            # Generate speech and save as MP3 file
            mp3_filename = f"{index}.mp3"
            generate_speech(sentence, mp3_filename)
            
            # Append numbering to the sentence
            numbered_sentences.append(f"[{index}]{sentence}")

    # Write the numbered sentences back to the output file
    with open(output_filename, 'w') as file:
        file.write('\n'.join(numbered_sentences))

if __name__ == "__main__":
    main()