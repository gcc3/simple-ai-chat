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

      // Format the timestamp
      const logs = data.result.logs.split("\n");
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const timestamp = log.substring(log.search("T=") + 2, log.search("T=") + 15);
        const date = new Date(parseInt(timestamp));
        logs[i] = date.toLocaleString() + " \n" + log.substring(16);
      }

      return logs;
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
  return "";
}
