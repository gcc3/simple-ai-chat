import { pingOllamaAPI, listOllamaModels } from './ollamaUtils.js';
import { getSetting, setSetting } from './settingsUtils.js';

const tryFetchModel = async (model) => {
  console.log("Fetching model: " + model.model);
  try {
    const res = await (await fetch('/api/model/' + model.model)).json();
    if (res.success && res.result) {
      const resolvedModel = res.result;
      console.log("Model found in remote.");
      globalThis.source = "remote";
      return resolvedModel;
    }
  } catch (e) {
    console.warn("Remote model lookup failed:", e);
  }
  console.warn("Model `" + model.model + "` not accessible in remote.");
  return null;
}

const tryGetModel = async (model) => {
  console.log("Getting model: " + model.model);
  if (!await pingOllamaAPI()) {
    console.warn("Ollama API not accessible.");
    return null;
  }
  const ollamaModels = await listOllamaModels();
  const ollamaModel = ollamaModels.find(o => o.name === model.model);
  if (ollamaModel) {
    console.log("Model found in Ollama.");
    setSetting("baseUrl", ollamaModel.base_url);
    const resolvedModel = { ...model, base_url: ollamaModel.base_url };
    globalThis.source = "local";
    return resolvedModel;
  }
  console.warn("Model `" + model.model + "` not accessible in local.");
  return null;
}

export const getModel = async () => {
  const model = {
    model: getSetting("model"),
    base_url: getSetting("baseUrl"),
    is_tool_calls_supported: "0",
    is_vision: "0",
    is_audio: "0",
    is_reasoning: "0",
    is_image: "0"
  };
  for (const resolveModel of globalThis.source === "remote"
    ? [tryFetchModel, tryGetModel]
    : [tryGetModel, tryFetchModel]) {
    const resolvedModel = await resolveModel(model);
    if (resolvedModel) {
      console.log(JSON.stringify(model, null, 2));
      console.log("Set source: " + globalThis.source);
      return resolvedModel;
    }
  }
  setSetting("baseUrl", "");
  globalThis.source = "remote";
  console.error("Failed to fetch model.");
  console.log("Set source: " + globalThis.source);
  return model;
}
