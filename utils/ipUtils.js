// Get user location from IP address with ipinfo.io
export async function getIpInfo(ip) {
  const res = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
  const data = await res.json();
  return data;
}
