export function urlFormatter(elOutput) {
  if (elOutput) {
    // Temporary stop observing
    global.outputMutationObserver.disconnect();

    // Format the output
    const output = elOutput.innerHTML;
    const pattern = /((?:https?|ftp):\/\/[^\s/$)]*[^\s/$)])/g;  // matches URLs
    const replacement = '<code><a href="$1" target="_blank">$1</a></code>';
    elOutput.innerHTML = output.replace(pattern, replacement);

    // Resume observing
    const observingConfig = { childList: true, attributes: true, subtree: true, characterData: true };
    global.outputMutationObserver.observe(elOutput, observingConfig);
  }
}
