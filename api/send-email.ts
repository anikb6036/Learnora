import { Resend } from 'resend';

const getFriendlyResendError = (resendError: any, targetEmail: string): string => {
  if (!resendError) return "An unknown error occurred with the email provider.";
  
  const msg = resendError.message || "";
  const name = resendError.name || "";
  
  if (name.toLowerCase().includes("validation") || msg.toLowerCase().includes("sandbox") || msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("recipient")) {
    return `Resend Sandbox Restriction: Since your Resend account is in Sandbox mode, you can only send emails to the registered email address of your Resend account. To send emails to '${targetEmail}', please enter your registered Resend email address, or add '${targetEmail}' to your Single Recipient list in your Resend Dashboard, or verify your custom domain in Resend.`;
  }
  
  if (name.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("invalid")) {
    return "Resend Unauthorized Error: Your RESEND_API_KEY is invalid or expired. Please check your credentials in the AI Studio settings.";
  }
  
  return msg || "Failed to send email via Resend.";
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, text, html } = req.body;
  
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: "missing recipient(to), subject, and body (text or html)." });
  }

  const email = to;

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ success: false, error: "RESEND_API_KEY is not configured on Vercel." });
  }

  const resend = new Resend(API_KEY);

  const fromAddress = 'Learnora Admissions <admissions@learnora.in>';
  let finalFrom = fromAddress;
  let fallbackAttempted = false;

  try {
    let resendResult = await resend.emails.send({
      from: finalFrom,
      to: Array.isArray(email) ? email : [email],
      subject: subject,
      text: text,
      html: html
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
          to: Array.isArray(email) ? email : [email],
          subject: subject,
          text: text,
          html: html
        });
      }
    }

    if (resendResult.error) {
       console.error("Resend API Error details:", JSON.stringify(resendResult.error, null, 2));
       const friendlyMessage = getFriendlyResendError(resendResult.error, email);
       return res.status(500).json({ error: friendlyMessage });
    }

    res.status(200).json({ success: true, message: "Email dispatched successfully" });

  } catch (err: any) {
     console.error("Failed to send email:", err);
     const friendlyMessage = getFriendlyResendError(err, email);
     res.status(500).json({ error: friendlyMessage });
  }
}
