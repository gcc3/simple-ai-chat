export function generateInviteCode(user, shift = 3) {
  let invite_code = encodeTimestamp(Number(user.created_at), shift);
  return invite_code;
}

export function encodeTimestamp(timestamp, shift) {
  // Convert the timestamp to a string to work with individual characters
  const timestampStr = timestamp.toString();
  let encoded = '';

  // Loop through each character in the string
  for (let char of timestampStr) {
    // Convert the current character to a number
    let digit = parseInt(char);

    // Apply the cipher shift
    let shiftedDigit = (digit + shift) % 10;

    // Concatenate the shifted digit to the encoded string
    encoded += shiftedDigit.toString();
  }

  return encoded;
}

export function decodeTimestamp(encodedTimestamp, shift = 3) {
  // Convert the encoded timestamp to a string to work with individual characters
  const encodedStr = encodedTimestamp.toString();
  let decoded = '';

  // Loop through each character in the string
  for (let char of encodedStr) {
    // Convert the current character to a number
    let digit = parseInt(char);

    // Apply the reverse cipher shift
    let shiftedDigit = (digit - shift + 10) % 10;

    // Concatenate the shifted digit to the decoded string
    decoded += shiftedDigit.toString();
  }

  return decoded;
}