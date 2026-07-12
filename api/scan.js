import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Initialize the Gemini API with your key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use only gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Extract base64 data (remove the data URL prefix)
    const base64 = image.split(",")[1];

    const imageParts = [
      {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg",
        },
      },
    ];

    const prompt = `You are an educational dental hygiene coach helping someone build better daily brushing and flossing habits. You are NOT a dentist and this is NOT a clinical exam. Look at this photo and give general, habit-focused observations in the following format:

1. VISIBLE HYGIENE CUES: Describe general, visible cues related to brushing habits (e.g. buildup near the gumline, areas that look less thoroughly cleaned). Speak in terms of "may show" or "appears to" rather than definitive statements.

2. BRUSHING HABIT FEEDBACK: Suggest which areas might benefit from more attention during brushing (e.g. back molars, gumline), framed as habit tips, not clinical findings.

3. ACTIONABLE TIPS: Give 2-3 simple, practical habit tips tailored to what you observe.

4. ENCOURAGEMENT: Mention one thing that looks like a good habit, if applicable.

Strict rules:
- Never name or imply a specific condition or disease (no "cavity," "gingivitis," "periodontitis," "decay," etc.) — describe only general visual appearance.
- Never use diagnostic or clinical-sounding language ("your gums show signs of X").
- Explicitly acknowledge that a photo has real limits (lighting, angle, image quality) and cannot reliably assess oral health.
- Keep the tone warm, simple, and educational — like a habit coach, not a medical provider.
- Do not make any claim that could be mistaken for a professional evaluation.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const rawFeedback = response.text();

    const disclaimer =
      "\n\n⚠️ This is a general, educational observation based on a single photo — not a dental exam or diagnosis. Photo quality, lighting, and angle all limit what can be seen. For anything you're concerned about, please see a licensed dentist.";

    const feedback = rawFeedback + disclaimer;

    return res.status(200).json({
      feedback,
      modelUsed: "gemini-2.5-flash"
    });

  } catch (err) {
    console.error("SCAN ERROR:", err);
    console.error("ERROR DETAILS:", err.message);
    res.status(500).json({ 
      error: "AI analysis failed", 
      details: err.message
    });
  }
}
