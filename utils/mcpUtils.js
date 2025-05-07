let mcpProcess = null;


// Pings the MCP server to check if it's running
export async function pingMcpServer(baseUrl = 'http://localhost:11318') {
  try {
    // set up timeout
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
    return text === 'Simple MCP is running.';
  } catch {
    return false;
  }
}

// List functions
export async function listMcpFunctions(baseUrl = 'http://localhost:11318') {
  try {
    // set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);
    const response = await fetch(`${baseUrl}/tool/list`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to list MCP functions:', error.message);
    return null;
  }
}

// Call MCP tool
export async function callMcpTool(tool, args, baseUrl = 'http://localhost:11318') {
  try {
    // set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    const response = await fetch(`${baseUrl}/tool/call`, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args })
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Error calling tool: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to call MCP tool:', error.message);
    return null;
  }
}

// Stops the running MCP server by sending a shutdown request
export async function stopMcpServer(baseUrl = 'http://localhost:11318') {
  try {
    // set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);

    await fetch(`${baseUrl}/shutdown`, {
      signal: controller.signal,
      method: 'POST'
    });

    clearTimeout(timeoutId);

    // Stop the MCP process if it's running
    if (mcpProcess) {
      mcpProcess.kill('SIGINT'); // Send SIGINT signal to the process
      mcpProcess = null; // Clear the reference to the process
    }
  } catch (error) {
    console.error('Failed to stop MCP server:', error.message);
  }
}
