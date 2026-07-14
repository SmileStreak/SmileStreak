import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Smile Streak <anything>@yaniiriel.resend.app", // keep this unless you verified a domain
      to: "edwincherianj@gmail.com",
      subject: "New Smile Streak Feedback",
      text: message,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to send feedback" }),
      { status: 500 }
    );
  }
}
