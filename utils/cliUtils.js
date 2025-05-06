export function isNode() {
  let isNode =
    typeof window === 'undefined' ||
    typeof localStorage === 'undefined' ||
    typeof sessionStorage === 'undefined';

  return isNode;
}

// Tests the connection to the Simple AI server
export async function testSimpleAIServerConnection() {
  try {
    // Ping the server
    const pingResponse = await fetch('/api/ping');
    const responseText = await pingResponse.text();
    if (responseText !== "Simple AI is alive.") {
      console.log("Ping response: " + responseText);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error during server ping:", error.message);
    return false;
  }
}
