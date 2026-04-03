#!/bin/bash

set -e

if ! command -v pm2 >/dev/null 2>&1; then
	echo "pm2 is not installed. Install it with: npm install -g pm2"
	exit 1
fi

echo "Stopping server..."
if pm2 stop ecosystem.config.cjs; then
	echo "Server stopped."
fi
