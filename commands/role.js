export default async function role(args) {
  const command = args[0];

  // Get role prompt
  if (!command) {
    const role = localStorage.getItem("role");
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

      if (data.result.roles.length === 0) {
        return "No role found.";
      } else {
        return "Default roles: \n" + "\\" + data.result.roles.join(" \\");
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

      if (!data.result.roles.includes(roleName)) {
        return "Role \"" + roleName + "\" does not exist.";
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    if (roleName != null) {
      localStorage.setItem("role", roleName);

      // Reset query id to forget previous memory
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
