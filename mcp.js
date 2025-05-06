#!/usr/bin/env node

/**
 * Simple MCP (Model Context Protocol) Server
 * This server runs on port 11318 and provides a basic endpoint
 * that confirms the server is operational.
 */

import express from 'express';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { loadMcpConfig } from './utils/mcpUtils.js';


export class MCPClient {
  constructor() {
    this.servers = new Map();
    this.tools = [];  // global tools list
  }

  // Connect to MCP server
  async connect(serverName, mcpServerConfig) {
    try {
      const client = new Client({ name: serverName, version: "0.0.1" });
      const transport = new StdioClientTransport({
        command: mcpServerConfig.command,
        args: mcpServerConfig.args,
      });

      await client.connect(transport);
      const toolsResult = await client.listTools();
      const tools = toolsResult.tools.map((tool) => {
        // Tools listing result parameter mapping
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema, // !important
        };
      });

      // Store server
      this.servers.set(serverName, {
        client: client,
        transport: transport,
        tools: tools,
      });

      // Store tool in global tools list
      this.tools = [...this.tools, ...tools];
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  // Call tool
  async callTool(toolName, toolArgs) {
    // Find server, and use the correct one to call the tool
    let callServer = null;
    for (let [, s] of this.servers) {
      if (s.tools.some((t) => t.name === toolName)) {
        callServer = s;
        break;
      }
    }

    if (!callServer) {
      throw new Error(`Server not found for tool: ${toolName}`);
    }
    
    const result = await callServer.client.callTool({
      name: toolName,
      arguments: toolArgs,
    });
    return result;
  }

  async disconnect() {
    for (let [, s] of this.servers) {
      await s.client.close();
      await s.transport.close();
    }
    this.servers.clear();
    this.tools = [];
  }
}

// Initialize MCP client
const mcpClient = new MCPClient();

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

// List tools
app.get('/tools', (req, res) => {
  res.json(mcpClient.tools);
});

// Start the server
app.listen(port, async () => {
  console.log(`Simple MCP server is running on http://localhost:${port}`);

  // Load MCP server configuration
  const mcpConfig = await loadMcpConfig();

  // Connect to each MCP server
  for (let s in mcpConfig) {
    await mcpClient.connect(s, mcpConfig[s]);
  }
});
