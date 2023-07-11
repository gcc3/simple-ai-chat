export default async function clear(args) {
  localStorage.setItem("queryId", Date.now());  // reset query id
  return "";
}
