export function tryParseJSON(jsonString) {
  try {
    var obj = JSON.parse(jsonString);
    if (obj && typeof obj === "object") {
      return obj;
    }
  } catch (e) {
    console.log("JSON try parse failed: " + jsonString);
    return null;
  }
  return null;
}
