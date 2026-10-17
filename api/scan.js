import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');

  const configuredOrigins = (process.env.APP_ALLOWED_ORIGINS || process.env.APP_ORIGIN || '')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  const deploymentOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`
    : null;
  const allowedOrigins = new Set([
    ...configuredOrigins,
    deploymentOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean));
  const requestOrigin = req.headers.origin;
  if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
    return res.status(403).json({ error: 'Request origin is not allowed' });
  }
  if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(image);
    if (!dataUrl) {
      return res.status(400).json({ error: "Use a JPEG, PNG, or WebP image" });
    }
    const [, mimeType, base64] = dataUrl;
    const imageSize = Buffer.byteLength(base64, 'base64');
    if (imageSize > 3 * 1024 * 1024) {
      return res.status(413).json({ error: "Image must be smaller than 3 MB" });
    }
    if (imageSize === 0) {
      return res.status(400).json({ error: "Image data is empty" });
    }
    const imageBytes = Buffer.from(base64, 'base64');
    const normalizedMimeType = mimeType.toLowerCase();
    const isJpeg = normalizedMimeType === 'image/jpeg' && imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff;
    const isPng = normalizedMimeType === 'image/png' && imageBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = normalizedMimeType === 'image/webp' && imageBytes.toString('ascii', 0, 4) === 'RIFF' && imageBytes.toString('ascii', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) {
      return res.status(400).json({ error: "Image content does not match its file type" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Photo feedback is temporarily unavailable" });
    }

    // Initialize the Gemini API with your key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use only gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const imageParts = [
      {
        inlineData: {
          data: base64,
          mimeType: normalizedMimeType,
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
    const unsafeClinicalClaim = /\b(cavit(?:y|ies)|caries|gingivitis|periodontitis|abscess|oral cancer|you have|you likely have|you are diagnosed|diagnos(?:e|is|ed)|prescrib(?:e|ed|ing))\b/i.test(rawFeedback);
    const safeFeedback = unsafeClinicalClaim
      ? "I can’t assess or diagnose oral health from a photo. A licensed dentist can examine you and discuss appropriate next steps. If you have a personal concern, please contact a dental professional."
      : rawFeedback;

    const disclaimer =
      "\n\n⚠️ This is a general, educational observation based on a single photo — not a dental exam or diagnosis. Photo quality, lighting, and angle all limit what can be seen. For anything you're concerned about, please see a licensed dentist.";

    const feedback = safeFeedback + disclaimer;

    return res.status(200).json({
      feedback,
      modelUsed: "gemini-2.5-flash"
    });

  } catch (err) {
    console.error("Scan request failed:", err?.status || err?.name || "unknown error");
    res.status(500).json({ 
      error: "Photo feedback is temporarily unavailable. Please try again."
    });
  }
}
