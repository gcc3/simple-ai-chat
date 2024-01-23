export function simulateKeyPress(key, targetElement) {
  if (key.toLowerCase() === 'esc') {
    // Simulate a ESC key press
    const escKeyPress = new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    if (targetElement) {
      targetElement.dispatchEvent(escKeyPress);
    }
  }

  if (key.toLowerCase() === "tab") {
    // Simulate a Tab key press
    const tabKeyPress = new KeyboardEvent('keydown', {
      key: 'Tab',
      keyCode: 9,
      which: 9,
      bubbles: true,
      cancelable: true,
    });
    if (targetElement) {
      targetElement.dispatchEvent(tabKeyPress);
    }
  }
}