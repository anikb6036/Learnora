import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory store for OTPs (In production, use Redis or a DB)
const otpStore: Record<string, { code: string, expiresAt: number }> = {};

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
    
    // Store code to verify later (valid for 10 minutes)
    otpStore[email] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    // Make Sender completely configurable so users with verified Resend domains can send to any student address
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    const senderName = process.env.SENDER_NAME || 'Learnora Admissions';
    const fromAddress = `${senderName} <${senderEmail}>`;

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: email,
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

      if (error) {
         console.error("Resend API Error:", error);
         
         const errorMsg = error.message || "";
         const isRestriction = error.name === "validation_error" ||
                               errorMsg.includes("testing emails") || 
                               errorMsg.includes("own email address") ||
                               errorMsg.includes("resend.com/domains");
         
         if (isRestriction) {
           console.log(`[Developer Bypass] Resend API restriction detected. Direct OTP: ${code} for email: ${email}`);
           return res.status(200).json({ 
             success: true, 
             message: "OTP generated", 
             restricted: true,
             errorDetails: errorMsg,
             debugOtp: code 
           });
         }
         return res.status(500).json({ error: errorMsg || "Failed to send OTP via email provider." });
      }

      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (err: any) {
       console.error("Failed to send OTP:", err);
       const errMsg = err.message || "";
       const isRestriction = err.name === "validation_error" ||
                             errMsg.includes("testing emails") || 
                             errMsg.includes("own email address") ||
                             errMsg.includes("resend.com/domains");

       if (isRestriction) {
         console.log(`[Developer Bypass] Resend catch restriction detected. Direct OTP: ${code} for email: ${email}`);
         return res.status(200).json({ 
           success: true, 
           message: "OTP generated", 
           restricted: true,
           errorDetails: errMsg,
           debugOtp: code 
         });
       }
       res.status(500).json({ error: "Failed to send OTP via email provider. Please try again." });
    }
  });

  app.post("/api/verify-otp", (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required." });
    }

    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json({ error: "No OTP found for this email. Please request a new one." });
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (storedOtp.code !== code) {
      return res.status(400).json({ error: "Invalid OTP code." });
    }

    // Success! Clear the OTP.
    delete otpStore[email];
    res.status(200).json({ success: true, message: "Email successfully verified." });
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
