import { listOllamaModels, pingOllamaAPI } from "../utils/ollamaUtils.js";
import { initializeSessionMemory } from "../utils/sessionUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";

export default async function model(args) {
  const command = args[0];
  const usage = "Usage: :model [name?]\n" +
                "       :model [ls|list]\n" +
                "       :model [use|unuse] [name]\n" +
                "       :model reset\n";

  // Get model without name (will use current model as name)
  // :model [name?]
  if (!command) {
    const modelName = getSetting("model");
    if (!modelName) {
      return "No model is set, please use command \`:model use [name]\` to set a model.";
    }

    // Check local Ollama models
    if (await pingOllamaAPI()) {
      const ollamaModelList = await listOllamaModels();
      const ollamaModel = ollamaModelList.find((m) => m.name === modelName);
      if (ollamaModel) {
        return JSON.stringify(ollamaModel, null, 2);
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

      const model = data.result;
      if (!model) {
        return "Model not found.";
      }

      return JSON.stringify(model, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Get model by name
  // :model [name?]
  if (args.length === 1 && args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const name = args[0].slice(1, -1);
    if (!name) {
      return "Invalid model name.";
    }

    // Check local Ollama models
    if (await pingOllamaAPI()) {
      const ollamaModelList = await listOllamaModels();
      const ollamaModel = ollamaModelList.find((m) => m.name === name);
      if (ollamaModel) {
        return JSON.stringify(ollamaModel, null, 2);
      }
    }

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

      const model = data.result;
      if (!model) {
        return "Model not found.";
      }

      return JSON.stringify(model, null, 2);
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
    let systemModels_ = "";
    let ollamaModels_ = "";

    if (globalThis.isOnline) {
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

        let models = data.result;
        if (Object.entries(models).length === 0) {
          // Do nothing
        } else {
          // Models
          if (models && Object.entries(models).length > 0) {
            let systemModels = [];
            Object.entries(models).forEach(([key, value]) => {
              systemModels.push((currentModel === value.name ? "*\\" : "\\") + value.name);
            });
            systemModels_ = "System models:\n" 
                        + systemModels.join(" ") + "\n\n"; 
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
        let ollamaModels = [];
        ollamaModelList.forEach((model) => {
          ollamaModels.push((currentModel === model.name ? "*\\" : "\\") + model.name);
        });
        ollamaModels_ = "Ollama models:\n" 
                    + ollamaModels.join(" ") + "\n\n"; 
      }
    }

    if (systemModels_ === "" && ollamaModels_ === "") {
      return "No available model found.";
    }

    return (systemModels_ + ollamaModels_).trim();
  }

  // Use model
  // :model [use|unuse] [name]
  if (command === "use" || command === "unuse") {
    if (args.length != 2) {
      return "Usage: :model [use|unuse] [name]\n"
    }

    const modelName = args[1].replace(/"/g, "");
    if (!modelName) {
      return "Invalid model name.";
    }

    if (args[0] === "use") {
      // Check local Ollama models
      if (await pingOllamaAPI()) {
        const ollamModels = await listOllamaModels();
        const ollamModel = ollamModels.find((m) => m.name === modelName);
        if (ollamModel) {
          // Set model to session storage
          setSetting("model", modelName);
          setSetting("baseUrl", ollamModel.base_url);

          return "Model is set to \`" + modelName + "\`. Use command \`:model\` to show current model information.";
        }
      }

      // Check remote models
      // Check if the model exists
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

        const model = data.result;
        if (!model) {
          return "Model not found.";
        }
        
        // Set model
        setSetting("model", model.name);
        setSetting("baseUrl", model.base_url);
      } catch (error) {
        console.error(error);
        return error;
      }

      return "Model is set to \`" + modelName + "\`. Use command \`:model\` to show current model information.";
    }

    if (args[0] === "unuse") {
      if (getSetting("model") !== modelName) {
        return "Model `" + modelName + "` is not being used.";
      }

      setSetting("model", globalThis.model);  // reset to default model
      setSetting("baseUrl", globalThis.baseUrl);  // reset to default base url
      return "Model unused, and reset to default model.";
    }
  }

  // Reset model
  // :model reset
  if (command === "reset") {
    setSetting("model", globalThis.model);  // reset to default model
    setSetting("baseUrl", "");  // reset to default base url

    // Reset session to forget previous memory
    initializeSessionMemory();
    return "Model reset.";
  }

  return usage;
}
