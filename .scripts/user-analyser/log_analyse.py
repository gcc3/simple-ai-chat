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
    cursor.execute("SELECT DISTINCT ip_addr FROM logs")
    ip_addrs = cursor.fetchall()

    # Close the database connection
    conn.close()

    # Dictionary to hold country count
    country_count = {}

    # Open the output file for writing
    with open(output_file, "w") as file:
        file.write("ip, country\n")

        # Iterate over the IP addresses and get their country
        for (ip,) in ip_addrs:  # Unpack the tuple to get the string IP address
            ip_info = get_ip_info(ip)
            if ip_info and "country" in ip_info:
                country = ip_info["country"]
            else:
                country = "Unknown"

            # Write to file
            file.write(
                f"{ip}, {country}\n"
            )  # Write the string IP address, not the tuple

            # Update country count
            country_count[country] = country_count.get(country, 0) + 1

            # Print progress
            print(f"Processed {ip}")  # Print the string IP address

            # Sleep for 1 second to comply with API requirement
            time.sleep(1)

        # Analyze user's countries
        file.write("\nCountry Analysis:\n")
        for country, count in country_count.items():
            file.write(f"{country}: {count}\n")


# Path of the SQLite database file
database_path = "../../db.sqlite"

# Path of the output file
output_file = "log_ip_countries.txt"

# Analyze user countries and output to file
analyze_user_countries(database_path, output_file)
