import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = Number(process.env.PORT) || 3000;

// Gemini Client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: Generate authentic BCS Preliminary questions
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const { subject, count = 10, language = 'bn', topic } = req.body;
    const requestedCount = Math.min(Math.max(Number(count) || 5, 1), 25);

    const prompt = `You are an expert question maker and former examiner for Bangladesh Civil Service (BCS) Preliminary Examination conducted by BPSC (Bangladesh Public Service Commission).
Generate ${requestedCount} high-quality, authentic, and fact-checked multiple-choice questions (MCQs) suitable for BCS Preliminary examination.
${subject ? `Specific BCS Subject: "${subject}".` : 'Subject: Balanced mix of BCS subjects (Bangla, English, Bangladesh Affairs, International Affairs, General Science, Computer & IT, Math, Mental Ability, Ethics & Good Governance).'}
${topic ? `Focus Topic: "${topic}".` : ''}
Language: ${language === 'en' ? 'English (with Bengali context where applicable)' : 'Bengali (বাংলা)'}.

STRICT ACCURACY RULES:
1. Every question must have exactly 4 plausible, unambiguous options (A, B, C, D / ক, খ, গ, ঘ).
2. The correct answer index (0, 1, 2, or 3) MUST be mathematically and factually indisputable.
3. If not 100% certain of any fact, do NOT include that question. Accuracy is paramount for BCS aspirants.
4. Provide a clear, educational explanation (ব্যাখ্যা) explaining why the answer is correct and why common distractors are incorrect.
5. Provide a credible reference/source (তথ্যসূত্র), such as official BPSC past questions, NCTB textbooks, Bangladesh Constitution, Banglapedia, or reputable standard BCS reference books.
6. Provide an internal difficulty rating ('easy', 'medium', or 'hard') so tests can balance variety internally, even though difficulty labels will not be displayed to candidates.

Return a JSON array of objects conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of BCS MCQ questions',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique question ID' },
              question: { type: Type.STRING, description: 'The question text' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of exactly 4 options',
              },
              correctAnswer: {
                type: Type.INTEGER,
                description: 'Index of correct option (0 to 3)',
              },
              subject: { type: Type.STRING, description: 'BCS subject name' },
              topic: { type: Type.STRING, description: 'Specific topic name' },
              difficulty: {
                type: Type.STRING,
                description: 'Internal difficulty: easy, medium, or hard',
              },
              explanation: {
                type: Type.STRING,
                description: 'Detailed explanation for the answer',
              },
              reference: {
                type: Type.STRING,
                description: 'Authentic source or reference citation',
              },
            },
            required: [
              'question',
              'options',
              'correctAnswer',
              'subject',
              'explanation',
              'reference',
            ],
          },
        },
      },
    });

    const text = response.text || '[]';
    const questions = JSON.parse(text);

    // Ensure generated questions have IDs and sanitized properties
    const formatted = questions.map((q: any, idx: number) => ({
      id: q.id || `ai_gen_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      question: q.question,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['ক', 'খ', 'গ', 'ঘ'],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
      subject: q.subject || subject || 'সাধারণ জ্ঞান',
      topic: q.topic || 'বিসিএস প্রিলিমিনারি প্রস্তুতি',
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation || 'সঠিক উত্তর যাচাইকৃত।',
      reference: q.reference || 'বিসিএস সিলেবাস ও প্রমিত তথ্যসূত্র',
      isAiGenerated: true,
    }));

    return res.json({ success: true, count: formatted.length, questions: formatted });
  } catch (error: any) {
    console.error('Error generating BCS questions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate questions via Gemini',
    });
  }
});

// API Route: Dynamic AI Exam Analysis & Personalized Study Roadmap
app.post('/api/gemini/analyze-result', async (req, res) => {
  try {
    const { result, language = 'bn' } = req.body;
    if (!result) {
      return res.status(400).json({ success: false, error: 'Result payload missing' });
    }

    const prompt = `You are a legendary Bangladesh Civil Service (BCS) cadre mentor and exam strategist.
Analyze the following BCS preliminary mock test result of candidate "${result.candidateName || 'Candidate'}":
Total Questions: ${result.totalQuestions}
Total Marks Achieved: ${result.totalMarks} / ${result.totalQuestions}
Percentage: ${result.percentage}%
Correct: ${result.correctCount}
Wrong: ${result.incorrectCount} (Negative Penalty: -${result.negativePenalty})
Skipped: ${result.skippedCount}
Time Taken: ${Math.round(result.timeSpentSeconds / 60)} minutes

Subject Breakdown:
${JSON.stringify(result.subjectBreakdown, null, 2)}

Provide a deeply analytical, motivating, and actionable review in ${language === 'en' ? 'English' : 'Bengali (বাংলা)'}.
Evaluate:
1. "summary": A clear 2-3 sentence executive assessment of their performance level, readiness, and accuracy.
2. "readinessScore": An estimated BCS Preliminary cutoff readiness percentage (0 to 100).
3. "readinessGrade": A title such as "Excellent Prospect", "Solid Contender", "Needs Focused Revision", or "Foundation Building".
4. "strengths": 2-3 specific subject strengths they demonstrated.
5. "criticalGaps": 2-3 vulnerable areas that cost them negative marks.
6. "strategicTips": 3 key tactical tips for eliminating negative marking and better time management.
7. "revisionRoadmap": A structured 7-day high-yield study plan (Day 1 to Day 7) focusing on their weakest subjects.

Return a JSON object conforming to the schema.`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            readinessScore: { type: Type.NUMBER },
            readinessGrade: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategicTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            revisionRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  action: { type: Type.STRING },
                },
                required: ['day', 'subject', 'focus', 'action'],
              },
            },
          },
          required: ['summary', 'readinessScore', 'readinessGrade', 'strengths', 'criticalGaps', 'strategicTips', 'revisionRoadmap'],
        },
      },
    });

    const analysis = JSON.parse(aiRes.text || '{}');
    return res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI analysis',
    });
  }
});


// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
