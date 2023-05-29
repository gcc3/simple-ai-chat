export default async function entry(args) {
  try {
    const response = await fetch("/api/entry/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.result.entries.length === 0) {
      return "No entry found.";
    } else {
      return data.result.entries.join(" ");
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }

  return "Error.";
}
