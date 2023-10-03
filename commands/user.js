export default async function entry(args) {
  const command = args[0];

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

  return "Usage: :user add [username]" + "\n" +
         "       :user set pass [password]" + "\n";
}