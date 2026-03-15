export function getInput(text_raw) {
  let error = "";

  let has_image = false;
  let has_file = false;
  const image_urls = [];
  const image_urls_encoded = [];
  const file_urls = [];
  const file_urls_encoded = [];

  let text_processed = text_raw;
  const matches = [...text_raw.matchAll(/(\+file|\+image|\+img)\[([^\]]+)\]/g)];
  matches.forEach(match => {
    const block = match[1] + "[" + match[2] + "]";

    // Extract the URL
    const url = block
      .replace("+image[", "")
      .replace("+img[", "")
      .replace("+file[", "")
      .replace("]", "");

    // Check if the URL is valid
    if (!url.startsWith("http")) {
      console.error("Invalid URL: " + url);
      return;
    }

    // Add to the appropriate URL list
    if (block.startsWith("+image[") || block.startsWith("+img[")) {
      image_urls.push(url);
      image_urls_encoded.push(encodeURIComponent(url));
    } else if (block.startsWith("+file[")) {
      file_urls.push(url);
      file_urls_encoded.push(encodeURIComponent(url));
    }

    // Remove the block from the raw input
    text_processed = text_processed.replace(block, "");
  });

  if (image_urls.length > 0) {
    has_image = true;
  }
  if (file_urls.length > 0) {
    has_file = true;
  }

  let text = text_processed.trim();

  // Convert full-width characters to half-width
  text = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // Full-width colon or exclamation mark error
  if (text_raw.startsWith("：")) {
    error = "Please use half-width colon (\":\").";
  }
  if (text_raw.startsWith("！")) {
    error = "Please use half-width exclamation mark (\"!\").";
  }

  const is_command = text_raw.startsWith(":");
  let command = "";
  let command_line = "";
  const arguments_ = [];
  if (is_command) {
    command_line = text.substring(1).trim();
    if (command_line.length === 0) {
      error = "Invalid command.";
    }

    // Take only the first word as the command
    command = command_line.split(" ")[0];
    
    // Take the rest as arguments
    const command_arguments = command_line.substring(command.length).trim();
    if (command_line.length > command.length) {
      arguments_.push(...command_arguments.split(" ").filter(arg => arg.length > 0));
    }
  }

  const is_function = text_raw.startsWith("!");
  let functions = [];
  if (is_function) {
    const functions_text = text.substring(1);
    if (functions_text.length === 0
      || !functions_text.includes("(") || !functions_text.includes(")")) {
      error = "Invalid function.";
    }
    functions = functions_text.split(",!");
  }

  if (globalThis.minimalist) {
    is_command = false;
    is_function = false;
  }

  if ((is_command || is_function) && (has_image || has_file)) {
    error = "Invalid input.";
  }

  const is_empty =
    text.length === 0 &&
    image_urls.length === 0 &&
    file_urls.length === 0;

  return {
    text_raw,
    text,
    image_urls,
    image_urls_encoded,
    has_image,
    file_urls,
    file_urls_encoded,
    has_file,
    is_command,
    command_line,
    command,
    arguments_,
    is_function,
    functions,
    is_empty,
    error,
  };
}
