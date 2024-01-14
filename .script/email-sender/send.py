import sqlite3
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import os
import sys
import argparse

# Load environment variables
load_dotenv('../../.env')

# AWS credentials
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION')

# Sender email address
SENDER_EMAIL = 'support@simple-ai.io'

# Read email subject and content
with open('content.txt', 'r') as file:
    lines = file.readlines()
    email_subject = lines[0].strip()  # Remove any leading/trailing whitespace
    email_content = ''.join(lines[1:])  # Join the remaining content

# Function to send email using AWS SES
def send_email_ses(recipient_email, subject, body, test_mode=False):
    if test_mode:
        print(f"Test Mode: Email to {recipient_email} would have been sent.")
        return

    client = boto3.client(
        'ses',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    try:
        response = client.send_email(
            Destination={'ToAddresses': [recipient_email]},
            Message={
                'Body': {
                    'Text': {
                        'Charset': 'UTF-8',
                        'Data': body,
                    },
                },
                'Subject': {
                    'Charset': 'UTF-8',
                    'Data': subject,
                },
            },
            Source=SENDER_EMAIL
        )
    except ClientError as e:
        print(f"Error sending email: {e.response['Error']['Message']}")
    else:
        print(f"Email sent! Message ID: {response['MessageId']}")

# Parse command-line arguments
parser = argparse.ArgumentParser(description='Send emails using AWS SES.')
parser.add_argument('--test', action='store_true', help='Run in test mode without sending emails.')
parser.add_argument('--email', type=str, help='Send a single email to the specified address.')
args = parser.parse_args()

# Connect to the SQLite database and read email addresses
conn = sqlite3.connect('../../db.sqlite')
cursor = conn.cursor()

# Query to select all emails except root user
query = """
SELECT email FROM users
WHERE username != 'root' AND email IS NOT NULL
"""

# Execute based on arguments
if args.test:
    # Test mode: print logs without sending
    cursor.execute(query)
    emails = cursor.fetchall()
    for email in emails:
        send_email_ses(email[0], email_subject, email_content, test_mode=True)

elif args.email:
    # Send a single email
    send_email_ses(args.email, email_subject, email_content)

else:
    # Confirm before sending to all users
    print("(Important) This will send emails to all users, Use --test to test first.")
    confirm = input("Are you sure you want to send emails to all users? (yes/no): ")
    if confirm.lower() == 'yes':
        try:
            cursor.execute(query)
            emails = cursor.fetchall()

            # Send an email to each address
            for email in emails:
                send_email_ses(email[0], email_subject, email_content)

        finally:
            conn.close()
    else:
        print("Operation canceled.")

# Close database connection
conn.close()