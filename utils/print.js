export function printRequest(req) {
  console.log(req.method + " " + req.url 
    + "\nHeaders:" + JSON.stringify(req.headers) 
    + (req.method === "POST" ? "\nBody:" + JSON.stringify(req.body) : ""));
}