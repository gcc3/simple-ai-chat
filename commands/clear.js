export default async function clear(args) {
  document.getElementById("output").innerHTML = "";
  localStorage.setItem("queryId", Date.now());  // reset query id
  return "";
}
