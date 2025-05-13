import { initializeMemory } from "../utils/sessionUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


export default async function role(args) {
  const command = args[0];
  const usage = "Usage: :role\n" + 
         "       :role [ls|list]\n" +
         "       :role reset\n" +
         "       :role use [role_name]\n" +
         "       :role [add|set] [role_name] [prompt]" + "\n" +
         "       :role [del|delete] [role_name]" + "\n"
  
  // Get role prompt
  if (!command) {
    const role = getSetting("role");
    if (role === "") {
      return "No role is set. Use command \`:role use [role_name]\` to set a role.";
    }

    try {
      const response = await fetch("/api/role/" + role, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Role: " + role 
         + "\nPrompt: " + data.result.prompt;
    } catch (error) {
      console.error(error);
    }
  }

  // Get role prompt by role name
  if (args[0].startsWith("\"") && args[0].endsWith("\"")) {
    const role = args[0].slice(1, -1);
    if (role === "") {
      return "Role name cannot be empty.";
    }

    try {
      const response = await fetch("/api/role/" + role, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Role: " + role 
         + "\nPrompt: " + data.result.prompt;
    } catch (error) {
      console.error(error);
    }
  }

  // Reset role
  if (command === "reset") {
    if (getSetting("role") === "") {
      return "Role is already empty.";
    }

    setSetting("role", "");  // reset role

    // Reset session to forget previous memory
    initializeMemory();
    return "Role reset with memory.";
  }

  // List available roles
  if (command === "ls" || command === "list") {
    try {
      const response = await fetch("/api/role/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.result.system_roles.length === 0 && (!data.result.user_roles || Object.entries(data.result.user_roles).length === 0)) {
        return "No role found.";
      } else {
        let userRoles = "";
        if (getSetting("user")) {
          if (data.result.user_roles && Object.entries(data.result.user_roles).length > 0) {
            let roles = [];
            Object.entries(data.result.user_roles).forEach(([key, value]) => {
              roles.push(value.role);
            });
            userRoles = "User roles: \n" 
                + "\\" + roles.join(" \\") + "\n\n"; 
          } else {
            userRoles = "User roles: \n" 
                      + "No user role found." + "\n\n";
          }
        }

        let roles = [];
        Object.entries(data.result.system_roles).forEach(([key, value]) => {
          roles.push(value.role);
        });
        const systemRoles = "System roles: \n"
                          + "\\" + roles.join(" \\") + " \n\n"; 

        // Add star to current role
        let result = userRoles + systemRoles;
        if (getSetting("role")) {
          const currentRole = getSetting("role");
          result = result.replace("\\" + currentRole + " ", "*\\" + currentRole + " ");
        }
        return result;
      }
    } catch (error) {
      console.error(error);
    }
    return "";
  }

  // Use role
  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :role use [role_name]\n"
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Role name must be quoted with double quotes.";
    }

    const roleName = args[1].slice(1, -1);

    // Check role exists
    try {
      const response = await fetch("/api/role/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (!data.result.system_roles.some((role) => role.role === roleName)
      && (!data.result.user_roles || !Object.entries(data.result.user_roles).some(([key, value]) => value.role === roleName))) {
        return "Role \"" + roleName + "\" does not exist.";
      }
    } catch (error) {
      console.error(error);
    }

    if (roleName != null) {
      setSetting("role", roleName);

      // Reset session to forget previous memory
      initializeMemory();

      return "Role is set to \`" + roleName + "\`, you can use command \`:role\` to show current role and prompt. Memory is reset.";
    } else {
      return "Invalid role name.";
    }
  }
  
  // Add a custom roleplay role
  if (command === "add") {
    if (args.length != 3) {
      return "Usage: :role add [role_name] [prompt]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Role name must be quoted with double quotes.";
    }

    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Prompt must be quoted with double quotes.";
    }

    const roleName = args[1].slice(1, -1);
    const prompt = args[2].slice(1, -1);

    try {
      const response = await fetch("/api/role/add", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName,
          prompt,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      if (data.success) {
        setSetting("role", roleName);  // set active
        return data.message;
      } else {
        return data.error;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Delete a custom roleplay role
  if (command === "delete" || command === "del") {
    if (args.length != 2) {
      return "Usage: :role [del|delete] [role_name]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Role name must be quoted with double quotes.";
    }

    const roleName = args[1].slice(1, -1);

    try {
      const response = await fetch("/api/role/delete", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName,
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

  // Add a custom roleplay role
  if (command === "set") {
    if (args.length != 3) {
      return "Usage: :role set [role_name] [prompt]";
    }

    if (!getSetting("user")) {
      return "Please login.";
    }

    if (!args[1].startsWith("\"") || !args[1].endsWith("\"")) {
      return "Role name must be quoted with double quotes.";
    }

    if (!args[2].startsWith("\"") || !args[2].endsWith("\"")) {
      return "Prompt must be quoted with double quotes.";
    }
    
    const roleName = args[1].slice(1, -1);
    const prompt = args[2].slice(1, -1);

    try {
      const response = await fetch("/api/role/update", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName,
          prompt,
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
