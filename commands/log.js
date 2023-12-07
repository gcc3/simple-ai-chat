export default async function log(args) {
  try {
    const response = await fetch("/api/log/list?query_id=" + localStorage.getItem("queryId"), {
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
      // Add new line for each log
      const logs = data.result.logs;
      return logs;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
  return "";
}
