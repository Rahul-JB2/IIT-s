import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI SDK per skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint to generate 10 JEE practice questions for chapter milestone
app.post('/api/quiz/generate', async (req, res) => {
  const { subject, chapterName, milestoneKey } = req.body;

  const milestoneDescriptions: Record<string, string> = {
    theory: 'Fundamental theory, core derivations, and direct conceptual comprehension',
    conclusion1Page: 'High-yield formula application, common traps, and reaction shortcuts',
    mathongo: 'Fast-paced JEE Main level concept builders and speed-accuracy drill',
    moduleEx2: 'Challenging coaching module exercise-2 problems (JEE Main to Advanced level)',
    eklavya: 'High-difficulty multi-concept JEE Advanced problems requiring deep reasoning',
    prevPartTest: 'Past test series questions and speed-under-pressure revision',
  };

  const focusDesc = milestoneDescriptions[milestoneKey] || 'Comprehensive JEE Practice';

  const prompt = `You are a premier BSEB Super-50 JEE Master Faculty for ${subject}.
Generate exactly 10 distinct, high-yield Multiple Choice Questions (MCQs) for the chapter: "${chapterName}".
Active milestone target: ${milestoneKey} (${focusDesc}).

Requirements:
1. Difficulty calibrated to JEE Main & Advanced standards for this chapter.
2. Each question must have 4 clear, plausible options (A, B, C, D).
3. Provide the single correct option ('A', 'B', 'C', or 'D').
4. Provide a step-by-step explanatory solution including key formulas and mistake traps.
5. Return ONLY a valid JSON object matching the exact structure below, without markdown formatting or code blocks:

{
  "questions": [
    {
      "id": 1,
      "question": "Question text...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Detailed step-by-step solution...",
      "difficulty": "Easy" | "Medium" | "Hard",
      "milestoneFocus": "${chapterName} • ${milestoneKey}"
    }
  ]
}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ questions: [] });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return res.json({ questions: parsed.questions });
    } else {
      return res.status(200).json({ questions: [] });
    }
  } catch (err) {
    console.warn('Gemini quiz generation encountered error, delegating to client fallback:', err);
    return res.status(200).json({ questions: [] });
  }
});

// API endpoint for Gemini Super-50 Voice & Text Assistant
app.post('/api/assistant/interact', async (req, res) => {
  const { message, context } = req.body;

  const prompt = `You are "Super-50 AI Guru" — the premier personal AI mentor for a BSEB Super-50 JEE Main & Advanced aspirant (acting just like the Gemini app on the student's phone).
The student is speaking or texting you in natural language (Hindi, English, or Hinglish).

STUDENT MESSAGE: "${message}"

CURRENT STUDENT CONTEXT:
- Current Date: ${context?.currentDate || '2026-09-27'}
- Upcoming Exam: ${JSON.stringify(context?.upcomingTest || {})}
- Today's PCM Goals: ${JSON.stringify(context?.todayGoals || [])}
- Overdue 1-Page Summary Violations: ${JSON.stringify(context?.overdueViolations || [])}
- Questions Solved Today: ${JSON.stringify(context?.dailyQuestions || {})}
- Hours Logged Today: ${context?.dailyHoursToday || 0}
- Relevant Chapters: ${JSON.stringify(context?.relevantChapters || [])}

YOUR TASKS:
1. Parse student's progress updates:
   - Identify which chapter they completed or studied from the chapter list (matching chapterId or chapter name).
   - Identify which milestone(s) they finished ('theory', 'conclusion1Page', 'mathongo', 'moduleEx2', 'eklavya', 'prevPartTest').
   - Extract study hours logged (e.g. "2 ghante padhe", "1.5 hours") and practice questions count (e.g. "25 questions maths ke", "40 chemistry").
   - Output structured "actions" to AUTO-MARK their progress in the app.
2. Tell them what is pending ("kon sa baki hai"):
   - Inspect their remaining daily goals and upcoming test syllabus milestones.
   - Tell them clearly what remains to be done today or before the next test.
3. Enforce the Punishment System ("task pura na karne par punishment activate kare"):
   - If they report they did theory but postponed the 1-page summary, or skipped today's mandatory practice quota, trigger punishment!
   - Explain that YouTube, Chrome, audio/video distractions are locked down until the 1-page summary is written.
   - If they completed the 1-page summary, release the punishment lockdown.
4. Always respond in warm, energetic, motivating BSEB Super-50 mentor Hindi/Hinglish (with English technical terms).

Return ONLY valid JSON matching this exact structure:
{
  "reply": "Conversational reply in Hindi/Hinglish...",
  "actions": [
    {
      "type": "MARK_MILESTONE",
      "chapterId": "chapterId",
      "chapterName": "chapterName",
      "milestones": ["theory", "conclusion1Page"],
      "status": true
    },
    {
      "type": "LOG_QUESTIONS",
      "subject": "Physics" | "Chemistry" | "Math",
      "count": 25
    },
    {
      "type": "LOG_HOURS",
      "hours": 2.0
    }
  ],
  "punishmentEvent": {
    "activate": false,
    "release": false,
    "reason": ""
  },
  "pendingSummary": [
    "Physics: Eklavya batch problems baki hai",
    "Chemistry: MathonGo 40 questions target baki hai"
  ]
}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ fallback: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (err) {
    console.warn('Gemini Assistant encountered error, delegating to client fallback:', err);
    return res.status(200).json({ fallback: true });
  }
});

// Full-stack Vite mounting
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JEE Super-50 full-stack server running on port ${PORT}`);
  });
}

startServer();
