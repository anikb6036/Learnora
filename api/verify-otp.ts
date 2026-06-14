import crypto from 'crypto';

const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'default_secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email, code, hash } = req.body;
  if (!email || !code || !hash) {
    return res.status(400).json({ error: "Email, code, and hash are required" });
  }

  const validHash = crypto.createHash('sha256').update(email + code + SECRET).digest('hex');
  if (validHash === hash) {
    return res.json({ success: true, message: "OTP verified" });
  } else {
    return res.status(400).json({ error: "Invalid OTP code" });
  }
}
