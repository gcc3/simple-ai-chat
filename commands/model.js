import { initializeSession } from "utils/sessionUtils";

export default async function model(args) {
  const command = args[0];
  const usage = "Usage: :model [name?]\n" +
                "       :model [ls|list]\n" +
                "       :model [use|unuse] [name]\n" +
                "       :model reset\n";

  // Get model info
  // :model [name?]
  if (!command) {
    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

    const modelName = sessionStorage.getItem("model");
    if (!modelName) {
      return "No model is set, please use command \`:model use [name]\` to set a model.";
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

    if (!localStorage.getItem("user")) {
      return "Please login.";
    }

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
        return "No available model found.";
      } else {
        // For adding star to current store
        const currentModel = sessionStorage.getItem("model");

        // User models
        let userModels = "";
        if (data.result.user_models && Object.entries(data.result.user_models).length > 0) {
          let models = [];
          Object.entries(data.result.user_models).forEach(([key, value]) => {
            models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
          });
          userModels = "User models: \n" 
                     + models.join(" ") + "\n\n";
        } else {
          userModels = "User models: \n" 
                     + "No model found." + "\n\n";
        }

        // Group models
        let groupModels = "";
        if (data.result.group_models && Object.entries(data.result.group_models).length > 0) {
          let models = [];
          Object.entries(data.result.group_models).forEach(([key, value]) => {
            models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
          });
          groupModels = "Group models: \n" 
                    + models.join(" ") + "\n\n"; 
        } else {
          groupModels = "Group models: \n" 
                      + "No model found." + "\n\n";
        }

        // System models
        let systemModels = "";
        if (data.result.system_models && Object.entries(data.result.system_models).length > 0) {
          let models = [];
          Object.entries(data.result.system_models).forEach(([key, value]) => {
            models.push((currentModel === value.name ? "*\\" : "\\") + value.name);
          });
          systemModels = "System models: \n" 
                      + models.join(" ") + "\n\n"; 
        } else {
          systemModels = "System models: \n" 
                      + "No model found." + "\n\n";
        }

        return userModels + groupModels + systemModels;
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    return "";
  }

  // Use model
  // :model [use|unuse] [name]
  if (command === "use" || command === "unuse") {
    if (args.length != 2) {
      return "Usage: :model [use|unuse] [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Model name must be quoted with double quotes.";
    }

    const name = args[1].slice(1, -1);
    if (!name) {
      return "Invalid model name.";
    }

    if (args[0] === "use") {
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
        sessionStorage.setItem("model", name);

        // Set local model  
        // If the model base URL containts "localhost" or "127.0.0.1", set it to local model
        if (modelInfo.base_url.includes("localhost") || modelInfo.base_url.includes("127.0.0.1")) {
          sessionStorage.setItem("useLocalModel", true);
        } else {
          sessionStorage.setItem("useLocalModel", false);
        }
      } catch (error) {
        console.error(error);
        return error;
      }

      return "Model is set to \`" + name + "\`. Use command \`:model\` to show current model information.";
    }

    if (args[0] === "unuse") {
      if (sessionStorage.getItem("model") !== name) {
        return "Model `" + name + "` is not being used.";
      }

      // Clear model
      sessionStorage.setItem("model", "");

      return "Model unset.";
    }
  }

  // Reset model
  // :model reset
  if (command === "reset") {
    if (sessionStorage.getItem("model") === "") {
      return "Model is already empty.";
    }

    sessionStorage.setItem("model", "");  // reset model

    // Reset session to forget previous memory
    initializeSession();
    return "Model reset.";
  }

  return usage;
}
