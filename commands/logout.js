export default async function logout(args) {

  // Clear user info
  localStorage.removeItem("user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userSettings");

  // Reset query id to forget previous memory
  localStorage.setItem("queryId", Date.now());

  // Reset role
  if (localStorage.getItem("role")) {
    localStorage.setItem("role", "");
  }

  return "Logout successful.";
}
