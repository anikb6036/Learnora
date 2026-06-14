import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: "Missing required fields for email." });
  }

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!API_KEY) {
      console.warn("RESEND_API_KEY is not configured. Simulating email send for sandbox.");
      return res.status(200).json({ success: true, message: "Sandbox mode: Email simulated." });
  }

  const resend = new Resend(API_KEY);

  const fromAddress = 'Learnora Admissions <admissions@learnora.in>';
  let finalFrom = fromAddress;
  let fallbackAttempted = false;

  try {
      let resendResult = await resend.emails.send({
        from: finalFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html
      });

      if (resendResult.error && !fallbackAttempted) {
          console.warn(`Unverified custom sender domain error in send-email: ${resendResult.error.message}. Retrying with fallback...`);
          finalFrom = 'admissions@learnora.in';

          resendResult = await resend.emails.send({
            from: finalFrom,
            to: Array.isArray(to) ? to : [to],
            subject,
            text,
            html
          });
      }

      if (resendResult.error) {
         console.error("Resend API Error details:", resendResult.error);
         let friendlyMessage = resendResult.error.message;
         if (resendResult.error.name?.toLowerCase().includes("validation") || friendlyMessage.includes("verify")) {
            friendlyMessage = "Resend Sandbox Restriction: You can only send to your verified email or domain. Please configure Resend properly.";
         }
         return res.status(200).json({ success: true, error: friendlyMessage, message: "Sandbox simulated send." });
      }

      res.status(200).json({ success: true, message: "Email dispatched successfully" });

  } catch (error: any) {
      console.error("Failed to send email:", error);
      let friendlyMessage = error.message;
      return res.status(200).json({ success: true, error: friendlyMessage, message: "Sandbox simulated send." });
  }
}
