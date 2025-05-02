// Ping Ollama API to check if it is running
export async function pingOllamaAPI(baseUrl = 'http://localhost:11434') {
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
    return text === 'Ollama is running';
  } catch {
    return false;
  }
}

// List available models
export async function listOllamaModels(baseUrl = 'http://localhost:11434') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);
    const response = await fetch(`${baseUrl}/v1/models`, { 
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return [];
    const data = await response.json();
    const models = data.data.map(model => model.id);

    // Trim the model id if it is ends with ":latest"
    const trimmedModels = models.map(model => model.endsWith(':latest') ? model.slice(0, -7) : model);
    
    // Use format { id: 1, name: "llama3", base_url: "http://localhost:11434/v1", price_input: 0, price_output: 0 }
    const formattedModels = trimmedModels.map((model, index) => {
      return {
        id: index + 1,
        name: model,
        base_url: `${baseUrl}/v1`,
        price_input: 0,
        price_output: 0
      };
    });
    return formattedModels;
  } catch (error) { 
    console.error("Error fetching models from Ollama API:", error);
    return [];
  }
}

// Check model is running for given model name
export async function isModelRunning(modelName, baseUrl = 'http://localhost:11434') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);
    const response = await fetch(`${baseUrl}/api/ps`, { 
      signal: controller.signal
    });
    clearTimeout(timeoutId);

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
