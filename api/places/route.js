export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ error: "Missing query" }, { status: 400 });
  }

  const url =
    "https://maps.googleapis.com/maps/api/place/textsearch/json?" +
    new URLSearchParams({
      query,
      key: process.env.GOOGLE_MAPS_KEY, // your Maps key here
    });

  const res = await fetch(url);
  const data = await res.json();

  return Response.json(data);
}
