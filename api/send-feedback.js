import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message required" });
    }

    await resend.emails.send({
      from: "Smile Streak <onboarding@resend.dev>",
      to: "edwincherianj@gmail.com",
      subject: "New Smile Streak Feedback",
      text: message,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Email failed" });
  }
}
