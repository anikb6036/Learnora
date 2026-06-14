import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: "Missing required fields for email." });
  }

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!API_KEY) {
      return res.status(500).json({ error: "RESEND_API_KEY is not configured." });
  }

  const resend = new Resend(API_KEY);

  const fromAddress = 'Learnora Admissions <admissions@learnora.in>';
  let finalFrom = fromAddress;
  let fallbackAttempted = false;

  try {
      let resendResult = await resend.emails.send({
      from: finalFrom,
      to,
      subject,
      text,
      html
      });

      if (resendResult.error && !fallbackAttempted) {
      const errType = resendResult.error.name?.toLowerCase() || "";
      const errText = resendResult.error.message?.toLowerCase() || "";
      const isSenderError = errType.includes("validation") || errText.includes("sender") || errText.includes("from") || errText.includes("verify") || errText.includes("domain") || errText.includes("unauthorized");

      if (isSenderError) {
          console.warn(`Unverified custom sender domain error in send-email: ${resendResult.error.message}. Retrying with admissions@learnora.in fallback...`);
          finalFrom = 'admissions@learnora.in';
          fallbackAttempted = true;

          resendResult = await resend.emails.send({
          from: finalFrom,
          to,
          subject,
          text,
          html
          });
      }
      }

      if (resendResult.error) {
         let friendlyMessage = resendResult.error.message;
         if (resendResult.error.name?.toLowerCase().includes("validation")) {
            friendlyMessage = "Resend Sandbox Restriction: You can only send to your verified email or domain. Please configure Resend properly.";
         }
         return res.status(500).json({ error: friendlyMessage });
      }

      res.json({ success: true, message: "Email sent successfully" });

  } catch (error: any) {
      console.error("Email send error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
  }
}
