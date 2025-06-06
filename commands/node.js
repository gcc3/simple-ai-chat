import { initializeSessionMemory } from "../utils/sessionUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function node(args) {
  const command = args[0];
  const usage = "Usage: :node [name?]\n" +
                "       :node [ls|list]\n" +
                "       :node [use|unuse] [name]\n" +
                "       :node reset\n" +
                "       :node add [name]\n" +
                "       :node [del|delete] [name]\n" +
                "       :node set owner [owner]\n" +
                "       :node set [key] [value]\n";

  // Get node info
  // :node [name?]
  if (!command) {
    if (!getSetting("user")) {
      return "Please login.";
    }

    const nodeName = getSetting("node");
    if (!nodeName) {
      return "No node is set, please use command \`:node use [name]\` to set a node.";
    }

    try {
      const response = await fetch("/api/node/" + nodeName, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Node info
      const nodeInfo = data.result;
      if (!nodeInfo) {
        return "Node not found.";
      }

      return JSON.stringify(nodeInfo, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Get node info by name
  // :node [name?]
  if (args.length === 1 && args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const nodeName = args[0].slice(1, -1);
    if (!nodeName) {
      return "Invalid node name.";
    }

    try {
      const response = await fetch("/api/node/" + nodeName, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Node info
      const nodeInfo = data.result;
      if (!nodeInfo) {
        return "Node not found.";
      }

      return JSON.stringify(nodeInfo, null, 2);
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // List available nodes
  if (command === "ls" || command === "list") {
    if (args.length !== 1) {
      return "Usage: :node [ls|list]\n";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    try {
      const response = await fetch("/api/node/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (Object.entries(data.result.user_nodes).length === 0 
       && Object.entries(data.result.group_nodes).length === 0 
       && Object.entries(data.result.system_nodes).length === 0) {
        return "No available node found.";
      } else {
        // For adding star to current store
        const currentNode = getSetting("node");

        // User nodes
        let userNodes = "";
        if (data.result.user_nodes && Object.entries(data.result.user_nodes).length > 0) {
          let nodes = [];
          Object.entries(data.result.user_nodes).forEach(([key, value]) => {
            nodes.push((currentNode === value.name ? "*\\" : "\\") + value.name);
          });
          userNodes = "User nodes: \n" 
                     + nodes.join(" ") + "\n\n";
        }

        // Group nodes
        let groupNodes = "";
        if (data.result.group_nodes && Object.entries(data.result.group_nodes).length > 0) {
          let nodes = [];
          Object.entries(data.result.group_nodes).forEach(([key, value]) => {
            nodes.push((currentNode === value.name ? "*\\" : "\\") + value.name);
          });
          groupNodes = "Group nodes: \n" 
                    + nodes.join(" ") + "\n\n"; 
        }

        // System nodes
        let systemNodes = "";
        if (data.result.system_nodes && Object.entries(data.result.system_nodes).length > 0) {
          let nodes = [];
          Object.entries(data.result.system_nodes).forEach(([key, value]) => {
            nodes.push((currentNode === value.name ? "*\\" : "\\") + value.name);
          });
          systemNodes = "System nodes: \n" 
                      + nodes.join(" ") + "\n\n"; 
        }

        if (userNodes === "" && groupNodes === "" && systemNodes === "") {
          return "No available node found.";
        }

        return userNodes + groupNodes + systemNodes;
      }
    } catch (error) {
      console.error(error);
    }
    return "";
  }

  // Use node
  if (command === "use" || command === "unuse") {
    if (args.length != 2) {
      return "Usage: :node [use|unuse] [name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Node name must be quoted with double quotes.";
    }

    const nodeName = args[1].slice(1, -1);
    if (!nodeName) {
      return "Invalid node name.";
    }

    if (args[0] === "use") {
      // Check if the node exists
      try {
        const response = await fetch("/api/node/" + nodeName, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        // Node info
        const nodeInfo = data.result;
        if (!nodeInfo) {
          return "Node not found.";
        }
        
        // Set node
        setSetting("node", nodeName);

        if (!nodeInfo) {
          return "Node not found.";
        }
      } catch (error) {
        console.error(error);
        return error;
      }

      return "Node is set to \`" + nodeName + "\`, you can directly talk, or use command \`:generate [input]\` to generate from it. Command \`:node\` shows current node information.";
    }

    if (args[0] === "unuse") {
      if (getSetting("node") !== nodeName) {
        return "Node `" + nodeName + "` is not being used.";
      }

      // Clear node
      setSetting("node", "");

      return "Node unset.";
    }
  }

  // Reset node
  if (command === "reset") {
    if (getSetting("node") === "") {
      return "Node is already empty.";
    }

    setSetting("node", "");  // reset node

    // Reset session to forget previous memory
    initializeSessionMemory();
    return "Node reset, and session reset.";
  }

  // Add a node
  if (command === "add") {
    if (args.length !== 2) {
      return "Usage: :node add [name]\n";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Node name must be quoted with double quotes.";
    }

    const name = args[1].slice(1, -1);

    try {
      const response = await fetch("/api/node/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        setSetting("node", name);  // set active
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Delete a node
  if (command === "del" || command === "delete") {
    if (args.length !== 2) {
      return "Usage: :node [del|delete] [name]\n";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Node name must be quoted with double quotes.";
    }

    const name = args[1].slice(1, -1);
    if (!name) {
      return "Invalid node name.";
    }

    try {
      const response = await fetch("/api/node/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        if (getSetting("node") === name) {
          setSetting("node", "");
        }
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Change node owner
  if (command === "set" && args[1] === "owner") {
    if (args.length !== 3) {
      return "Usage: :node set owner [owner]\n";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    const nodeName = getSetting("node");
    if (!nodeName) {
      return "No node is set, please use command \`:node use [name]\` to set a node.";
    }

    const owner = args[2];
    if (!owner) {
      return "Invalid owner.";
    }

    try {
      const response = await fetch("/api/node/update/" + nodeName + "/owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        return data.message;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Set settings
  if (command === "set" && args[1]) {
    if (args.length != 3) {
      return "Usage: :user set [key] [value]";
    }
    
    if (!getSetting("user")) {
      return "Please login.";
    }

    const nodeName = getSetting("node");
    if (!nodeName) {
      return "No node is set, please use command \`:node use [name]\` to set a node.";
    }

    // Check value must be quoted with double quotes.
    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Setting value must be quoted with double quotes.";
    }
    const key = args[1];
    const value = args[2].slice(1, -1);

    try {
      const response = await fetch("/api/node/update/" + nodeName + "/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          value,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.message;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  return usage;
}
