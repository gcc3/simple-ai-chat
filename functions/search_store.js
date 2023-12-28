export default async function searchStore(paramObject) {
  const { store, query } = paramObject;

  try {
    const response = await fetch("/api/store/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        store,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      return {
        success: true,
        message: data.message,
      }
    } else {
      return {
        success: false,
        message: data.error,
      }
    }
  } catch (error) {
    console.error(error);
    return error;
  }
}
