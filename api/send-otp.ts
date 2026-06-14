import { Resend } from 'resend';
import crypto from 'crypto';

const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ 
      error: "RESEND_API_KEY is not configured. Please add it in your AI Studio settings (Secrets panel) to enable real email sending." 
    });
  }

  const resend = new Resend(API_KEY);
  
  // Generate a secure 6 digit OTP Code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Calculate stateless hash
  const hash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');

  const fromAddress = 'Learnora Admissions <admissions@learnora.in>';
  let finalFrom = fromAddress;
  let fallbackAttempted = false;

  try {
    let resendResult = await resend.emails.send({
      from: finalFrom,
      to: [email],
      subject: 'Learnora Admissions OTP Verification',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Learnora Admissions</h2>
          <p>Your one-time verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${code}</h1>
          <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `
    });

    if (resendResult.error && !fallbackAttempted) {
      const errType = resendResult.error.name?.toLowerCase() || "";
      const errText = resendResult.error.message?.toLowerCase() || "";
      const isSenderError = errType.includes("validation") || errText.includes("sender") || errText.includes("from") || errText.includes("verify") || errText.includes("domain") || errText.includes("unauthorized");

      if (isSenderError) {
        console.warn(`Unverified custom sender domain error: ${resendResult.error.message}. Retrying sending OTP with admissions@learnora.in fallback...`);
        finalFrom = 'admissions@learnora.in';
        fallbackAttempted = true;

        resendResult = await resend.emails.send({
          from: finalFrom,
          to: [email],
          subject: 'Learnora Admissions OTP Verification',
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2>Learnora Admissions</h2>
              <p>Your one-time verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${code}</h1>
              <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
          `
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

    res.json({ success: true, message: "OTP sent successfully", hash });

  } catch (error: any) {
    console.error("OTP send error:", error);
    res.status(500).json({ error: error.message || "Failed to send OTP" });
  }
}
