export async function getSystemInfo() {
  // Default system info
  let systemInfo = {
    model: "",
    base_url: "",
    role_content_system: "***",
    welcome_message: "",
    temperature: 1,
    top_p: 1,
    use_node_ai: false,
    use_payment: false,
    use_email: false,
    minimalist: false,
    default_functions: "",
    default_role: "",
    default_stores: "",
    default_node: "",
  }

  try {
    console.log("Fetching system information...");
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

    systemInfo = data.result;
  } catch (error) {
    console.error(error);
  }

  return systemInfo;
}
