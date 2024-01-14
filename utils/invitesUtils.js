export function generateInviteCode(user) {
  let invite_code = compressToBase64(BigInt(Number(user.created_at)));
  return invite_code;
}

export function compressToBase64(bigInt) {
  // Convert BigInt to a hex string
  const hexStr = bigInt.toString(16);

  // Encode the hex string to Base64
  const encoder = new TextEncoder();
  const binaryStr = encoder.encode(hexStr);
  const base64Str = btoa(String.fromCharCode(...binaryStr));
  return base64Str;
}

export function decompressFromBase64(base64Str) {
  const binaryStr = atob(base64Str);  // Decode the Base64 string to a binary string

  // Convert the binary string back to a hex string
  const decoder = new TextDecoder();
  const hexStr = decoder.decode(new Uint8Array(binaryStr.split('').map(c => c.charCodeAt(0))));
  const bigInt = BigInt('0x' + hexStr);  // Convert the hex string back to the original BigInt

  // Convert BigInt to string to avoid serialization error
  return bigInt.toString();
}