import sqlite3
import requests
import time
from dotenv import load_dotenv
import os

# Load the environment variables from the .env file
load_dotenv("../../.env")

# Retrieve the IPINFO_TOKEN
IPINFO_TOKEN = os.getenv("IPINFO_TOKEN")


# Function to get user location from IP address with ipinfo.io
def get_ip_info(ip):
    try:
        response = requests.get(f"https://ipinfo.io/{ip}/json?token={IPINFO_TOKEN}")
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        print(f"Error getting IP info: {e}")
        return None


# Function to read users from SQLite database and analyze their countries
def analyze_user_countries(database_path, output_file):
    # Connect to the SQLite database
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    # Query to select user and IP address from the users table
    cursor.execute("SELECT username, ip_addr FROM users")
    users = cursor.fetchall()

    # Close the database connection
    conn.close()

    # Dictionary to hold country count
    country_count = {}

    # Open the output file for writing
    with open(output_file, "w") as file:
        file.write("user, ip, country\n")

        # Iterate over the users and get their country
        for user, ip in users:
            ip_info = get_ip_info(ip)
            if ip_info and "country" in ip_info:
                country = ip_info["country"]
            else:
                country = "Unknown"

            # Write to file
            file.write(f"{user}, {ip}, {country}\n")

            # Update country count
            country_count[country] = country_count.get(country, 0) + 1

            # Print progress
            print(f"Processed {user}")

            # Sleep for 1 second to comply with API requirement
            time.sleep(1)

        # Analyze user's countries
        file.write("\nCountry Analysis:\n")
        for country, count in country_count.items():
            file.write(f"{country}: {count}\n")


# Path of the SQLite database file
database_path = "../../db.sqlite"

# Path of the output file
output_file = "user_ip_countries.txt"

# Analyze user countries and output to file
analyze_user_countries(database_path, output_file)
