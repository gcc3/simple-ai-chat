/**
 * Utility functions for working with the Model Context Protocol (MCP) server
 */

/**
 * Pings the MCP server to check if it's running
 * @returns {Promise<boolean>} True if the server is running, false otherwise
 */
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

/**
 * Stops the running MCP server by sending a shutdown request
 */
export function stopMcpServer() {
  try {
    fetch('http://localhost:11318/shutdown', {
      method: 'POST'
    }).then(() => {
      console.log('MCP server shutdown requested');
      console.error('Error shutting down MCP server:', error.message);
    });
  } catch (error) {
    console.error('Failed to stop MCP server:', error.message);
  }
}

/**
 * Starts a local MCP server
 */
export function startMcpServer() {
  try {
    const { spawn } = require('child_process');
    const mcpProcess = spawn('node', ['./mcp.js'], {
      detached: true,
      stdio: 'ignore'
    });
    mcpProcess.unref();
    console.log("Started local MCP server on port 11318");
    return true;
  } catch (error) {
    console.error("Failed to start local MCP server:", error.message);
    return false;
  }
}