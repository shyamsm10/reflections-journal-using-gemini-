import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialization of Gemini API Client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface ContentPart {
  text: string;
}

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  parts: ContentPart[] | string;
}

async function generateContentWithFallback(
  systemInstruction: string,
  contents: any[],
  temperature = 0.7
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: temperature,
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          text: responseText,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next fallback model
    }
  }

  throw new Error(
    `All Gemini fallback models exhausted. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

// System Prompts for Different Reflection Modes
const SYSTEM_PROMPTS: Record<string, string> = {
  reflection: `You are an empathetic, insightful, and supportive AI Reflection Partner for a personal journal application.
Your role is to help the user reflect deeply on their thoughts, emotions, and daily experiences.
- Acknowledge and validate their emotional state with warmth and psychological safety.
- Highlight key patterns, insights, or subtle connections in their writing.
- Offer 1-2 thoughtful open-ended reflection questions to help them uncover deeper self-awareness.
- Keep your tone calm, grounded, respectful, and articulate. Format response with clear paragraphs, subtle emphasis, and bullet points where helpful.`,

  brainstorm: `You are a creative, expansive Brainstorming & Ideation Partner for a personal reflection journal.
Your role is to help the user generate new ideas, explore creative angles, and turn ambiguous thoughts into possibilities.
- Explore 3-5 distinct creative angles or solutions based on the user's reflection.
- Categorize ideas clearly (e.g. Quick Wins, Unconventional Approaches, Long-Term Visions).
- Encourage curiosity without judgment.
- Provide actionable starting points for further exploration.`,

  summarize: `You are a structured, analytical Synthesis Assistant for personal journaling.
Your role is to distill the user's journal entry and multi-turn reflections into a cohesive summary.
Please structure your response cleanly:
1. **Core Essence**: A 2-3 sentence overview of what is top of mind.
2. **Emotional Tone & Themes**: Key underlying sentiments and recurrent themes identified.
3. **Key Insights & Realizations**: The most valuable thoughts uncovered during this session.
4. **Suggested Micro-Actions**: 2-3 realistic, gentle next steps or reflection practices.`,

  socratic: `You are a Socratic Guide for a personal philosophical and self-growth journal.
Your role is to gently challenge cognitive biases, unexamined assumptions, and help the user clarify their thinking.
- Ask probing, clarifying questions that encourage rigorous reflection.
- Help distinguish between factual realities vs subjective interpretations.
- Maintain an encouraging, non-confrontational, and respectful posture.`,

  action_plan: `You are a pragmatic, supportive Productivity & Habit Coach.
Your role is to convert reflections and journal thoughts into clear, manageable action steps.
- Break down challenges into low-friction 10-minute micro-habits.
- Identify potential obstacles and propose supportive contingency strategies.
- Maintain a compassionate, realistic, and motivating approach.`,
};

// API: Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: Gemini Reflection & Dialogue Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const {
      messages = [],
      entryContent = '',
      mode = 'reflection',
      entryTitle = '',
      customInstruction = '',
    } = data;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const selectedSystemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.reflection;
    const combinedSystemInstruction = customInstruction
      ? `${selectedSystemPrompt}\n\nUser Context/Custom Guidance: ${customInstruction}`
      : selectedSystemPrompt;

    // Build structured conversation contents for Gemini
    const contents: any[] = [];

    // If there's root journal entry context, add it as initial user context
    if (entryContent && typeof entryContent === 'string' && entryContent.trim().length > 0) {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `[Journal Entry Title: ${entryTitle || 'Untitled Reflection'}]\n\n[Journal Entry Text]:\n${entryContent.trim()}`,
          },
        ],
      });
      contents.push({
        role: 'model',
        parts: [
          {
            text: `Thank you for sharing your journal entry on "${entryTitle || 'your reflection'}". I've read it with care and am ready to reflect, brainstorm, or converse with you. What aspect would you like to explore first?`,
          },
        ],
      });
    }

    // Append multi-turn conversation messages
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (!msg || typeof msg !== 'object') continue;
        const role = msg.role === 'user' ? 'user' : 'model';
        let textContent = '';
        if (typeof msg.parts === 'string') {
          textContent = msg.parts;
        } else if (Array.isArray(msg.parts)) {
          textContent = msg.parts.map((p: any) => (typeof p === 'string' ? p : p?.text || '')).join('\n');
        } else if (typeof msg.content === 'string') {
          textContent = msg.content;
        } else if (typeof msg.text === 'string') {
          textContent = msg.text;
        }

        if (textContent.trim()) {
          contents.push({
            role: role,
            parts: [{ text: textContent.trim() }],
          });
        }
      }
    }

    // If contents array is still empty, add a default prompt based on mode
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `Please provide a warm welcoming reflection prompt to help me start my daily journal.`,
          },
        ],
      });
    }

    // Call Gemini with the fallback ladder
    const result = await generateContentWithFallback(combinedSystemInstruction, contents);

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/gemini/reflect Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini AI',
    });
  }
});

// API: Quick Session Summary Generator
app.post('/api/gemini/summarize-session', async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const { title = '', entryContent = '', messages = [] } = data;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    let conversationTranscript = `Title: ${title || 'Untitled'}\n\nOriginal Entry:\n${entryContent}\n\nReflection Conversation:\n`;
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const sender = m.role === 'user' ? 'User' : 'Gemini';
        const text = typeof m.parts === 'string' ? m.parts : (m.parts?.[0]?.text || m.content || m.text || '');
        conversationTranscript += `${sender}: ${text}\n`;
      }
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Please generate a comprehensive reflection synthesis from this journal session:\n\n${conversationTranscript}`,
          },
        ],
      },
    ];

    const result = await generateContentWithFallback(SYSTEM_PROMPTS.summarize, contents, 0.4);

    return res.json({
      success: true,
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API /api/gemini/summarize-session Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize journal session summary',
    });
  }
});

// Vite Middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
