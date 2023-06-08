export default async function role(args) {
  const command = args[0];

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
        return data.result.roles.join(" ");
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    return "";
  }

  if (command === "use") {
    if (args.length != 2) {
      return "Usage: :role [role_name]\n"
    }

    const roleName = args[1];
    if (roleName != null) {
      localStorage.setItem("role", roleName);
      return "Role set to " + roleName + ".";
    } else {
      return "Invalid role name.";
    }
  }

  return "Error.";
}
