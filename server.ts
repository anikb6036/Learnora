import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory store for OTPs (In production, use Redis or a DB)
const otpStore: Record<string, { code: string, expiresAt: number, attempts: number, lastSentAt: number }> = {};

const cleanEnv = (val: string | undefined): string => {
  if (!val) return "";
  return val.trim().replace(/^['"]|['"]$/g, "").trim();
};

const isPublicEmailDomain = (email: string): boolean => {
  const lowercase = email.toLowerCase().trim();
  const publicDomains = [
    'gmail.com', 'yahoo.', 'hotmail.', 'outlook.', 'aol.com', 'icloud.com', 
    'msn.com', 'live.com', 'mail.ru', 'yandex.', 'zoho.', 'protonmail.', 'proton.me'
  ];
  return publicDomains.some(domain => lowercase.includes(domain));
};

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const now = Date.now();
    if (otpStore[email] && (now - otpStore[email].lastSentAt < 60000)) {
       // Just to prevent spam, memory store is okay for throttle
      return res.status(400).json({ error: "Please wait 60 seconds before requesting a new OTP." });
    }

    const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!API_KEY) {
      // Allow testing without API key by returning an error message that instructs the user.
      return res.status(500).json({ 
        error: "RESEND_API_KEY is not configured. Please add it in your AI Studio settings (Secrets panel) to enable real email sending." 
      });
    }

    const resend = new Resend(API_KEY);
    
    // Generate a secure 6 digit OTP Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store temporarily for throttle
    otpStore[email] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    };

    // Calculate stateless hash
    const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';
    import('crypto').then(crypto => {
      const hash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');

      const fromAddress = 'Learnora Admissions <admissions@learnora.in>';
      let finalFrom = fromAddress;
      let fallbackAttempted = false;

      (async () => {
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
               html: `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;"><h2>Learnora Admissions</h2><p>Your one-time verification code is:</p><h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${code}</h1></div>`
             });
          }

          if (resendResult.error) {
            console.error("Resend API Error details:", JSON.stringify(resendResult.error, null, 2));
            const friendlyMessage = getFriendlyResendError(resendResult.error, email);
            return res.status(500).json({ error: friendlyMessage, developerSandboxOtp: code, hash });
          }

          res.status(200).json({ success: true, message: "OTP sent successfully", hash });
        } catch (err: any) {
          console.error("Exception caught in send-otp:", err);
          const friendlyMessage = getFriendlyResendError(err, email);
          res.status(500).json({ error: friendlyMessage, developerSandboxOtp: code, hash });
        }
      })();
    });
  });

  app.post("/api/verify-otp", async (req, res) => {
    const { email, code, hash } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }

    if (hash) {
       // Stateless verification
       const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';
       const crypto = await import('crypto');
       const validHash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');
       if (validHash === hash) {
          return res.status(200).json({ success: true, message: "Email successfully verified." });
       } else {
          return res.status(400).json({ error: "Invalid OTP code." });
       }
    } else {
       // Fallback to memory store if hash not provided (legacy)
      const storedOtp = otpStore[email];
      if (!storedOtp) {
        return res.status(400).json({ error: "No OTP found for this email. Please request a new one." });
      }

      if (Date.now() > storedOtp.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }

      if (storedOtp.code !== code) {
        storedOtp.attempts = (storedOtp.attempts || 0) + 1;
        if (storedOtp.attempts >= 3) {
          delete otpStore[email];
          return res.status(400).json({ error: "Maximum attempts reached. please wait 60 seconds and request a new one." });
        }
        return res.status(400).json({ error: `Invalid OTP code. ${3 - storedOtp.attempts} attempts remaining.` });
      }

      // Success! Clear the OTP.
      delete otpStore[email];
      res.status(200).json({ success: true, message: "Email successfully verified." });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const { email, subject, text, html } = req.body;
    
    if (!email || !subject || (!text && !html)) {
      return res.status(400).json({ error: "Email, subject, and body (text or html) are required." });
    }

    const API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ 
        error: "RESEND_API_KEY is not configured. Email could not be sent." 
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
            to: [email],
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In Express v4 we use * instead of *all
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
