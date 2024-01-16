export default async function system(args) {
  const response = await fetch("/api/system/info", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (response.status !== 200) {
    throw data.error || new Error(`Request failed with status ${response.status}`);
  }

  const system = JSON.stringify(data.result, null, 2);
  return system;
}
