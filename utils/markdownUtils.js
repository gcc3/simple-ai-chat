export function markdownFormatter(elOutput) {
  if (!elOutput) return;
  
  let output = elOutput.innerHTML;
  
  // Check the code black is closed or not
  let codeBlockOpen = false;
  output.split('<br>').forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      codeBlockOpen = !codeBlockOpen;
    }
  });
  if (codeBlockOpen) return;

  // Temporarily stop observing
  global.outputMutationObserver.disconnect();

  // Format the output
  elOutput.innerHTML = ((output) => {
    // Temporarily replace multi-line code blocks with placeholders
    const codeBlocks = [];
    output = output.replace(/<pre><code>([^`]+)<\/code><\/pre>/g, (match, p1, offset, string) => {
      codeBlocks.push(`<pre><code>${p1}</code></pre>`);
      return `###CODE###${codeBlocks.length - 1}`;
    });

    // Replace `text` with <code>text</code>
    output = output.split('<br>').map((line, i) => {
      if (line.includes('`')) line = line.replace(/(?<!`)`([^`]+)`(?!`)/g, '<code class="inline-code">$1</code>');  // Inline code
      if (line.includes('**')) line = line.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');     // Replace **text** with text only
      return line;
    }).join('<br>');

    // Restore multi-line code blocks from placeholders
    output = output.replace(/###CODE###(\d+)/g, (match, p1) => {
      return codeBlocks[p1];
    });

    // Multi-line code blocks
    let codeBlockOpen = false;
    output = output.split('<br>').map((line, i) => {
      if (line.trim().startsWith('```')) {
        if (!codeBlockOpen) {
          codeBlockOpen = true;
          return line.trim().replace(/```/g, '<pre><code>');
        } else if (codeBlockOpen) {
          codeBlockOpen = false;
          return line.trim().replace(/```/g, '</code></pre>');
        }
      }
      return line;
    }).join('<br>');

    // Clean up <pre> tags
    output = output
      .replace(/<pre><code>\s*(\w+)?\s*<br>/g, '<pre><code>')  // Remove language name followed by <br> after <pre>
      .replace(/<\/pre><code><br><br>/g, '</code></pre><br>')   // Avoid consecutive breaks after </pre>
      .replace(/<br> ?<\/code><\/pre>/g, '</code></pre>')         // Remove <br> before </pre>

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
