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
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "No question provided" });
    }
    // Initialize the Gemini API with your key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-2.5-flash (your preferred model)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a friendly, general dental education assistant. You are NOT a dentist and cannot examine, diagnose, or treat anyone. Answer the user's question about dental health, procedures, or finding a dentist.
Question: ${query}
Provide a helpful, accurate response that:
- Uses simple language (avoid jargon unless you explain it)
- Gives general, practical, educational information only
- Never diagnoses a condition or tells the user what they specifically have
- Never recommends a specific treatment, medication, dosage, or procedure for their exact situation
- Encourages a professional dental visit whenever the question involves pain, symptoms, or a specific personal concern
- Is warm and encouraging
- Keep responses concise but informative (2-4 paragraphs max)
If you're unsure about something, say so honestly rather than guessing.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawAnswer = response.text();

    const disclaimer =
      "\n\n⚠️ This is general educational information, not a diagnosis or treatment plan. For anything specific to you, please see a licensed dentist.";

    const answer = rawAnswer + disclaimer;
    
    return res.status(200).json({ 
      answer,
      modelUsed: "gemini-2.5-flash" 
    });
  } catch (err) {
    console.error("ASSISTANT ERROR:", err);
    console.error("ERROR DETAILS:", err.message);
    res.status(500).json({ 
      error: "Failed to get answer", 
      details: err.message
    });
  }
}
