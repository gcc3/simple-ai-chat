import { pingOllamaAPI, listOllamaModels } from './ollamaUtils.js';
import { setSetting } from './settingsUtils.js';

const tryFetchModel = async (modelName) => {
  console.log("Fetching model: " + modelName);
  try {
    const res = await (await fetch('/api/model/' + modelName)).json();
    if (res.success && res.result) {
      const resolvedModel = res.result;
      console.log("Model found in remote.");
      globalThis.source = "remote";
      return resolvedModel;
    }
  } catch (e) {
    console.warn("Remote model lookup failed:", e);
  }
  console.warn("Model `" + modelName + "` not accessible in remote.");
  return null;
}

const tryGetModel = async (modelName) => {
  console.log("Getting model: " + modelName);
  if (!await pingOllamaAPI()) {
    console.warn("Ollama API not accessible.");
    return null;
  }
  const ollamaModels = await listOllamaModels();
  const ollamaModel = ollamaModels.find(o => o.name === modelName);
  if (ollamaModel) {
    console.log("Model found in Ollama.");
    setSetting("baseUrl", ollamaModel.base_url);
    const resolvedModel = { ...ollamaModel, base_url: ollamaModel.base_url };
    globalThis.source = "local";
    return resolvedModel;
  }
  console.warn("Model `" + modelName + "` not accessible in local.");
  return null;
}

export const getModel = async (modelName) => {
  // Try to resolve model from remote or local based on source priority
  for (const resolveModel of globalThis.source === "remote"
    ? [tryFetchModel, tryGetModel]
    : [tryGetModel, tryFetchModel]) {
    const resolvedModel = await resolveModel(modelName);
    if (resolvedModel) {
      console.log(JSON.stringify(resolvedModel, null, 2));
      console.log("Set source: " + globalThis.source);
      return resolvedModel;
    }
  }

  console.error("Failed to fetch model.");
  setSetting("baseUrl", "");
  globalThis.source = "remote";
  console.log("Set source: " + globalThis.source);
  return {
    name: modelName,
    base_url: "",
    is_tool_calls_supported: "0",
    is_vision: "0",
    is_audio: "0",
    is_reasoning: "0",
    is_image: "0"
  };
}
