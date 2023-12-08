export default async function role(args) {
  const command = args[0];

  // Get role prompt
  if (!command) {
    const role = localStorage.getItem("role");
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

  if (command === "reset") {
    if (localStorage.getItem("role") === "") {
      return "Role is already empty.";
    }

    localStorage.setItem("role", "");  // reset role

    // Reset query id to forget previous memory
    localStorage.setItem("time", Date.now());
    localStorage.setItem("queryId", Date.now());
    
    return "Role reset.";
  }

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

      if (data.result.roles.length === 0 && (!data.result.user_roles || Object.entries(data.result.user_roles).length === 0)) {
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

        const defaultRoles = "Default roles: \n" 
                     + "\\" + data.result.roles.join(" \\");

        return userRoles + defaultRoles;
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    return "";
  }

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

      if (!data.result.roles.includes(roleName) 
      && (!data.result.user_roles || !Object.entries(data.result.user_roles).some(([key, value]) => value.role === roleName))) {
        return "Role \"" + roleName + "\" does not exist.";
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    if (roleName != null) {
      localStorage.setItem("role", roleName);

      // Reset query id to forget previous memory
      localStorage.setItem("time", Date.now());
      localStorage.setItem("queryId", Date.now());

      return "Role is set to \`" + roleName + "\`, you can use command \`:role\` to show current role and prompt";
    } else {
      return "Invalid role name.";
    }
  }

  return "Usage: :role\n" + 
         "       :role [ls|list]]\n" +
         "       :role [reset]]\n" +
         "       :role use [role_name]\n";
}
