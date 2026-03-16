// Ping Ollama API to check if it is running
export async function pingOllamaAPI(baseUrl = globalThis.ollamaBaseUrl) {
  try {
    // set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
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
    return text === 'Ollama is running';
  } catch {
    return false;
  }
}

// List available models
export async function listOllamaModels(baseUrl = globalThis.ollamaBaseUrl) {
  try {
    const response = await fetch(`${baseUrl}/v1/models`);
    if (!response.ok) return [];
    const data = await response.json();
    const models = data.data.map(model => model.id);

    // Trim the model id if it is ends with ":latest"
    const trimmedModels = models.map(model => model.endsWith(':latest') ? model.slice(0, -7) : model);
    
    // Use format { id: 1, name: "llama3", base_url: "http://localhost:11434/v1", price_input: 0, price_output: 0 }
    const formattedModels = trimmedModels.map((modelName, index) => {
      return {
        name: modelName,
        base_url: `${baseUrl}/v1`,
        price_input: 0,
        price_output: 0,
        is_tool_calls_supported: 0,
        is_vision: 0,
        is_audio: 0,
        is_reasoning: 0,
        is_image: 0,
      };
    });
    return formattedModels;
  } catch (error) { 
    console.error("Error fetching models from Ollama API:", error);
    return [];
  }
}

// Get model info by name
export async function getOllamaModel(modelName, baseUrl = globalThis.ollamaBaseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, verbose: false }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    const capabilities = data.capabilities;
    return {
      name: modelName,
      base_url: `${baseUrl}/v1`,
      price_input: 0,
      price_output: 0,
      is_tool_calls_supported: capabilities.includes('tools') ? 1 : 0,
      is_vision: capabilities.includes('vision') ? 1 : 0,
      is_audio: 0,
      is_reasoning: capabilities.includes('thinking') ? 1 : 0,
      is_image: 0,
    };
  } catch (error) {
    console.error("Error fetching model info from Ollama API:", error);
    return null;
  }
}

// Check model is running for given model name
export async function isModelRunning(modelName, baseUrl = globalThis.ollamaBaseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/ps`);

    if (!response.ok) return false;
    const data = await response.json();
    
    const psModels = data.models || [];
    return psModels.some(m => {
      const id = m.model || m.name;
      const trimmed = id.endsWith(':latest') ? id.slice(0, -7) : id;
      return trimmed === modelName;
    });
  } catch (error) {
    return false;
  }
}
