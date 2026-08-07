// A message carried to the CLI on one line of stdin.
//
// The CLI reads stdin with readline, so a newline is a submission boundary: a message that
// contains one cannot arrive as itself — it would be read as two separate inputs, and a
// second line starting with ":" would run as a command. When the CLI is driven by a bridge
// server (sc-even's serve.mjs) rather than a person at a terminal, the bridge encodes such a
// message onto a single line behind the marker byte below, and the CLI puts it back. The same
// in-band convention as `@ip[...]` — see utils/ip.js.
//
// Both halves are defined here, this being where the convention belongs. A bridge writes the
// encoding half out again for itself rather than importing it: importing would tie its ability
// to start to the CLI being new enough to have this file, taking it down on a version it could
// otherwise serve. Anything changed here has to be changed there too — see writeLine in
// sc-even's serve.mjs.
//
// JSON rather than an ad-hoc backslash escape: JSON.stringify is guaranteed to emit no raw
// newline, JSON.parse is its exact inverse, and no text a user could type is at risk of being
// mistaken for an escape sequence.

// STX (start of text). A control byte, so nobody typing at a real terminal can produce one,
// which is what makes "does this line start with the marker" a safe question to ask.
const MARK = "\x02";

// Single-line text is passed through untouched, so this changes nothing about the traffic
// that already worked — only a message that could not have been sent before is wrapped.
export function encodeStdinLine(text) {
  const line = String(text ?? "");
  return /[\r\n]/.test(line) ? MARK + JSON.stringify(line) : line;
}

export function decodeStdinLine(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed.startsWith(MARK)) return trimmed;
  try {
    const decoded = JSON.parse(trimmed.slice(MARK.length));
    // Only a string is ours. Anything else parsed cleanly by coincidence, and acting on it
    // would be inventing meaning the sender never put there.
    return typeof decoded === "string" ? decoded.trim() : trimmed;
  } catch {
    return trimmed; // not ours after all — leave it exactly as it came
  }
}
