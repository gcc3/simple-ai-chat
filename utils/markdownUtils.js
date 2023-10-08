export function markdownFormatter() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    // Temproary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const formatOutput = (output) => {
      // Headers from h1 to h6
      for (let i = 6; i >= 1; i--) {
        const pattern = new RegExp(`#{${i}}([^#]+)#{${i}}`, 'g');
        output = output.replace(pattern, `<h${i}>$1</h${i}>`);
      }
    
      // Replace markdown and other patterns
      output = output
        .replace(/```([^`]+)```/g, '<pre>$1</pre>')                   // Multi-line code blocks
        .replace(/(?<!`)`([^`]+)`(?!`)/g, '<code>$1</code>')          // Inline code
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')           // Bold
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')                       // Italic
        .replace(/~~([^~]+)~~/g, '<del>$1</del>')                     // Strikethrough
    
        // Clean up <pre> tags
        .replace(/<pre>\s*(\w+)?\s*<br>/g, '<pre>')                   // Remove language name followed by <br> after <pre>
        .replace(/<\/pre><br><br>/g, '</pre><br>')                    // Avoid consecutive breaks after </pre>
        .replace(/<br> ?<\/pre>/g, '</pre>');                         // Remove <br> before </pre>

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
