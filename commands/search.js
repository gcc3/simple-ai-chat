export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [text]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Search text must be quoted with double quotes.";
  }
  const searchFor = args[0].slice(1, -1);

  return "Feature under development.";
}
