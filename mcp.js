#!/usr/bin/env node

/**
 * Simple MCP (Model Context Protocol) Server
 * This server runs on port 11318 and provides a basic endpoint
 * that confirms the server is operational.
 */

import express from 'express';

// Create Express application
const app = express();
const port = 11318;

// Configure middleware
app.use(express.json());

// Define root endpoint
app.get('/', (req, res) => {
  res.send('Simple MCP is alive.');
});

// Add shutdown endpoint
app.post('/shutdown', (req, res) => {
  res.send('Shutting down MCP server');
  console.log('MCP server shutting down by request');
  
  // Give time for the response to be sent before shutting down
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// Start the server
app.listen(port, () => {
  console.log(`Simple MCP server is running on http://localhost:${port}`);
});
