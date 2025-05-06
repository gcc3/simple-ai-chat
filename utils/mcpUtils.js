let mcpProcess = null;


// Pings the MCP server to check if it's running
export async function pingMcpServer(baseUrl = 'http://localhost:11318') {
  try {
    // set up timeout for 100ms
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);
    const response = await fetch(`${baseUrl}`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'text/plain' }
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return false;
    }
    const text = await response.text();
    return text === 'Simple MCP is alive.';
  } catch {
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
