export default async function entry(args) {
  try {
    let response;
    if (localStorage.getItem("user") === "root") {
      response = await fetch("/api/session/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else if (localStorage.getItem("user")) {
      response = await fetch("/api/session/list/" + localStorage.getItem("user"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      return "Login required.";
    }

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.result.sessions === "") {
      return "No session found.";
    } else {
      // Add new line for each log
      const sessions = data.result.sessions;
      return sessions;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  return "Error.";
}
