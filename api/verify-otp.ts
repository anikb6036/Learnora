import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, code, hash } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  if (hash) {
    // Stateless verification
    const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';
    const validHash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');
    
    if (validHash === hash) {
      return res.status(200).json({ success: true, message: "Email successfully verified." });
    } else {
      return res.status(400).json({ error: "Invalid OTP code." });
    }
  } else {
    return res.status(400).json({ error: "Session mismatch. Please request a new OTP code." });
  }
}
