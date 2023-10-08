export function urlFormatter() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    // Temproary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const output = outputElement.innerHTML;
    outputElement.innerHTML = output.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/g, function(match) {
                                // If the URL starts with www., prepend http:// to it
                                var link = match.startsWith('www.') ? 'http://' + match : match;
                                return '<a href="' + link + '" target="_blank">' + match + '</a>';
                              });

    // Resume observing
    global.outputMutationObserver.observe(outputElement, { 
      childList: true, 
      attributes: false, 
      subtree: true, 
      characterData: true
    });
  }
}
