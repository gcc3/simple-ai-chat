// Import child_process module at the top level using ESM syntax
import { spawn } from 'child_process';
import fs from 'fs';


let mcpProcess = null;


// Pings the MCP server to check if it's running
export async function pingMcpServer() {
  try {
    const response = await fetch('http://localhost:11318/');
    const text = await response.text();
    return text === 'Simple MCP is alive.';
  } catch (error) {
    console.error('Failed to ping MCP server:', error.message);
    return false;
  }
}

// Stops the running MCP server by sending a shutdown request
export async function stopMcpServer() {
  try {
    await fetch('http://localhost:11318/shutdown', {
      method: 'POST'
    });

    // Stop the MCP process if it's running
    if (mcpProcess) {
      mcpProcess.kill('SIGINT'); // Send SIGINT signal to the process
      mcpProcess = null; // Clear the reference to the process
    }

    console.log('MCP server shutdown requested');
  } catch (error) {
    console.error('Failed to stop MCP server:', error.message);
  }
}

// Starts a local MCP server
export function startMcpServer() {
  try {
    // Start the MCP server using child_process.spawn
    mcpProcess = spawn('node', ['./mcp.js'], {
      detached: true,
      stdio: 'ignore',
    });

    // Detach the child process from the parent process
    mcpProcess.unref();

    console.log("Started local MCP server on port 11318");
    return mcpProcess;
  } catch (error) {
    console.error("Failed to start local MCP server:", error.message);
    return null;
  }
}


export async function loadMcpConfig(configPath = "./mcpconfig.json") {
  try {
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