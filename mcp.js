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
import fs from 'fs';
import cors from 'cors';


async function loadMcpConfig(configPath = "./mcpconfig.json") {
  try {
    // Check if the config file exists
    if (!fs.existsSync(configPath)) {
      // Copy from ./mcpconfig.json.example
      const exampleConfigPath = "./mcpconfig.json.example";
      await fs.promises.copyFile(exampleConfigPath, configPath);
      console.warn(`Config file not found. Copied from ${exampleConfigPath}.`);
    }

    const config = JSON.parse(
      await fs.promises.readFile(configPath, "utf-8"),
    );
    const mcpServerConfigs = config.mcpServers;
    if (!mcpServerConfigs || mcpServerConfigs.length === 0) {
      throw new Error("No MCP servers found.");
    }

    return mcpServerConfigs;
  } catch (e) {
    console.error(`Failed to load MCP config: ${e.message}`);
    throw e;
  }
}


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
app.use(cors());

// Add the logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

// Define root endpoint
app.get('/', (req, res) => {
  res.send('Simple MCP is running.');
});

// Add shutdown endpoint
app.post('/shutdown', async (req, res) => {
  // Disconnect from all servers
  await mcpClient.disconnect();

  res.send('Shutting down MCP server');
  console.log('MCP server shutting down by request');

  // Give time for the response to be sent before shutting down
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// List tools
app.get('/tool/list', (req, res) => {
  res.json(mcpClient.tools);
});

// Servers
app.get('/servers', (req, res) => {
  res.json(Object.fromEntries(mcpClient.servers));
});

// Refresh server list
app.post('/tool/refresh', async (req, res) => {
  try {
    // Disconnect from all servers
    await mcpClient.disconnect();

    // Reload MCP server configuration
    const mcpConfig = await loadMcpConfig();
    for (let s in mcpConfig) {
      await mcpClient.connect(s, mcpConfig[s]);
    }

    res.json(mcpClient.tools);
  } catch (e) {
    console.error("Error refreshing MCP servers: ", e);
    res.status(500).send("Error refreshing MCP servers");
  }
});

// Call tool
app.post('/tool/call', async (req, res) => {
  const { tool, args } = req.body;
  if (!tool || !args) {
    return res.status(400).send("Missing tool name or arguments");
  }

  try {
    const result = await mcpClient.callTool(tool, args);
    res.json(result);
  } catch (e) {
    console.error("Error calling tool: ", e);
    res.status(500).send("Error calling tool");
  }
});

// Start the server
app.listen(port, async () => {
  console.log(`Simple MCP server is running on http://localhost:${port}`);

  // Load MCP server configuration
  const mcpConfig = await loadMcpConfig();

  console.log("\n--- available endpoints ---" + "\n" +
    "GET  /" + "\n" +  
    "GET  /tool/list" + "\n" +
    "POST /tool/call" + "\n" +
    "POST /tool/refresh" + "\n" +
    "GET  /servers" + "\n" +
    "POST /shutdown"
  );

  // Connect to each MCP server
  for (let s in mcpConfig) {
    await mcpClient.connect(s, mcpConfig[s]);
  }

  console.log("\n--- available tools ---");
  if (mcpClient && mcpClient.tools.length > 0) {
    console.log(mcpClient.tools.map((t) => t.name).join("\n") + "\n");
  } else {
    console.log("No available tools.\n");
  }
});
