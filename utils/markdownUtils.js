export function markdownFormatter(elOutput) {
  if (!elOutput) return;
  
  const output = elOutput.innerHTML;
  
  // Check the code black is closed or not
  let codeBlockOpen = false;
  output.split('<br>').forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      codeBlockOpen = !codeBlockOpen;
    }
  });
  if (codeBlockOpen) return;

  // Temproary stop observing
  global.outputMutationObserver.disconnect();

  // Format the output
  elOutput.innerHTML = ((output) => {
    // Temporarily replace multi-line code blocks with placeholders
    const codeBlocks = [];
    output = output.replace(/<pre>([^`]+)<\/pre>/g, (match, p1, offset, string) => {
      codeBlocks.push(`<pre>${p1}</pre>`);
      return `###CODE###${codeBlocks.length - 1}`;
    });

    // Replace markdown and other patterns
    output = output.replace(/(?<!`)`([^`]+)`(?!`)/g, '<code>$1</code>')  // Inline code

    // Restore multi-line code blocks from placeholders
    output = output.replace(/###CODE###(\d+)/g, (match, p1) => {
      return codeBlocks[p1];
    });

    // Replace the ```code_language_name to ```code to remove the language name
    output = output.replace(/```(\w+)/g, '```');

    // Multi-line code blocks
    output = output.replace(/```([^`]+)```/g, `<pre>$1</pre>`);

    // Clean up <pre> tags
    output = output
      .replace(/<pre>\s*(\w+)?\s*<br>/g, '<pre>')  // Remove language name followed by <br> after <pre>
      .replace(/<\/pre><br><br>/g, '</pre><br>')   // Avoid consecutive breaks after </pre>
      .replace(/<br> ?<\/pre>/g, '</pre>')         // Remove <br> before </pre>

    // Final lines replacer
    output = output.split('<br>').map((line, i) => {
      if (line.includes('**')) return line.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');  // Replace **text** with text only
      return line;
    }).join('<br>');

    return output;
  })(output);

  // Resume observing
  global.outputMutationObserver.observe(elOutput, { 
    childList: true, 
    attributes: false, 
    subtree: true, 
    characterData: true
  });
}
