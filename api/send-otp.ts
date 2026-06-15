import { Resend } from 'resend';
import crypto from 'crypto';

const getFriendlyResendError = (resendError: any, targetEmail: string): string => {
  if (!resendError) return "An unknown error occurred with the email provider.";
  
  const msg = resendError.message || "";
  const name = resendError.name || "";
  
  if (name.toLowerCase().includes("validation") || msg.toLowerCase().includes("sandbox") || msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("recipient")) {
    return `Resend Sandbox Restriction: Since your Resend account is in Sandbox mode, you can only send emails to the registered email address of your Resend account. To send verification emails to '${targetEmail}', please enter your registered Resend email address, or add '${targetEmail}' to your Single Recipient list in your Resend Dashboard, or verify your custom domain in Resend.`;
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
      error: "RESEND_API_KEY is not configured. Please add it in your AI Studio settings (Secrets panel)." 
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
       fallbackAttempted = true;
       
       resendResult = await resend.emails.send({
         from: finalFrom,
         to: [email],
         subject: 'Learnora Admissions OTP Verification',
         html: `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;"><h2>Learnora Admissions</h2><p>Your one-time verification code is:</p><h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${code}</h1></div>`
       });
    }

    if (resendResult.error) {
      console.error("Resend API Error details:", JSON.stringify(resendResult.error, null, 2));
      const friendlyMessage = getFriendlyResendError(resendResult.error, email);
      // Return developerSandboxOtp so user can bypass OTP verification during sandbox / developer testing setup.
      return res.status(400).json({ 
        error: friendlyMessage, 
        developerSandboxOtp: code 
      });
    }

    return res.status(200).json({ success: true, message: "OTP sent successfully", hash });
  } catch (err: any) {
    console.error("Exception caught in send-otp:", err);
    const friendlyMessage = getFriendlyResendError(err, email);
    return res.status(400).json({ 
      error: friendlyMessage, 
      developerSandboxOtp: code 
    });
  }
}
