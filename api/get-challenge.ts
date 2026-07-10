import crypto from 'crypto';

export const generateChallenge = () => {
  const isAddition = Math.random() < 0.5;
  if (isAddition) {
    const n1 = Math.floor(Math.random() * 9) + 1; // 1 to 9
    const n2 = Math.floor(Math.random() * 9) + 1; // 1 to 9
    return {
      text: `${n1} + ${n2}`,
      answer: (n1 + n2).toString()
    };
  } else {
    const n1 = Math.floor(Math.random() * 9) + 10; // 10 to 18
    const n2 = Math.floor(Math.random() * 9) + 1;  // 1 to 9
    return {
      text: `${n1} - ${n2}`,
      answer: (n1 - n2).toString()
    };
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const challenge = generateChallenge();
  const text = challenge.text;
  const answerStr = challenge.answer;

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
