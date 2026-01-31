import katex from 'katex';

/*
  Process:
  Check the code block or equation block is closed or not, if not, return

  Temporarily stop observing

    Format the output
      Store code block to placeholders

        for each line
          Trim
          Inline code
          Emphasis
          Remove the # at first
          Detect URLs
          Math equation (LaTeX) support      

      Resume code block
      Cleanup

  Resume observing

  To test: Repeat me *text* **text** `text` ```text``` **test`test`** *test`test`*
*/
export function markdownFormatter(elOutput) {
  if (!elOutput) return;
  let output = globalThis.rawOutput;

  // Check the code black is closed or not
  let codeBlockOpen = false;
  output.split('\n').forEach((line, i) => {
    if (line.trim().startsWith('```')) codeBlockOpen = !codeBlockOpen;
  });
  if (codeBlockOpen) return;

  // Check equation block is closed or not
  let equationBlockOpen = false;
  output.split('\n').forEach((line, i) => {
    if (line.trim().startsWith("\\[")) equationBlockOpen = true;
    if (line.trim().endsWith("\\]")) equationBlockOpen = false;
  });
  if (equationBlockOpen) return;

  // Temporarily stop observing
  globalThis.outputMutationObserver.disconnect();

  // Format the output
  let omitLines = [];
  elOutput.innerHTML = ((output) => {
    let result = "";

    // Replace ```text``` with <pre><code>text</code></pre>
    // /```([^`]+)```/g, it won't match the code block with backtick in it
    // /```((?:(?!```)[\s\S])+?)```/g, it will match the code block with backtick in it
    let codeBlocks = [];
    result = output.replace(/```((?:(?!```)[\s\S])+?)```/g, function (match, p1) {
      codeBlocks.push(p1);
      return '\x00'; // Use a null character as a placeholder
    });

    result = result.split('\n').map((line, i) => {
      // Trim
      line = line.trim();

      // Replace `text` with <code>text</code>
      if (line.includes('`')) line = line.replace(/(?<!`)`([^`]+)`(?!`)/g, function (match, p1) {
        // Escape HTML special characters
        let code = p1.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        return `<code class="inline-code">${code}</code>`;  // Inline code
      });

      // Temporarily replace text with a placeholder to avoid conflicts
      let placeholders = [];
      line = line.replace(/\*\*([^*]+)\*\*/g, function (match, p1) {
        placeholders.push('<strong>' + p1 + '</strong>');
        return '\x00'; // Use a null character as a placeholder
      });

      // Replace *text* with <em>text</em>
      if (line.includes('*')) {
        line = line.replace(/\*([^*]+)\*/g, '<em>$1</em>');  // Emphasis
      }

      // Remove the # at first (h1 to h6)
      line = line.replace(/^#\s|^##\s|^###\s|^####\s|^#####\s|^######\s/, '');

      // Detect URLs
      line = line.replace(/\[([^\]]+)\]\(((\w+:\/\/)?[^()\s]*\([^()\s]*\)[^()\s]*|(\w+:\/\/)?[^()\s]+)\)/g, '<u><a href="$2" target="_blank">$1</a></u>');

      // Math equation (LaTeX) support
      // Equation block, e.g. \[  \]
      if (line.trim().startsWith("\\[") && line.trim().endsWith("\\]")) {
        line = line.trim().slice(2, -2);
        line = katex.renderToString(line.trim(), { throwOnError: false });
      }
      // Sometimes the equation block is not at the beginning of the line
      if (line.includes("\\[") && line.includes("\\]")) {
        line = line.replace(/\\\[(.*?)\\\]/g, function (match, p1) {
          return katex.renderToString(p1.trim(), { throwOnError: false });
        });
      }
      // Sometimes the equation block is multple lines
      if (line.trim().startsWith("\\[") && !line.trim().endsWith("\\]")) {
        let equation = "";
        while (i < output.split('\n').length) {
          i++;
          omitLines.push(i);
          const l = output.split('\n')[i];
          if (l.trim() === "\\]") break;
          equation += l + '\n';
        }
        line = katex.renderToString(equation.trim(), { throwOnError: false });
      }
      // Inline equation, e.g. /(  /)
      if (line.includes("\\(") && line.includes("\\)")) {
        line = line.replace(/\\\((.*?)\\\)/g, function (match, p1) {
          return katex.renderToString(p1.trim(), { throwOnError: false });
        });
      }

      // Restore text from placeholders
      placeholders.forEach(function (placeholder) {
        line = line.replace('\x00', placeholder);
      });
      return line;
    }).join('<br>');

    // Omit lines
    result = result.split('<br>').filter((line, i) => {
      return !omitLines.includes(i);
    }).join('<br>');

    // Restore code blocks
    // Set language name and highlight code blocks
    result = result.replace(/\x00/g, function (match, p1) {
      const codeBlock = codeBlocks.shift();
      if (!codeBlock.includes('\n')) {
        return "```" + codeBlock + "```";  // ignore single line code block
      }

      let codeLines = codeBlock.split('\n');
      let language = codeLines.shift().trim();
      if (!language) language = 'plaintext';

      // Remove empty lines at the beginning and the end
      while (codeLines[0] && codeLines[0].trim() === '') codeLines.shift();
      while (codeLines[codeLines.length - 1]
        && codeLines[codeLines.length - 1].trim() === '') codeLines.pop();

      // indent code blocks
      let indent = Infinity;
      codeLines.forEach((line, i) => {
        const match = line.match(/^\s*/);
        const lineIndent = match ? match[0].length : 0;
        if (lineIndent < indent) {
          indent = lineIndent;
        }
      });
      if (indent > 0) {
        codeLines = codeLines.map(line => line.slice(indent));
      }

      let code = codeLines.join('\n');

      // Escape HTML special characters
      // Important, if don't escape, the code will be highlighted incorrectly, especially for "html" language
      code = code.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

      return `<pre><code class="code-block !whitespace-pre hljs language-${language}">${code}</code></pre>`;
    });

    // Clean up <br> tags before and after <pre> and <code>
    result = result
      .replace(/<\/pre><br><br>/g, '</pre><br>')  // Avoid consecutive breaks after </pre>
      .replace(/<br> ?<\/code><\/pre>/g, '</code></pre>')  // Remove <br> before </pre>
      .replace(/(?:[^<br>]|^)(<br\s*\/?>\s*<pre>)/gi, '<br>$1'); // If only one <br> before <pre>, add 1 more <br>

    return result;
  })(output);

  // Resume observing
  globalThis.outputMutationObserver.observe(elOutput, {
    childList: true,
    attributes: false,
    subtree: true,
    characterData: true
  });
}
