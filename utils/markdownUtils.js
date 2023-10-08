export function markdownFormatter() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    
    // Temproary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const output = outputElement.innerHTML;
    outputElement.innerHTML = output
      .replace(/```([^`]+)```/g, '<pre>$1</pre>')                    // Replace the ```text``` with <pre> and </pre>
      .replace(/(?<!`)`([^`]+)`(?!`)/g, '<code>$1</code>')           // Replace the `text` with <code> and </code>, but ignore ```text```
      .replace(/<pre>\s*(\w+)?\s*<br>/g, '<pre>')                    // Replace <pre> language_name <br> with <pre><br>
      .replace(/<\/pre><br><br>/g, '</pre><br>')                     // Replace <pre><br><br> with <pre><br>
      .replace(/<br><\/pre>/g, '</pre>')                             // Replace <br></pre> with </pre>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')            // Replace the **text** with <strong> and </strong>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')                        // Replace the *text* with <em> and </em>

    // Resume observing
    global.outputMutationObserver.observe(outputElement, { 
      childList: true, 
      attributes: false, 
      subtree: true, 
      characterData: true
    });
  }
}
