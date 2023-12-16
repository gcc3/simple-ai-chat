export async function getAddress(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const address = data.results[0].formatted_address;
  return address;
}
