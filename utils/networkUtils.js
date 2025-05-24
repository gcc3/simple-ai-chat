export async function isInternetAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout

    const response = await fetch('https://simple-ai.io/favicon.ico', {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}
