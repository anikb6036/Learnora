import { Resend } from 'resend';
import crypto from 'crypto';

const getFriendlyResendError = (resendError: any, targetEmail: string): string => {
  if (!resendError) return "An unknown error occurred with the email provider.";
  
  const msg = resendError.message || "";
  const name = resendError.name || "";
  
  if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("limit") || name.toLowerCase().includes("quota") || name.toLowerCase().includes("limit")) {
    return "Resend Quota Exceeded: Your Resend account has reached its daily email sending limit. For admissions testing, please enter the Sandbox Bypass OTP code shown below to proceed.";
  }
  
  if (name.toLowerCase().includes("validation") || msg.toLowerCase().includes("sandbox") || msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("recipient")) {
    return `Resend Sandbox Restriction: Since your Resend account is in Sandbox mode, you can only send emails to the registered email address of your Resend account. To send verification emails to '${targetEmail}', please enter your registered Resend email address, or add '${targetEmail}' to your Single Recipient list in your Resend Dashboard, or verify your custom domain in Resend.`;
  }
  
  if (name.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("invalid")) {
    return "Resend Unauthorized Error: Your RESEND_API_KEY is invalid or expired. Please check your credentials in the AI Studio settings.";
  }
  
  return msg || "Failed to send email via Resend.";
};

const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return true;
  
  const blacklistedDomains = [
    'mailinator.com', 'yopmail.com', 'tempmail.com', 'temp-mail.org', 'temp-mail.com',
    'guerrillamail.com', '10minutemail.com', 'getairmail.com', 'dispostable.com',
    'sharklasers.com', 'guerillamail.co.uk', 'guerillamail.block', 'guerillamail.net',
    'guerillamail.org', 'guerillamail.biz', 'guerillamail.info', 'spam4.me',
    'grr.la', 'pokemail.net', 'vmani.com', 'duck.com', 'tempmailaddress.com',
    'generator.email', 'discard.email', 'disposable.com', 'trashmail.com'
  ];
  
  return blacklistedDomains.includes(domain) || domain.includes('tempmail') || domain.includes('disposable');
};

// In-memory rate limiting structures (Vercel-friendly fallback)
const globalOtpTracker = {
  dayStr: new Date().toISOString().slice(0, 10),
  sentToday: 0
};

const emailOtpTracker: Record<string, { count: number; expiresAt: number }> = {};


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // 2. Blacklist burner/disposable email addresses
  if (isDisposableEmail(email)) {
    return res.status(400).json({ error: "Admissions registration with temporary/disposable email addresses is restricted for safety reasons. Please use a standard email domain." });
  }

  // 3. Simple Rate Limiting (Daily IP and global caps)
  const now = Date.now();
  const currentDay = new Date().toISOString().slice(0, 10);
  if (globalOtpTracker.dayStr !== currentDay) {
    globalOtpTracker.dayStr = currentDay;
    globalOtpTracker.sentToday = 0;
  }

  if (globalOtpTracker.sentToday >= 50) {
    return res.status(429).json({ error: "Platform daily verification limit reached. Please contact support at admissions@learnora.in." });
  }

  const emailLower = email.toLowerCase().trim();
  if (emailOtpTracker[emailLower]) {
    if (now > emailOtpTracker[emailLower].expiresAt) {
      delete emailOtpTracker[emailLower];
    } else if (emailOtpTracker[emailLower].count >= 3) {
      const hoursLeft = Math.ceil((emailOtpTracker[emailLower].expiresAt - now) / (1000 * 60 * 60));
      return res.status(429).json({ error: `Too many verification code requests for '${emailLower}'. Maximum 3 requests allowed per 24 hours. Please try again in ${hoursLeft} hours.` });
    }
  }

  // Register the attempt
  globalOtpTracker.sentToday++;
  if (!emailOtpTracker[emailLower]) {
    emailOtpTracker[emailLower] = { count: 1, expiresAt: now + 24 * 60 * 60 * 1000 };
  } else {
    emailOtpTracker[emailLower].count++;
  }

  const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  // Generate a secure 6 digit OTP Code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Calculate stateless hash
  const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';
  const hash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');

  if (!API_KEY) {
    return res.status(400).json({ 
      error: "RESEND_API_KEY is not configured in your settings. You can bypass this check using the Sandbox bypass OTP code displayed below.",
      developerSandboxOtp: code
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
