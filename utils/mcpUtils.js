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

// List functions
export async function listMcpFunctions() {
  try {
    const response = await fetch('http://localhost:11318/tools');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to list MCP functions:', error.message);
    return null;
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
  } catch (error) {
    console.error('Failed to stop MCP server:', error.message);
  }
}
