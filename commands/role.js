import { initializeMemory } from "utils/sessionUtils";

export default async function role(args) {
  const command = args[0];

  // Get role prompt
  if (!command) {
    const role = sessionStorage.getItem("role");
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
      alert(error.message);
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
      alert(error.message);
    }
  }

  // Reset role
  if (command === "reset") {
    if (sessionStorage.getItem("role") === "") {
      return "Role is already empty.";
    }

    sessionStorage.setItem("role", "");  // reset role

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
        if (localStorage.getItem("user")) {
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
                          + "\\" + roles.join(" \\") + "\n\n"; 

        // Add star to current role
        let result = userRoles + systemRoles;
        if (sessionStorage.getItem("role")) {
          const currentStore = sessionStorage.getItem("role");
          result = result.replace("\\" + currentStore, "*\\" + currentStore);
        }
        return result;
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
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
      alert(error.message);
    }

    if (roleName != null) {
      sessionStorage.setItem("role", roleName);

      // Reset session to forget previous memory
      initializeMemory();

      return "Role is set to \`" + roleName + "\`, you can use command \`:role\` to show current role and prompt. Memory is reset.";
    } else {
      return "Invalid role name.";
    }
  }

  return "Usage: :role\n" + 
         "       :role [ls|list]\n" +
         "       :role reset\n" +
         "       :role use [role_name]\n";
}
