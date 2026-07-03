import crypto from 'crypto';

export const generateChallenge = () => {
  const choice = Math.floor(Math.random() * 4);
  
  if (choice === 0) {
    // Word-based addition
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const n1 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    return {
      text: `What is ${words[n1]} plus ${words[n2]}?`,
      answer: (n1 + n2).toString()
    };
  } else if (choice === 1) {
    // Word-based subtraction
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"];
    const n1 = Math.floor(Math.random() * 6) + 10; // 10 to 15
    const n2 = Math.floor(Math.random() * 8) + 1;  // 1 to 8
    return {
      text: `What is ${words[n1]} minus ${words[n2]}?`,
      answer: (n1 - n2).toString()
    };
  } else if (choice === 2) {
    // Word length questions
    const pool = ["apple", "banana", "grape", "cherry", "melon", "lemon", "peach", "mango", "berry", "orange"];
    const word = pool[Math.floor(Math.random() * pool.length)];
    return {
      text: `How many letters are in the word '${word}'?`,
      answer: word.length.toString()
    };
  } else {
    // Text logic/trivia pool
    const trivia = [
      { q: "How many legs does a spider have?", a: "8" },
      { q: "How many wheels does a standard bicycle have?", a: "2" },
      { q: "How many months are in a year?", a: "12" },
      { q: "How many days are in a week?", a: "7" },
      { q: "How many corners does a standard triangle have?", a: "3" },
      { q: "How many corners does a standard rectangle have?", a: "4" },
      { q: "If you have three apples and eat one, how many are left?", a: "2" },
      { q: "What is the double of eight?", a: "16" },
      { q: "What is the double of five?", a: "10" }
    ];
    const picked = trivia[Math.floor(Math.random() * trivia.length)];
    return {
      text: picked.q,
      answer: picked.a
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
