#!/bin/bash

set -e

# source:destination
readonly EXAMPLE_FILES=(
  ".env.example:.env"
  "log.config.example:log.config"
  "role.csv.example:role.csv"
  "mcpconfig.json.docker.example:mcpconfig.json"
)

# Copy .example files to their non-.example counterparts if they don't already exist
for entry in "${EXAMPLE_FILES[@]}"; do
  src="${entry%%:*}"
  dest="${entry##*:}"
  if [ ! -f "$dest" ]; then
    cp "$src" "$dest" && echo "Copied: $src -> $dest"
  else
    echo "Skipped (exists): $dest"
  fi
done

echo "Pulling latest code..."
git pull

echo "Installing dependencies with pnpm..."
corepack enable
pnpm install --frozen-lockfile

echo "Cloning docs repository..."
if [ ! -d "docs" ]; then
  git clone https://github.com/gcc3/content-hub docs
else
  echo "Skipped (exists): docs"
fi
if [ ! -f "docs/public/notes/note.sh" ]; then
  rm -rf docs/public/notes
  git clone https://github.com/gcc3/simple-ai-docs docs/public/notes
else
  echo "Skipped (exists): docs/public/notes"
fi
