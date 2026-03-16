#!/bin/bash

# Bump the version, publish to npm, and update the global package
npm version patch
npm publish
npm update simple-ai-chat -g
