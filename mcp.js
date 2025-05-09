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
import { mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';


const CONFIG = join(homedir(), '.simple', "mcpconfig.json");

async function loadMcpConfig(configPath = CONFIG) {
  try {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(configPath)) {
      const configDir = join(homedir(), '.simple');
      await mkdir(configDir, { recursive: true });
    }

    // Check if the config file exists
    if (!fs.existsSync(configPath)) {
      // Create a default config file if it doesn't exist
      const defaultConfig = {
        mcpServers: {}
      };
      await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`Default MCP config created at ${configPath}`);
    }

    const config = JSON.parse(
      await fs.promises.readFile(configPath, "utf-8"),
    );
    const mcpServerConfigs = Object.values(config.mcpServers);
    if (!mcpServerConfigs || mcpServerConfigs.length === 0) {
      console.log("No MCP servers found in the config file.");
      return [];
    }

    return config.mcpServers;
  } catch (e) {
    console.error(`Failed to load MCP config: ${e.message}`);
    throw e;
  }
}


const STATUS = {
  DISCONNECTING: -2,
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
}

export class MCPClient {
  constructor() {
    this.servers = new Map();
    this.tools = [];  // global tools list
    this.status = STATUS.DISCONNECTED;
  }

  // Connect to all MCP servers
  async connect(mcpConfigServers) {
    this.status = STATUS.CONNECTING;
    console.log("Connecting to MCP servers...");
    try {
      for (const [serverName, serverConfig] of Object.entries(mcpConfigServers)) {
        process.stdout.write(`Connecting to MCP server: ${serverName}...`);

        const client = new Client({ name: serverName, version: "0.0.1" });
        const transport = new StdioClientTransport({
          command: serverConfig.command,
          args: serverConfig.args,
        });

        await client.connect(transport);

        // List tools
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
        
        process.stdout.write(" connected.\n");
      }
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      this.disconnect();
      throw e;
    }

    this.status = STATUS.CONNECTED;
    console.log("MCP servers are connected.");
  }

  // Refresh tools
  async refreshTools() {
    let newTools = [];
    for (let [, s] of this.servers) {
      const toolsResult = await s.client.listTools();
      const tools = toolsResult.tools.map((tool) => {
        // Tools listing result parameter mapping
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema, // !important
        };
      });
      newTools = [...newTools, ...tools];
    }

    // Compare tool names, if diff then refresh
    const oldToolNames = this.tools.map((t) => t.name);
    const newToolNames = newTools.map((t) => t.name);
    if (oldToolNames.length !== newToolNames.length 
    || !oldToolNames.every((name) => newToolNames.includes(name))
    || !newToolNames.every((name) => oldToolNames.includes(name))) {
      console.log("Tools change detected, refreshing...");
      this.tools = newTools;
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
    this.status = STATUS.DISCONNECTING;
    for (let [, s] of this.servers) {
      await s.client.close();
      await s.transport.close();
    }
    this.servers.clear();
    this.tools = [];
    this.status = STATUS.DISCONNECTED;
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
    await mcpClient.refreshTools();
    res.json(mcpClient.tools);
  } catch (e) {
    console.error("Error refreshing MCP servers: ", e);
    res.status(500).send("Error refreshing MCP servers");
  }
});

// Call tool
app.post('/tool/call', async (req, res) => {
  const timestamp = Date.now();

  const { tool, args } = req.body;
  console.log(`REQ (${timestamp}): ${JSON.stringify(req.body)}`);
  if (!tool || !args) {
    return res.status(400).send("Missing tool name or arguments");
  }

  try {
    const result = await mcpClient.callTool(tool, args);
    console.log(`RES (${timestamp}): ${JSON.stringify(result)}`);

    res.json(result);
  } catch (e) {
    console.error("Error calling tool: ", e);
    res.status(500).send("Error calling tool");
  }
});

// Start the server
app.listen(port, async () => {
  console.log(`Simple MCP server is running on http://localhost:${port}`);

  console.log("\n--- available endpoints ---" + "\n" +
    "GET  /" + "\n" +  
    "GET  /tool/list" + "\n" +
    "POST /tool/call" + "\n" +
    "POST /tool/refresh" + "\n" +
    "GET  /servers" + "\n" +
    "POST /shutdown" + "\n"
  );

  await connectMCP();
  
  // Set up a file watcher for the CONFIG file with debouncing
  let reconnectTimeout = null;
  fs.watch(CONFIG, { persistent: true }, async (eventType) => {
    if (eventType === 'change') {
      // Clear any existing timeout to debounce multiple events
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      // Set a new timeout (300ms debounce time)
      reconnectTimeout = setTimeout(async () => {
        console.log(`CONFIG file changed. Reconnecting to MCP servers...`);
        await connectMCP();
        reconnectTimeout = null;
      }, 300);
    }
  });
});

export async function connectMCP() {
  try {
    // Disconnect from all servers
    await mcpClient.disconnect();

    // Load MCP server configuration
    const mcpConfigServers = await loadMcpConfig(CONFIG);
    const timeout = 10;
    if (mcpClient.status === STATUS.DISCONNECTED) {

      // Connect to all MCP servers
      await mcpClient.connect(mcpConfigServers);

      // Wait for connection to be established
      while (mcpClient.status === STATUS.CONNECTING) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        timeout--;
        if (timeout <= 0) {
          console.log("Timeout connecting to MCP servers.");
          break;
        }
      }
    }

    console.log("\n--- available tools ---");
    if (mcpClient && mcpClient.tools.length > 0) {
      console.log(mcpClient.tools.map((t) => t.name).join("\n") + "\n");
    } else {
      console.log("No available tools.\n");
    }
  } catch (e) {
    console.error("Error connecting to MCP servers: ", e);
  }
}