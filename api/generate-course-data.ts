import { GoogleGenAI, Type } from "@google/genai";

const cleanEnv = (val: string | undefined): string => {
  if (!val) return "";
  return val.trim().replace(/^['"]|['"]$/g, "").trim();
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Exception caught in generate-course-data serverless handler:", err);
    return res.status(500).json({ error: err.message || "Failed to generate course roadmap using AI." });
  }
}
