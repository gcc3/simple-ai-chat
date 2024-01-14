export default async function invite(args) {
  if (args.length != 1) {
    return "Usage: :invite [email]";
  }

  if (!localStorage.getItem("user")) {
    return "Please login.";
  }

  const email = args[0];
  try {
    const response = await fetch(`/api/invite/` + email, {
      method: "GET",
      credentials: 'include',
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      return data.message;
    }
  } catch (error) {
    // Send invitation failed
    console.error(error);
    return error;
  }
}
