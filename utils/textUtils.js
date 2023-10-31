export function urlFormatter() {
  const outputElement = document.getElementById("output");
  if (outputElement) {
    // Temporary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const output = outputElement.innerHTML;
    const pattern = /((?:https?|ftp):\/\/[^\s/$)]*[^\s/$)])/g;  // matches URLs
    const replacement = '<a href="$1" target="_blank">$1</a>';
    outputElement.innerHTML = output.replace(pattern, replacement);

    // Resume observing
    const observingConfig = { childList: true, attributes: true, subtree: true, characterData: true };
    global.outputMutationObserver.observe(outputElement, observingConfig);
  }
}
