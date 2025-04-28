# Read all user's username and password from `users` table in sqlite database `../../db.sqlite`.
# For each user:
#   Get user info with username and password from API `/api/user/info`
#   Get total_usage_fees_this_month from user info API response
#   Get the user's balance from `users` table.
#   Update user's balance = balance - total_usage_fees_this_month
#   Update user's usage = usage + total_usage_fees_this_month

import sqlite3
import requests
from dotenv import load_dotenv
import os
from time import sleep, time
import urllib.parse
from datetime import datetime

# Load .env file from the specified path
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path)

# Constants
DATABASE_PATH = "../../db.sqlite"
BASE_URL = os.getenv(
    "NEXT_PUBLIC_BASE_URL", "https://simple-ai.io"
)  # Default to a base URL if not found


def npre(num, precision=5):
    if num is not None and isinstance(num, (int, float)):
        return round(num, precision)
    return 0


def get_all_user_credentials():
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Read all usernames and passwords from the `users` table
    cursor.execute("SELECT username, password FROM users")
    credentials_list = cursor.fetchall()
    cursor.close()
    conn.close()

    return credentials_list


def get_user_info(username, password):
    # URL encode the password
    encoded_password = urllib.parse.quote(password)

    # Make an API request to get user info
    api_endpoint = f"{BASE_URL}/api/user/info"
    response = requests.get(
        f"{api_endpoint}?username={username}&password={encoded_password}"
    )
    user_info = response.json().get("user", {})
    return user_info


def update_user_data(username, total_usage_fees_this_month):
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Get the user's balance and usage from the `users` table
    cursor.execute("SELECT balance, usage FROM users WHERE username = ?", (username,))
    balance, usage = cursor.fetchone()

    # Calculate the updated balance and usage
    new_balance = max(npre(balance - total_usage_fees_this_month), 0)
    new_usage = npre(usage + total_usage_fees_this_month)
    log = f"Updating user {username}, balance = {balance} -> {new_balance}, usage = {usage} -> {new_usage}, fee = {total_usage_fees_this_month}"
    print(log)

    # Output to log file
    with open("log.txt", "a") as f:
        f.write(log + "\n")

    # Update the user's balance and usage in the `users` table
    cursor.execute(
        "UPDATE users SET balance = ?, usage = ? WHERE username = ?",
        (new_balance, new_usage, username),
    )
    conn.commit()
    cursor.close()
    conn.close()


def main():
    # Print a timestamp to the log file
    with open("log.txt", "a") as f:
        f.write("\n" + "=" * 40 + "\n")
        f.write("Starting process\n")
        f.write("=" * 40 + "\n")
        f.write("\n")
        f.write("Timestamp: " + str(int(time())) + "\n")
        current_time = datetime.utcnow()
        timestamp_str = current_time.strftime("Timestamp: %Y-%m-%d %H:%M:%S\n")
        f.write("Timestamp Human Readable: " + timestamp_str + "\n")

    # Get credentials for all users from the database
    users_credentials = get_all_user_credentials()

    # Process each user
    users_total_usage = 0
    for username, password in users_credentials:

        # Get user info from the API
        user_info = get_user_info(username, password)

        # Get total_usage_fees_this_month from the user info
        usage_user_this_month = user_info["usage"]["total_usage_fees_this_month"]

        # Update user's balance and usage in the database
        update_user_data(username, usage_user_this_month)
        users_total_usage += usage_user_this_month
        sleep(1)

    # Print users_total_usage to the log file
    with open("log.txt", "a") as f:
        f.write("\n")
        f.write("Total usage fees this month: " + str(users_total_usage) + "\n")
        f.write("\n")
    print("Done")


if __name__ == "__main__":
    main()
