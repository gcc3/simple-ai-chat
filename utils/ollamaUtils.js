// Ping Ollama API to check if it is running
export async function pingOllamaAPI(baseUrl = 'http://localhost:11434') {
  try {
    const response = await fetch(`${baseUrl}`);
    if (!response.ok) return false;
    const text = await response.text();
    return text === 'Ollama is running';
  } catch {
    return false;
  }
}

// List available models
export async function listOllamaModels(baseUrl = 'http://localhost:11434') {
  console.log("Listing models from Ollama API...");
  try {
    const response = await fetch(`${baseUrl}/v1/models`);
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
