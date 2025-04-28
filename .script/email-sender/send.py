import sqlite3
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os
import sys
import argparse
from datetime import datetime
from time import sleep

# Load environment variables
load_dotenv("../../.env")

# AWS credentials
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")

# Sender email address
SENDER = "Simple AI <support@simple-ai.io>"

# Log file path, set to None to disable Logging
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOG_FILE = timestamp + ".log"


def logadd(log):
    print(log)
    if LOG_FILE:
        with open(LOG_FILE, "a") as file:
            file.write(log + "\n")


# Read email subject and content
with open("content.txt", "r") as file:
    lines = file.readlines()
    email_subject = lines[0].strip()  # Remove any leading/trailing whitespace
    email_base_content = "".join(lines[1:])  # Join the remaining content
    logadd(f"Email subject: {email_subject}")
    logadd(f"Email base content:\n{email_base_content}")


def encode_timestamp(timestamp, shift):
    # Convert the timestamp to a string to work with individual characters
    timestamp_str = str(timestamp)
    encoded = ""

    # Loop through each character in the string
    for char in timestamp_str:
        # Convert the current character to a number
        digit = int(char)

        # Apply the cipher shift
        shifted_digit = (digit + shift) % 10

        # Concatenate the shifted digit to the encoded string
        encoded += str(shifted_digit)

    return encoded


def get_email_content(user, email_base_content):
    content = email_base_content

    if "{username}" in content:
        username = user[1]
        content = content.replace("{username}", username)
        logadd(f"{{username}}: {username}")

    if "{invite_code}" in content:
        invite_code = encode_timestamp(user[14], 3)
        content = content.replace("{invite_code}", invite_code)
        logadd(f"{{invite_code}}: {invite_code}")

    return content


# Function to send email using AWS SES
def send_email_ses(recipient_email, subject, body, test_mode=False):
    if test_mode:
        logadd(f"Test Mode: email to `{recipient_email}` would have been sent.")
        return

    client = boto3.client(
        "ses",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )

    try:
        response = client.send_email(
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Body": {
                    "Text": {
                        "Charset": "UTF-8",
                        "Data": body,
                    },
                },
                "Subject": {
                    "Charset": "UTF-8",
                    "Data": subject,
                },
            },
            Source=SENDER,
        )
    except ClientError as e:
        logadd(f"Error sending email: {e.response['Error']['Message']}")
    else:
        logadd(f"Email sent! Message ID: {response['MessageId']}")


# Parse command-line arguments
parser = argparse.ArgumentParser(description="Send emails using AWS SES.")
parser.add_argument(
    "--test", action="store_true", help="Run in test mode without sending emails."
)
parser.add_argument(
    "--email", type=str, help="Send a single email to the specified address."
)
args = parser.parse_args()

# Connect to the SQLite database and read email addresses
conn = sqlite3.connect("../../db.sqlite")
cursor = conn.cursor()

# Query to select all emails except root user
query = """
SELECT * FROM users
WHERE username != 'root' AND email IS NOT NULL
"""

# Execute based on arguments
if args.test:
    counter = 0

    # Test mode: print logs without sending
    cursor.execute(query)
    users = cursor.fetchall()

    logadd("Start sending emails...")
    for user in users:
        logadd(f"-\nSending email to user: {user[1]}...")

        # email address
        email = user[6]
        logadd(f"Email address: {email}")

        # content
        logadd(f"Preparing email content...")
        content = get_email_content(user, email_base_content)

        # send email
        send_email_ses(email, email_subject, content, test_mode=True)
        counter += 1

    logadd(f"-\nTotal: {counter} emails. (not sent)")

elif args.email:
    # Send a single email
    # Get user
    cursor.execute("SELECT * FROM users WHERE email=?", (args.email,))
    user = cursor.fetchone()

    # content
    content = get_email_content(user, email_base_content)
    send_email_ses(args.email, email_subject, content)

else:
    # Confirm before sending to all users
    print("(Important) This will send emails to all users, Use --test to test first.")
    confirm = input("Are you sure you want to send emails to all users? (yes/no): ")
    if confirm.lower() == "yes":
        counter = 0
        try:
            cursor.execute(query)
            users = cursor.fetchall()

            # Send an email to each address
            logadd("Start sending emails...")
            for user in users:
                logadd(f"-\nSending email to user: {user[1]}...")

                # email address
                email = user[6]
                logadd(f"Email address: {email}")

                # content
                logadd(f"Preparing email content...")
                content = get_email_content(user, email_base_content)

                # send email
                send_email_ses(email, email_subject, content, test_mode=False)
                counter += 1
                sleep(1)  # Sleep for 1 second to avoid throttling

        finally:
            logadd(f"-\nTotal: {counter} emails. (sent)")
            conn.close()
    else:
        print("Operation canceled.")

# Close database connection
conn.close()
