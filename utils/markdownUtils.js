export function markdownFormatter() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    // Temproary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const formatOutput = (output) => {
      // Replace the ```code_language_name to ```code to remove the language name
      output = output.replace(/```(\w+)/g, '```');

      // Replace markdown and other patterns
      output = output
        .replace(/```([^`]+)```/g, '<pre>$1</pre>')              // Multi-line code blocks
        .replace(/(?<!`)`([^`]+)`(?!`)/g, '<code>$1</code>')     // Inline code

        // Clean up <pre> tags
        .replace(/<pre>\s*(\w+)?\s*<br>/g, '<pre>')              // Remove language name followed by <br> after <pre>
        .replace(/<\/pre><br><br>/g, '</pre><br>')               // Avoid consecutive breaks after </pre>
        .replace(/<br> ?<\/pre>/g, '</pre>')                     // Remove <br> before </pre>

      return output;
    }

    const output = outputElement.innerHTML;
    outputElement.innerHTML = formatOutput(output);

    // Resume observing
    global.outputMutationObserver.observe(outputElement, { 
      childList: true, 
      attributes: false, 
      subtree: true, 
      characterData: true
    });
  }
}
