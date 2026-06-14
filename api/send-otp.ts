import { Resend } from 'resend';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  // Generate a secure 6 digit OTP Code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Calculate stateless hash
  const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';
  const hash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');

  if (!API_KEY) {
    return res.status(500).json({ 
      error: "RESEND_API_KEY is not configured on Vercel. Please add it to your Environment Variables setting in Vercel to enable real emails." 
    });
  }

  const resend = new Resend(API_KEY);
  
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
      console.warn(`Unverified custom sender domain error: ${resendResult.error.message}. Retrying sending OTP...`);
      finalFrom = 'admissions@learnora.in';

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

    if (resendResult.error) {
      console.error("Resend API Error:", resendResult.error);
      let friendlyMessage = resendResult.error.message;
      if (resendResult.error.name?.toLowerCase().includes("validation") || friendlyMessage.includes("verify")) {
         friendlyMessage = "Resend Sandbox Restriction: You can only send to your verified email or domain. Please verify your domain in Resend.";
      }
      return res.status(500).json({ error: friendlyMessage });
    }

    res.status(200).json({ success: true, message: "OTP sent successfully", hash });

  } catch (error: any) {
    console.error("OTP send error:", error);
    let friendlyMessage = error.message;
    return res.status(500).json({ error: friendlyMessage });
  }
}
