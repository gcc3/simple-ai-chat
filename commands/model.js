import { listOllamaModels, pingOllamaAPI } from "../utils/ollamaUtils.js";
import { initializeSessionMemory } from "../utils/sessionUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function model(args) {
  const command = args[0];
  const usage = "Usage: :model [name?]\n" +
                "       :model [ls|list]\n" +
                "       :model [use|unuse] [name]\n" +
                "       :model reset\n";

  // Get model info without name (will use current model as name)
  // :model [name?]
  if (!command) {
    if (!getSetting("user")) {
      return "Please login.";
    }

    const modelName = getSetting("model");
    if (!modelName) {
      return "No model is set, please use command \`:model use [name]\` to set a model.";
    }

    // Check local Ollama models
    if (await pingOllamaAPI()) {
      const ollamaModelList = await listOllamaModels();
      const ollamaModelInfo = ollamaModelList.find((m) => m.name === modelName);
      if (ollamaModelInfo) {
        return JSON.stringify(ollamaModelInfo, null, 2);
      }
    }

    try {
      const response = await fetch("/api/model/" + modelName, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Model info
      const modelInfo = data.result;
      if (!modelInfo) {
        return "Model not found.";
      }

      return JSON.stringify(modelInfo, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Get model info by name
  // :model [name?]
  if (args.length === 1 && args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const modelName = args[0].slice(1, -1);
    if (!modelName) {
      return "Invalid model name.";
    }

    // Check local Ollama models
    if (await pingOllamaAPI()) {
      const ollamaModelList = await listOllamaModels();
      const ollamaModelInfo = ollamaModelList.find((m) => m.name === modelName);
      if (ollamaModelInfo) {
        return JSON.stringify(ollamaModelInfo, null, 2);
      }
    }

    try {
      const response = await fetch("/api/model/" + modelName, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Model info
      const modelInfo = data.result;
      if (!modelInfo) {
        return "Model not found.";
      }

      return JSON.stringify(modelInfo, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // List available models
  // :model [ls|list]
  if (command === "ls" || command === "list") {
    if (args.length !== 1) {
      return "Usage: :model [ls|list]\n";
    }

    // For adding star to current store
    const currentModel = getSetting("model");

    let userModels = "";
    let groupModels = "";
    let systemModels = "";
    let ollamaModels = "";

    if (navigator.onLine) {
      try {
        const response = await fetch("/api/model/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        if (Object.entries(data.result.user_models).length === 0 
        && Object.entries(data.result.group_models).length === 0 
        && Object.entries(data.result.system_models).length === 0) {
          // Do nothing
        } else {
          // User models
          if (data.result.user_models && Object.entries(data.result.user_models).length > 0) {
            let models = [];
            Object.entries(data.result.user_models).forEach(([key, value]) => {
              models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
            });
            userModels = "User models:\n" 
                      + models.join(" ") + "\n\n";
          }

          // Group models
          if (data.result.group_models && Object.entries(data.result.group_models).length > 0) {
            let models = [];
            Object.entries(data.result.group_models).forEach(([key, value]) => {
              models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
            });
            groupModels = "Group models:\n" 
                      + models.join(" ") + "\n\n"; 
          }

          // System models
          if (data.result.system_models && Object.entries(data.result.system_models).length > 0) {
            let models = [];
            Object.entries(data.result.system_models).forEach(([key, value]) => {
              models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
            });
            systemModels = "System models:\n" 
                        + models.join(" ") + "\n\n"; 
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    // Ollama models (local models)
    if (await pingOllamaAPI()) {
      const ollamaModelList = await listOllamaModels();
      if (ollamaModelList && ollamaModelList.length > 0) {
        let models = [];
        ollamaModelList.forEach((model) => {
          models.push((currentModel === model.name ? "*\\" : "\\") + model.name);
        });
        ollamaModels = "Ollama models:\n" 
                    + models.join(" ") + "\n\n"; 
      }
    }

    if (userModels === "" && groupModels === "" && systemModels === "" && ollamaModels === "") {
      return "No available model found.";
    }

    return userModels + groupModels + systemModels + ollamaModels;
  }

  // Use model
  // :model [use|unuse] [name]
  if (command === "use" || command === "unuse") {
    if (args.length != 2) {
      return "Usage: :model [use|unuse] [name]\n"
    }

    const name = args[1].replace(/"/g, "");
    if (!name) {
      return "Invalid model name.";
    }

    if (args[0] === "use") {
      // Check local Ollama models
      if (await pingOllamaAPI()) {
        const ollamModels = await listOllamaModels();
        const ollamModelInfo = ollamModels.find((m) => m.name === name);
        if (ollamModelInfo) {
          // Set model to session storage
          globalThis.model = name;
          globalThis.baseUrl = ollamModelInfo.base_url;
          setSetting("model", name);
          setSetting("baseUrl", ollamModelInfo.base_url);

          return "Model is set to \`" + name + "\`. Use command \`:model\` to show current model information.";
        }
      }

      // Check remote models
      // Check if the model exists
      try {
        const response = await fetch("/api/model/" + name, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        // Model info
        const modelInfo = data.result;
        if (!modelInfo) {
          return "Model not found.";
        }
        
        // Set model
        globalThis.model = modelInfo.model;
        globalThis.baseUrl = modelInfo.base_url;
        setSetting("model", modelInfo.model);
        setSetting("baseUrl", modelInfo.base_url);
      } catch (error) {
        console.error(error);
        return error;
      }

      return "Model is set to \`" + name + "\`. Use command \`:model\` to show current model information.";
    }

    if (args[0] === "unuse") {
      if (getSetting("model") !== name) {
        return "Model `" + name + "` is not being used.";
      }

      setSetting("model", globalThis.model);  // reset model
      setSetting("baseUrl", globalThis.baseUrl);  // reset base url

      return "Model unused, and reset to default model.";
    }
  }

  // Reset model
  // :model reset
  if (command === "reset") {
    if (getSetting("model") === "") {
      return "Model is already empty.";
    }

    setSetting("model", globalThis.model);  // reset model
    setSetting("baseUrl", globalThis.baseUrl);  // reset base url

    // Reset session to forget previous memory
    initializeSessionMemory();
    return "Model reset to default model, and session reset.";
  }

  return usage;
}
