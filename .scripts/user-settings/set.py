#!/usr/bin/env python3
import sys
import json
import sqlite3
from pathlib import Path

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <key> <value>")
        sys.exit(1)

    key = sys.argv[1]
    raw_value = sys.argv[2]

    # attempt to parse the value as JSON, fall back to string
    try:
        value = json.loads(raw_value)
    except json.JSONDecodeError:
        value = raw_value

    # locate the SQLite database two levels up
    db_path = Path(__file__).resolve().parents[2] / "db.sqlite"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    # fetch all users' settings
    cur.execute("SELECT id, settings FROM users")
    rows = cur.fetchall()

    for user_id, settings_str in rows:
        # load existing settings or start with empty dict
        try:
            settings = json.loads(settings_str or "{}")
        except json.JSONDecodeError:
            settings = {}

        # update/add the key
        settings[key] = value

        # write back
        new_settings = json.dumps(settings)
        cur.execute(
            "UPDATE users SET settings = ? WHERE id = ?",
            (new_settings, user_id)
        )

    conn.commit()
    conn.close()
    print(f"Updated settings for {len(rows)} users.")

if __name__ == '__main__':
    main()