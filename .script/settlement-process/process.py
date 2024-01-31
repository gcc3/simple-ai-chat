# Read user's username and password from `users` table in sqlite database `../../db.sqlite`.
# Get user info with username and password from API `/api/user/info`
# Get total_usage_fees_this_month from user info API response
# Get the user's balance from `users` table.
# Update user's balance = balance - total_usage_fees_this_month
# Update user's usage = usage + total_usage_fees_this_month

import sqlite3
import requests
from dotenv import load_dotenv
import os

# Load .env file from the specified path
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path)

# Constants
DATABASE_PATH = '../../db.sqlite'
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://simple-ai.io')  # Default to a base URL if not found

def get_user_credentials():
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Read username and password from the `users` table
    cursor.execute("SELECT username, password FROM users")
    credentials = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return credentials

def get_user_info(username, password):
    # Make an API request to get user info
    api_endpoint = f"{BASE_URL}/api/user/info"
    response = requests.get(f"{api_endpoint}?username={username}&password={password}")
    user_info = response.json().get('user', {})
    return user_info

def update_user_data(user_info):
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    total_usage_fees_this_month = user_info['usage']['total_usage_fees_this_month']
    balance = user_info['balance']
    usage = user_info['usage']['use_count_monthly']['this_month']
    
    # Calculate the updated balance and usage
    new_balance = balance - total_usage_fees_this_month
    new_usage = usage + total_usage_fees_this_month
    
    # Update the user's balance and usage in the `users` table
    cursor.execute("UPDATE users SET balance = ?, usage = ? WHERE username = ?",
                   (new_balance, new_usage, user_info['username']))
    conn.commit()
    cursor.close()
    conn.close()

def main():
    # Step 1: Get credentials from the database
    username, password = get_user_credentials()
    
    # Step 2: Get user info from the API
    user_info = get_user_info(username, password)
    
    # Step 3 and 4 are handled within the get_user_info function
    
    # Step 5 and 6: Update user's balance and usage in the database
    update_user_data(user_info)

if __name__ == "__main__":
    main()