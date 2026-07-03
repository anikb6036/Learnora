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

// Comprehensive rate limiting structures to stop attackers in serverless context
const globalEmailTracker = {
  dayStr: new Date().toISOString().slice(0, 10),
  sentToday: 0,
  sentThisHour: 0,
  hourStr: new Date().toISOString().slice(0, 13)
};

const ipEmailTracker: Record<string, { count: number; expiresAt: number }> = {};
const recipientEmailTracker: Record<string, { count: number; expiresAt: number }> = {};

const checkAndRegisterEmailDispatch = (ip: string, email: string): { allowed: boolean; reason?: string } => {
  const now = Date.now();
  const currentDay = new Date().toISOString().slice(0, 10);
  const currentHour = new Date().toISOString().slice(0, 13);
  
  // 1. Reset/check Global day limit
  if (globalEmailTracker.dayStr !== currentDay) {
    globalEmailTracker.dayStr = currentDay;
    globalEmailTracker.sentToday = 0;
  }
  // Reset/check Global hour limit
  if (globalEmailTracker.hourStr !== currentHour) {
    globalEmailTracker.hourStr = currentHour;
    globalEmailTracker.sentThisHour = 0;
  }
  
  // 2. Global Safety Thresholds (Generous for real users, strict to stop script attacks)
  const GLOBAL_HOURLY_LIMIT = 20;
  const GLOBAL_DAILY_LIMIT = 80;
  
  if (globalEmailTracker.sentThisHour >= GLOBAL_HOURLY_LIMIT) {
    return { allowed: false, reason: "The email dispatch system is experiencing high traffic. Please try again in an hour." };
  }
  if (globalEmailTracker.sentToday >= GLOBAL_DAILY_LIMIT) {
    return { allowed: false, reason: "Daily institutional email sending quota reached. Please retry tomorrow." };
  }
  
  // 3. Check IP Limit (max 10 per 24 hours for email dispatches)
  if (ipEmailTracker[ip]) {
    if (now > ipEmailTracker[ip].expiresAt) {
      delete ipEmailTracker[ip];
    } else if (ipEmailTracker[ip].count >= 10) {
      const hoursLeft = Math.ceil((ipEmailTracker[ip].expiresAt - now) / (1000 * 60 * 60));
      return { allowed: false, reason: `Security restriction: Too many email dispatches from your connection. Please retry in ${hoursLeft} hours.` };
    }
  }
  
  // 4. Check Recipient Limit (max 5 per 24 hours per recipient email)
  const emailLower = email.toLowerCase().trim();
  if (recipientEmailTracker[emailLower]) {
    if (now > recipientEmailTracker[emailLower].expiresAt) {
      delete recipientEmailTracker[emailLower];
    } else if (recipientEmailTracker[emailLower].count >= 5) {
      const hoursLeft = Math.ceil((recipientEmailTracker[emailLower].expiresAt - now) / (1000 * 60 * 60));
      return { allowed: false, reason: `Rate limit: Too many emails dispatched to '${emailLower}'. Please retry in ${hoursLeft} hours.` };
    }
  }
  
  // If allowed, increment trackers
  globalEmailTracker.sentToday++;
  globalEmailTracker.sentThisHour++;
  
  if (!ipEmailTracker[ip]) {
    ipEmailTracker[ip] = { count: 1, expiresAt: now + 24 * 60 * 60 * 1000 };
  } else {
    ipEmailTracker[ip].count++;
  }
  
  if (!recipientEmailTracker[emailLower]) {
    recipientEmailTracker[emailLower] = { count: 1, expiresAt: now + 24 * 60 * 60 * 1000 };
  } else {
    recipientEmailTracker[emailLower].count++;
  }
  
  return { allowed: true };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, text, html, challengeToken, challengeAnswer, secondaryEmail } = req.body;
  
  // 1. Honeypot check to block automated script spam
  if (secondaryEmail) {
    console.warn(`[Honeypot Triggered] Blocked bot email dispatch attempt from IP filling secondaryEmail.`);
    return res.status(400).json({ error: "Access denied. Automated submission detected." });
  }

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: "missing recipient(to), subject, and body (text or html)." });
  }

  const email = to;

  // 2. Enforce Human Verification Challenge
  if (!challengeToken || !challengeAnswer) {
    return res.status(400).json({ error: "Human verification challenge response is missing. Please solve the puzzle." });
  }

  try {
    const parts = challengeToken.split('_');
    if (parts.length !== 3) {
      return res.status(400).json({ error: "Invalid verification token." });
    }

    const [expiresAtStr, salt, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return res.status(400).json({ error: "Verification challenge expired. Please retry." });
    }

    const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'learnora_secure_challenge_salt';
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHash('sha256').update(challengeAnswer.trim().toLowerCase() + expiresAtStr + salt + SECRET).digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Incorrect human verification answer. Please try again." });
    }
  } catch (err) {
    console.error("Challenge verification error in send-email:", err);
    return res.status(500).json({ error: "Human verification failed. Security verification system error." });
  }

  // 3. Multi-tier sliding window rate limits (IP limit, recipient limit, and global caps)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : req.socket.remoteAddress || req.ip;

  const trackingEmail = Array.isArray(email) ? email[0] : email;
  const rateLimitCheck = checkAndRegisterEmailDispatch(ip, trackingEmail);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ error: rateLimitCheck.reason });
  }

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
