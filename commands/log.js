export default async function log(args) {
  const queryId = args[0];

  const url = queryId ? "/api/log/list?query_id=" + queryId : "/api/log/list";
  console.log("URL: " + url);
  try {
    const response = await fetch(url, {
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
      const logs = data.result.logs.replaceAll("\n", "\n\n");
      return logs;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
  return "";
}
