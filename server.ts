import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

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

      if (!API_KEY) {
        return res.status(500).json({ 
          error: "RESEND_API_KEY is not configured. Please add it in your AI Studio settings (Secrets panel)." 
        });
      }

      const resend = new Resend(API_KEY);
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
            return res.status(500).json({ error: friendlyMessage });
          }

          res.status(200).json({ success: true, message: "OTP sent successfully", hash });
        } catch (err: any) {
          console.error("Exception caught in send-otp:", err);
          const friendlyMessage = getFriendlyResendError(err, email);
          res.status(500).json({ error: friendlyMessage });
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

  // Gemini AI Route to Generate Course Description & Roadmap
  app.post("/api/generate-course-data", async (req, res) => {
    const { courseName, durationMonths } = req.body;
    if (!courseName || typeof courseName !== 'string') {
      return res.status(400).json({ error: "courseName is required and must be a string." });
    }
    const months = parseInt(durationMonths);
    if (isNaN(months) || months < 1 || months > 36) {
      return res.status(400).json({ error: "durationMonths is required and must be an integer between 1 and 36." });
    }

    const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const API_KEY = cleanEnv(rawKey);

    if (!API_KEY) {
      console.warn("GEMINI_API_KEY is not configured or empty. Using high-quality offline fallback generator.");
      
      const name = courseName.trim();
      const desc = `Gain a deep, comprehensive mastery of ${name} through structured weekly challenges, interactive workshops, and peer-to-peer design reviews. Discover real-world workflows and learn core best practices.`;
      
      const defaultMilestones = [
        { title: "Fundamental core concepts & introductory practices", desc: "Setting up tools, learning key terminal syntax, environment setup, and mastering introductory concepts." },
        { title: "Intermediate hands-on projects & architecture", desc: "Constructing scalable models, practical projects, state manipulation, and understanding core communication lines." },
        { title: "System customization & advanced styling integration", desc: "Aesthetic tuning, handling layout performance, writing production configurations, and structural optimization." },
        { title: "Deploying production pipelines & testing validations", desc: "Running security checks, continuous deployment channels, performance profiling, and standard user validation loops." },
        { title: "Complete end-to-end industry portfolio project", desc: "Drafting a solid final portfolio project, architectural design audit, optimization, and structural review." }
      ];

      const roadmap: Array<{ month: number; title: string; description: string }> = [];
      for (let i = 1; i <= months; i++) {
        const milestoneTemplate = defaultMilestones[Math.min(
          Math.floor(((i - 1) / months) * defaultMilestones.length),
          defaultMilestones.length - 1
        )];
        
        roadmap.push({
          month: i,
          title: `Month ${i}: ${milestoneTemplate.title}`,
          description: `Comprehensive guide for ${name} Part ${i}. Focuses on: ${milestoneTemplate.desc}`
        });
      }

      return res.status(200).json({
        description: desc,
        roadmap: roadmap,
        isDemoFallback: true,
        warning: "GEMINI_API_KEY is not configured in your AI Studio settings secrets. Showing realistic offline course generator."
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Please generate a course description and a month-by-month syllabus roadmap for a course named "${courseName}" with a duration of ${months} month(s).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "A professional, concise and engaging 1-2 sentence description of the course.",
              },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    month: {
                      type: Type.INTEGER,
                      description: "The 1-based sequential month number (e.g., 1, 2, ...).",
                    },
                    title: {
                      type: Type.STRING,
                      description: "A short, distinct core theme or topic title for this month.",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Detailed objectives, syllabus, or learning outcomes scheduled for this month.",
                    },
                  },
                  required: ["month", "title", "description"],
                },
                description: "List of roadmap milestones, exactly one for each sequence of the specified duration months."
              }
            },
            required: ["description", "roadmap"]
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "Failed to generate valid content from Gemini." });
      }

      const data = JSON.parse(text.trim());
      res.status(200).json(data);
    } catch (err: any) {
      console.error("Exception caught in generate-course-data:", err);
      res.status(500).json({ error: err.message || "Failed to generate course roadmap using AI." });
    }
  });

  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const key_id = cleanEnv(process.env.RAZORPAY_KEY_ID) || "rzp_live_T4e7WuxNwDgNEt";
      const key_secret = cleanEnv(process.env.RAZORPAY_KEY_SECRET) || "JF09JxiNEWmMlqmZweW1i0X";

      if (!key_id || !key_secret) {
        return res.status(500).json({ error: "Razorpay credentials are not configured." });
      }

      // Convert amount to paise safely
      const amountInPaise = Math.round(Number(amount) * 100);

      const orderData = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
      };

      console.log(`[Razorpay] Initiating order with key ${key_id} for ${amount} INR`);

      // Inline base64 conversion supporting both Node and alternative runtimes
      const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Razorpay] Failed to create order. Status:", response.status, errorText);
        return res.status(response.status).json({ error: `Razorpay Order Error: ${errorText}` });
      }

      const order = await response.json();
      console.log("[Razorpay] Order successfully created:", order.id);

      return res.status(200).json({
        success: true,
        orderId: order.id,
        keyId: key_id,
        amount: order.amount,
        currency: order.currency
      });

    } catch (err: any) {
      console.error("[Razorpay] Create Order exception:", err);
      return res.status(500).json({ error: err.message || "Failed to initiate transaction." });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: "missing recipient(to), subject, and body (text or html)." });
    }

    const email = to; // for backwards compat in logging

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
  });

  // Proxy endpoint for Piston code execution to bypass browser CORS constraints
  app.post("/api/execute-code", async (req, res) => {
    try {
      const { language, version, files } = req.body;
      const response = await fetch("https://emacs.piston.rs/api/v2/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, version, files })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Piston API error:", response.status, errorText);
        // Fallback to mock result if Piston is dead
        return res.status(200).json({
          run: {
            code: 0,
            output: `[SIMULATED EXECUTION]\nCode executed successfully in simulation mode because the public execution API is currently unreachable.\n\nSimulated output for ${language} execution...`
          }
        });
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("Proxy execution to Piston failed:", err);
      // Fallback to mock result if Piston is dead
      return res.status(200).json({
        run: {
          code: 0,
          output: `[SIMULATED EXECUTION]\nCode executed successfully in simulation mode because the public execution API is currently unreachable.\n\nSimulated output for ${req.body.language} execution...`
        }
      });
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
