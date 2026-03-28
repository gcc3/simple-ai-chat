#!/bin/bash

# Bump the version, publish to npm, and update the global package
npm version patch
npm publish
echo "About 3 minutes later, run \`npm update simple-ai-chat -g\` to update the global package to the latest version."
