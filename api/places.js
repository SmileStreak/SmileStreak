const FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.priceLevel,places.photos,places.photos.authorAttributions,places.photos.googleMapsUri,places.businessStatus,places.accessibilityOptions,places.paymentOptions,places.parkingOptions,places.regularOpeningHours";
const DETAIL_FIELD_MASK = "id,displayName,formattedAddress,location,rating,userRatingCount,currentOpeningHours,photos,photos.authorAttributions,photos.googleMapsUri,internationalPhoneNumber,websiteUri,regularOpeningHours,paymentOptions,parkingOptions,accessibilityOptions,businessStatus";

function setPolicy(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  const origins = (process.env.APP_ALLOWED_ORIGINS || process.env.APP_ORIGIN || "")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  const deploymentOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : null;
  const allowed = new Set([...origins, deploymentOrigin, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean));
  const origin = req.headers.origin;
  if (origin && !allowed.has(origin)) return false;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  return true;
}

function validCoordinate(value, min, max) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export default async function handler(req, res) {
  if (!setPolicy(req, res)) return res.status(403).json({ error: "Request origin is not allowed" });
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.GOOGLE_MAPS_KEY) return res.status(503).json({ error: "Dentist search is temporarily unavailable" });

  const placeId = typeof req.query?.placeId === "string" ? req.query.placeId : "";
  const params = new URLSearchParams();
  const headers = { "X-Goog-Api-Key": process.env.GOOGLE_MAPS_KEY };
  let endpoint;

  if (placeId) {
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(placeId)) return res.status(400).json({ error: "Invalid place identifier" });
    endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    headers["X-Goog-FieldMask"] = DETAIL_FIELD_MASK;
  } else {
    const latitude = validCoordinate(req.query?.lat, -90, 90);
    const longitude = validCoordinate(req.query?.lng, -180, 180);
    const requestedRadius = Number(req.query?.radius);
    if (latitude === null || longitude === null) return res.status(400).json({ error: "Valid location coordinates are required" });
    const radius = Number.isFinite(requestedRadius) ? Math.min(Math.max(requestedRadius, 500), 50000) : 5000;
    endpoint = "https://places.googleapis.com/v1/places:searchNearby";
    headers["Content-Type"] = "application/json";
    headers["X-Goog-FieldMask"] = FIELD_MASK;
    const googleResponse = await fetch(endpoint, {
      method: "POST", headers,
      body: JSON.stringify({
        includedTypes: ["dentist"],
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude, longitude }, radius } },
      }),
    }).catch((error) => {
      console.error("Places nearby request failed:", error?.name || "unknown error");
      return null;
    });
    if (!googleResponse?.ok) {
      if (googleResponse) console.error("Places nearby provider status:", googleResponse.status);
      return res.status(502).json({ error: "Dentist search is temporarily unavailable" });
    }
    const data = await googleResponse.json().catch(() => ({}));
    return res.status(200).json(data.places || []);
  }

  headers["X-Goog-FieldMask"] = DETAIL_FIELD_MASK;
  const googleResponse = await fetch(endpoint, { headers }).catch((error) => {
    console.error("Places detail request failed:", error?.name || "unknown error");
    return null;
  });
  if (!googleResponse?.ok) {
    if (googleResponse) console.error("Places detail provider status:", googleResponse.status);
    return res.status(502).json({ error: "Dentist details are temporarily unavailable" });
  }
  const data = await googleResponse.json().catch(() => null);
  if (!data) return res.status(502).json({ error: "Dentist details are temporarily unavailable" });
  return res.status(200).json(data);
}
