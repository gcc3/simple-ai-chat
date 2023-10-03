export default async function entry(args) {
  const command = args[0];

  if (command === "login") {
    if (args.length != 2) {
      return "Usage: :user login [username]";
    }

    localStorage.setItem("user", args[1]);
    return "Login successful."
  }

  if (command === "add") {
    if (args.length != 2) {
      return "Usage: :user add [username]";
    }

    try {
      const response = await fetch('/api/user/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: args[1],
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Added."
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  if (command === "set" && args[1] === "pass") {
    if (args.length != 3) {
      return "Usage: :user set pass [password]";
    }

    try {
      const response = await fetch('/api/user/update/pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
          password: args[2],
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Password updated."
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  if (command === "set" && args[1] !== "pass") {
    if (args.length != 3) {
      return "Usage: :user set [key] [value]";
    }

    try {
      const response = await fetch('/api/user/update/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: localStorage.getItem("user"),
          key: args[1],
          value: args[2],
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return "Setting updated."
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return "Usage: :user add [username]" + "\n" +
         "       :user set pass [password]" + "\n" +
         "       :user set theme [light/dark]" + "\n" +
         "       :user set role [role]" + "\n" +
         "       :user login [username]";
}