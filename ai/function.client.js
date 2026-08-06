export async function exec_f(input) {
  const response = await fetch("/api/function/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      functions: input.substring(1).split(",!")
    }),
  });

  const data = await response.json();
  if (response.status !== 200) {
    throw data.error || new Error(`Request failed with status ${response.status}`);
  }

  if (!data.success) {
    throw new Error(data.error);
  }
  return data.function_results;
}

export function exec_fe(event) {
  console.log("Function Event: " + JSON.stringify(event));

  // Handle redirect event
  if (event.name === "redirect") {
    console.log("Redirecting to \"" + event.parameters.url + "\"...");

    // Redirect to URL
    if (!event.parameters.url.startsWith("http")) {
      console.error("URL must start with http or https.");
    } else {
      if (event.parameters.blank == true) {
        window.open(event.parameters.url, '_blank');  // open with new tab
      } else {
        window.top.location.href = event.parameters.url;
      }
    }
  }
}
