import os
import glob
import json
import PyPDF2
import docx
import mysql.connector
from openai import OpenAI
from dotenv import load_dotenv

# Load the OpenAI API key from the .env file two levels up
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=dotenv_path)
api_key = os.getenv("OPENAI_API_KEY")

# Load the MySQL connection details
load_dotenv()
mysql_host = os.getenv("MYSQL_HOST")
mysql_port = os.getenv("MYSQL_PORT")
mysql_user = os.getenv("MYSQL_USER")
mysql_password = os.getenv("MYSQL_PASSWORD")
mysql_database = os.getenv("MYSQL_DATABASE")
mysql_table = os.getenv("MYSQL_TABLE")
mysql_config = {
    "host": mysql_host,
    "port": mysql_port,
    "user": mysql_user,
    "password": mysql_password,
    "database": mysql_database,
}

# Initialize the OpenAI client
openai = OpenAI(api_key=api_key)


def read_prompt_file(file_path):
    with open(file_path, "r") as file:
        prompt = file.read()
    return prompt


def extract_text_from_pdf(pdf_path):
    text_content = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfFileReader(file)
        for page in range(reader.numPages):
            text_content += reader.getPage(page).extractText()
    return text_content


def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    text_content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text_content


# Function to extract text using OpenAI API
def extract(prompt, text):
    completion = openai.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": prompt,  # this should also provide the json fromat
            },
            {
                "role": "user",
                "content": text,
            },
        ],
        temperature=0,
        model="gpt-4-1106-preview",
        response_format={"type": "json_object"},
    )
    # Extract the translated text from the generated JSON format
    extracted_json = json.loads(completion.choices[0].message.content)
    return extracted_json


def insert_data_to_mysql(file_name, data, mysql_config):
    db_connection = mysql.connector.connect(**mysql_config)
    cursor = db_connection.cursor()

    # Prepare the columns and values for the insert statement
    columns = "file_name, " + ", ".join(data.keys())
    values = (file_name,) + tuple(data.values())
    placeholders = ", ".join(["%s"] * (len(data) + 1))

    # Construct the insert query using the columns and placeholders
    insert_query = f"INSERT INTO {mysql_table} ({columns}) VALUES ({placeholders})"

    # Execute the query and commit the changes
    cursor.execute(insert_query, values)
    db_connection.commit()

    # Close the cursor and the connection
    cursor.close()
    db_connection.close()


def process_document(file_path, mysql_config):
    # Determine the file type and extract text
    if file_path.endswith(".pdf"):
        file_content = extract_text_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        file_content = extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file type")

    # Read the prompt from the prompt.txt file
    prompt = read_prompt_file("prompt.txt")

    # Use OpenAI to extract data
    extracted_data_json = extract(prompt, file_content)

    # Get file name
    file_name = os.path.basename(file_path)

    # Insert extracted data into MySQL database
    insert_data_to_mysql(file_name, extracted_data_json, mysql_config)


# Create a list of all PDF and DOCX files in the specified directory
pdf_files = glob.glob(os.path.join(".", "*.pdf"))
docx_files = glob.glob(os.path.join(".", "*.docx"))
all_files = pdf_files + docx_files

for file_path in all_files:
    print(f"Processing file: {file_path}")
    process_document(file_path, mysql_config)
