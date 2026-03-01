export default async function search(args) {
  if (args.length != 1) {
    return "Usage: :search [text]";
  }

  if (!args[0].startsWith("\"") || !args[0].endsWith("\"")) {
    return "Search text must be quoted with double quotes.";
  }
  const searchFor = args[0].slice(1, -1);

  if (searchFor.trim().length === 0) {
    return "Search text cannot be empty or whitespace only.";
  }
  if (searchFor.length === 1 && /^[a-zA-Z]$/.test(searchFor)) {
    return "Single alphabet character searches are not allowed.";
  }

  try {
    const response = await fetch(`/api/log/search?keyword=${encodeURIComponent(searchFor)}`);
    const data = await response.json();
    
    if (!data.success) {
      return `Error: ${data.error || 'Unknown error occurred'}`;
    }
    
    return data.message;
  } catch (error) {
    return `Error: Failed to search logs - ${error.message}`;
  }
}
