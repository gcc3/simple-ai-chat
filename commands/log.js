export default async function log(args) {
  try {
    const response = await fetch("/api/log/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.result.logs === "") {
      return "No log found.";
    } else {
      return data.result.logs;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
  return "";
}