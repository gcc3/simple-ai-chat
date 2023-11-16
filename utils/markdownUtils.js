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
  // To test: Repeat me *text* **text** `text` ```text``` **test`test`** *test`test`*
  elOutput.innerHTML = ((output) => {
    // Temporarily replace multi-line code blocks with placeholders
    const codeBlocks = [];
    output = output.replace(/<pre><code>([^`]+)<\/code><\/pre>/g, (match, p1, offset, string) => {
      codeBlocks.push(`<pre><code>${p1}</code></pre>`);
      return `###CODE###${codeBlocks.length - 1}`;
    });

    output = output.split('<br>').map((line, i) => {
      // Replace `text` with <code>text</code>
      if (line.includes('`')) line = line.replace(/(?<!`)`([^`]+)`(?!`)/g, function(match, p1) {
        return `<code class="inline-code">${p1}</code>`;  // Inline code
      });

      // Temporarily replace text with a placeholder to avoid conflicts
      let placeholders = [];
      line = line.replace(/\*\*(.*?)\*\*/g, function(match, p1) {
          placeholders.push('<strong>' + p1 + '</strong>');
          return '\x00'; // Use a null character as a placeholder
      });

      // Replace *text* with <em>text</em>
      if (line.includes('*')) {
          line = line.replace(/\*([^*]+?)\*/g, '<em>$1</em>');  // Emphasis
      }

      // Restore text from placeholders
      placeholders.forEach(function(placeholder) {
          line = line.replace('\x00', placeholder);
      });
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

    // In <pre><code> tags replace <br> with \n
    output = output.replace(/<pre><code>([^`]+)<\/code><\/pre>/g, (match, p1) => {
      return `<pre><code>${p1.replaceAll('<br>', '\n')}</code></pre>`;
    });

    // Set language name and highlight code blocks
    output = output.replace(/<pre><code>([^`]+)<\/code><\/pre>/g, (match, p1) => {
      let codeLines = p1.split('\n');

      // Get the language name and code
      let languageName = codeLines[0].trim();
      if (!languageName) languageName = 'plaintext';
      const code = codeLines.slice(1).join('\n');

      // Highlight the code
      return `<pre><code class="code-block !whitespace-pre hljs language-${languageName}">${code}</code></pre>`;
    });

    // Clean up <pre> tags
    output = output
      .replace(/<\/pre><br><br>/g, '</pre><br>')  // Avoid consecutive breaks after </pre>
      .replace(/<br> ?<\/code><\/pre>/g, '</code></pre>')  // Remove <br> before </pre>

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
