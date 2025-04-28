#!/usr/bin/env python3
import os
import re
import csv

# Configure paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
COMPONENTS_DIR = os.path.join(PROJECT_ROOT, "components")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "keys.csv")

# Regex to match t("...") or tt("...") capturing function name
pattern = re.compile(r'\b(t{1,2})\s*\(\s*"([^\"]+)"\s*\)')

# Mapping for component filenames to desired CSV key prefixes
mapping = {
    "documentation": "documentation",
    "settings": "settings",
    "subscription": "subscriptions",
    "subscriptioncomparisontable": "subscriptions",
    "usage": "usage",
    "userdataprivacy": "privacy_policy",
}


def scan_files():
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        seen = set()
        # Walk through components directory
        for root, _, files in os.walk(COMPONENTS_DIR):
            for filename in files:
                if filename.endswith((".js", ".jsx")):
                    filepath = os.path.join(root, filename)
                    # derive base and apply custom mapping
                    base = os.path.splitext(filename)[0].lower()
                    base = mapping.get(base, base)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            content = f.read()
                    except Exception:
                        continue

                    # Find all matches
                    for func, match in pattern.findall(content):
                        # override base for tt() calls
                        entry_base = "translation" if func == "tt" else base
                        if (entry_base, match) not in seen:
                            seen.add((entry_base, match))
                            writer.writerow([entry_base, match])

    print(f"Extraction complete. Keys saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    scan_files()
