// A user's address tagged into the message text, as `@ip[1.2.3.4]`.
// The `sc` CLI can be driven by a bridge server (sc-even's serve.mjs) holding one CLI per
// remote user, in which case every request reaches us from the bridge and the connection
// says nothing about who sent it. The bridge tags the message with the address it saw —
// the same in-band convention as `+image[...]` — and this reads it back off.
const IP_TAG = /\s*@ip\[([^\]]*)\]\s*/g;

// An address is hex digits, dots and colons, and no IPv6 address exceeds 45 characters.
// Only a shape check: it keeps a malformed or injected tag out of the database, and what
// remains is still only as trustworthy as whoever sent it.
const looksLikeIp = (v) => v.length > 0 && v.length <= 45 && /^[0-9a-fA-F.:]+$/.test(v);

// Split a tagged message into the address it carries and the message without it.
// The tag is addressed to us, so it is stripped either way — leaving it in would send the
// user's own IP to the model and store it as the text they typed. Returns "" when there is
// no usable tag, which is the signal to fall back to the request's own address.
//
// The LAST tag wins, because the bridge appends its own after whatever the user wrote. The
// bridge already strips theirs before appending, so this only matters if that ever breaks —
// and then the address we trust is still the one added last, by us, rather than the one
// typed first, by them.
export function extractIpTag(text) {
  let ip = "";
  const stripped = String(text ?? "").replace(IP_TAG, (_, tagged) => {
    const candidate = tagged.trim();
    if (looksLikeIp(candidate)) ip = candidate;
    // Malformed tags are dropped rather than kept: still in-band, still not the user's words.
    return " ";
  });
  return { ip, text: stripped.trim() };
}

// Whether a single address is this machine talking to itself. Covers the whole 127.0.0.0/8
// IPv4 loopback block, the IPv6 loopback, and the IPv4-mapped-IPv6 form Node reports for a
// loopback connection on a dual-stack socket. Fully anchored — see isLocalRequestIp.
export function isLoopbackIp(ip) {
  const v = String(ip ?? "").trim().replace(/^::ffff:/i, "");
  return v === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
}

// Whether a request originated on this machine, given the address the routes compute
// (X-Forwarded-For when present, otherwise the socket peer).
//
// That address can be a chain, and only part of it is ours to believe. A proxy configured
// with $proxy_add_x_forwarded_for APPENDS the peer it saw to whatever the client sent, so a
// remote client that sends "X-Forwarded-For: 127.0.0.1" reaches us as
// "127.0.0.1, <their real address>". Accepting a loopback prefix would let them claim to be
// the bridge and write any address they like into the log, so every hop has to be loopback:
// under an appending proxy the final hop is the address the proxy actually saw, and under a
// replacing one there is only ever a single hop.
export function isLocalRequestIp(requestIp) {
  const hops = String(requestIp ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops.length > 0 && hops.every(isLoopbackIp);
}

// Get user location from IP address with ipinfo.io
export async function getIpInfo(ip) {
  const res = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
  const data = await res.json();
  return data;
}
