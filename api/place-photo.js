export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.GOOGLE_MAPS_KEY) return res.status(503).json({ error: "Photos are temporarily unavailable" });

  const name = typeof req.query?.name === "string" ? req.query.name : "";
  if (!/^places\/[A-Za-z0-9_-]{1,200}\/photos\/[A-Za-z0-9_=-]{1,1000}$/.test(name)) {
    return res.status(400).json({ error: "Invalid photo reference" });
  }

  const photoUrl = new URL(`https://places.googleapis.com/v1/${name}/media`);
  photoUrl.searchParams.set("maxHeightPx", "400");
  photoUrl.searchParams.set("maxWidthPx", "400");
  const response = await fetch(photoUrl, { headers: { "X-Goog-Api-Key": process.env.GOOGLE_MAPS_KEY } }).catch((error) => {
    console.error("Places photo request failed:", error?.name || "unknown error");
    return null;
  });
  if (!response?.ok) {
    if (response) console.error("Places photo provider status:", response.status);
    return res.status(502).json({ error: "Photo is temporarily unavailable" });
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return res.status(502).json({ error: "Photo is temporarily unavailable" });
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", "inline");
  return res.status(200).send(Buffer.from(await response.arrayBuffer()));
}
