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
    const observingConfig = { childList: true, attributes: true, subtree: true, characterData: true };
    global.outputMutationObserver.observe(outputElement, observingConfig);
  }
}

export function passwordFormatter() {
  const inputElement = document.getElementById("input");
  if (inputElement) {
    // Temproary stop observing
    global.inputMutationObserver.disconnect();

    // Format the output
    const input = inputElement.value;
    if (input.startsWith(':login')) {
      inputElement.value = maskPassword(input);
    }

    // Resume observing
    const observingConfig = { childList: true, attributes: true, subtree: true, characterData: true };
    global.inputMutationObserver.observe(inputElement, observingConfig);
  }
}

function maskPassword(input) {
  const pattern = /^:login (\w+) (\S+)$/; // matches ':login user_name password'
  const match = input.match(pattern);

  if (match) {
      // creates a string of asterisks with the same length as the password
      const maskedPassword = '*'.repeat(match[2].length);
      return `:login ${match[1]} ${maskedPassword}`; 
  }
  
  // if the input doesn't match the pattern, return it as is
  return input;
}