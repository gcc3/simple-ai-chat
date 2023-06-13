export default async function log(args) {
  let url = "/api/log/list";
  if (args.length > 0) {
    const queryId = args[0];
    url = "/api/log/list?query_id=" + queryId;
  } else {
    url = "/api/log/list?query_id=" + localStorage.getItem("queryId");
  }

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
