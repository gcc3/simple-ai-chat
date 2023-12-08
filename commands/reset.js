export default async function clear(args) {
  localStorage.setItem("time", Date.now());
  localStorage.setItem("queryId", Date.now());
  return "Session reset.";
}
