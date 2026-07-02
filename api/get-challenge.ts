import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Generate a random simple math question
  const num1 = Math.floor(Math.random() * 12) + 5; // 5 to 16
  const num2 = Math.floor(Math.random() * 10) + 2; // 2 to 11
  const isPlus = Math.random() > 0.4; // 60% addition, 40% subtraction

  let text = "";
  let answer = 0;
  if (isPlus) {
    text = `${num1} + ${num2}`;
    answer = num1 + num2;
  } else {
    const max = Math.max(num1, num2);
    const min = Math.min(num1, num2);
    text = `${max} - ${min}`;
    answer = max - min;
  }

  const answerStr = answer.toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const salt = Math.random().toString(36).substring(2, 10);

  // Cryptographically sign the answer
  const SECRET = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || 'learnora_secure_challenge_salt';
  const signature = crypto.createHash('sha256').update(answerStr + expiresAt + salt + SECRET).digest('hex');

  // Token format: expiresAt_salt_signature
  const challengeToken = `${expiresAt}_${salt}_${signature}`;

  return res.status(200).json({
    challengeText: text,
    challengeToken: challengeToken
  });
}
