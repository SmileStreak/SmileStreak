export default async function handler(req, res) {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  try {
    const yelpRes = await fetch(
      `https://api.yelp.com/v3/businesses/search?term=dentist&latitude=${lat}&longitude=${lng}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
      }
    );

    const data = await yelpRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Yelp request failed" });
  }
}
