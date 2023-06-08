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

  return "Error.";
}
