export function passwordFormatter(elInput) {
  if (elInput) {
    // Format the output
    const input = elInput.value;
    elInput.value = maskPassword(input);
  }
}

export function maskPassword(input) {
  if (input.startsWith(':login')) {
    const pattern = /^:login (\w+) (\S+)$/;  // matches ':login user_name password'
    const match = input.match(pattern);

    if (match) {
        // creates a string of asterisks with the same length as the password
        const maskedPassword = '*'.repeat(match[2].length);
        return `:login ${match[1]} ${maskedPassword}`; 
    }
  }

  if (input.startsWith(':user set pass')) {
    const pattern = /^:user set pass (\S+)$/;  // matches ':user set pass password'
    const match = input.match(pattern);

    if (match) {
        const maskedPassword = '*'.repeat(match[1].length);
        return `:user set pass ${maskedPassword}`; 
    }
  }

  if (input.startsWith(':user add')) {
    const pattern = /^:user add (\w+) (\S+) (\S+)$/;  // matches ':user add user_name email password'

    if (input.startsWith(':user add')) {
      const match = input.match(pattern);

      if (match) {
        const maskedPassword = '*'.repeat(match[3].length);
        return `:user add ${match[1]} ${match[2]} ${maskedPassword}`; 
      }
    }
  }

  if (input.startsWith(':user join')) {
    const pattern = /^:user join (\w+) (\S+)$/;  // matches ':user join group_name password'
    const match = input.match(pattern);

    if (match) {
      const maskedPassword = '*'.repeat(match[2].length);
      return `:user join ${match[1]} ${maskedPassword}`; 
    }
  }
  
  // if the input doesn't match the pattern, return it as is
  return input;
}
