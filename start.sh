#!/bin/bash

set -e

# Load PORT from .env, default to 3000
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d '=' -f2)
PORT=${PORT:-3000}

if ! command -v pm2 >/dev/null 2>&1; then
	echo "pm2 is not installed. Install it with: npm install -g pm2"
	exit 1
fi

if pm2 start ecosystem.config.cjs; then
	echo "Server started with pm2 at http://localhost:$PORT"
fi
