#!/bin/bash

# Copy .example files to their non-.example counterparts if they don't already exist
for f in $(find . -maxdepth 1 -name "*.example"); do
  dest="${f%.example}"
  if [ ! -f "$dest" ]; then
    cp "$f" "$dest" && echo "Copied: $f -> $dest"
  else
    echo "Skipped (exists): $dest"
  fi
done

echo "Installing npm dependencies..."
npm install
