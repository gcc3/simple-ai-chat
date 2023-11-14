export function verifiyEmailAddress(email) {
  // Check if the email is valid.
  if (!email.includes('@')) {
    return false;
  }
  const emailParts = email.split('@');
  if (emailParts.length !== 2 || emailParts[0].length === 0 || emailParts[1].length === 0) {
    return false;
  }

  return true;
}
