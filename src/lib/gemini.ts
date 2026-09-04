// Resilient Gemini Client with Dual-Mode Support (Express Server Proxy + Direct API + Local Intelligent Fallback)
import { GoogleGenAI } from '@google/genai';

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

const DIRECT_MODEL_FALLBACKS = [
  'gemini-3.6-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

interface GeminiReflectionParams {
  messages: any[];
  entryContent: string;
  entryTitle?: string;
  mode?: string;
  customInstruction?: string;
}

interface GeminiSummaryParams {
  title?: string;
  entryContent: string;
  messages: any[];
}

export interface GeminiResponse {
  success: boolean;
  text: string;
  modelUsed?: string;
}

function getLocalFallbackResponse(mode = 'reflection', entryContent = ''): GeminiResponse {
  const snippet = entryContent.trim() ? entryContent.slice(0, 100) : 'your reflection';
  const tipText = "\n\n---\n*💡 Note: To enable live Gemini 3.6 Flash AI responses, add a free API key starting with AIzaSy... from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).*";

  if (mode === 'brainstorm') {
    return {
      success: true,
      modelUsed: 'local-reflection-partner',
      text: `✨ **Creative Ideation & Exploration**\n\nBased on your reflection: *"${snippet}..."*\n\n1. **Quick Win**: Identify 1 small action you can complete in the next 15 minutes.\n2. **Unconventional Perspective**: How would a mentor or friend approach this challenge from a fresh angle?\n3. **Long-Term Vision**: What possibilities open up 6 months from today if you take action now?${tipText}`,
    };
  } else if (mode === 'socratic') {
    return {
      success: true,
      modelUsed: 'local-reflection-partner',
      text: `🧠 **Socratic Inquiry**\n\n- What underlying belief or assumption is driving this thought?\n- How can you separate factual realities from subjective interpretations?\n- What would happen if you let go of expectations surrounding this situation?${tipText}`,
    };
  } else if (mode === 'action_plan') {
    return {
      success: true,
      modelUsed: 'local-reflection-partner',
      text: `🎯 **Pragmatic Action Micro-Habits**\n\n1. **Micro-Habit (10 mins)**: Write down the single smallest step you can complete today.\n2. **Contingency Strategy**: What potential friction or distraction might arise, and how will you handle it?\n3. **Momentum Check**: Celebrate taking this first intentional step.${tipText}`,
    };
  } else if (mode === 'summarize') {
    return {
      success: true,
      modelUsed: 'local-reflection-partner',
      text: `📋 **Reflection Synthesis**\n\n1. **Core Essence**: You are reflecting intentionally on top-of-mind thoughts and goals.\n2. **Emotional Tone & Themes**: Focused, contemplative, and committed to growth.\n3. **Key Realizations**: Journaling regularly brings clarity and emotional grounding.\n4. **Suggested Micro-Actions**: Revisit this entry tomorrow to track your progress.${tipText}`,
    };
  } else {
    return {
      success: true,
      modelUsed: 'local-reflection-partner',
      text: `🌿 **Deep Reflection Partner**\n\nThank you for sharing your thoughts. Expressing your experiences in writing is a powerful practice for emotional clarity.\n\n**Questions to Uncover Deeper Insight**:\n- What feeling or thought stands out to you most in this entry?\n- What is one priority or boundary you want to honor moving forward?${tipText}`,
    };
  }
}

// Client-side fallback generator using GoogleGenAI SDK or REST API
async function generateDirectGemini(
  systemInstruction: string,
  contents: any[],
  temperature = 0.7,
  mode = 'reflection',
  entryContent = ''
): Promise<GeminiResponse> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    return getLocalFallbackResponse(mode, entryContent);
  }

  // Try GoogleGenAI SDK first
  try {
    const ai = new GoogleGenAI({ apiKey });
    for (const modelName of DIRECT_MODEL_FALLBACKS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: temperature,
          },
        });
        const text = response.text || '';
        if (text.trim().length > 0) {
          return { success: true, text: text.trim(), modelUsed: modelName };
        }
      } catch (err: any) {
        console.warn(`[Direct Gemini] Model ${modelName} failed:`, err?.message || err);
      }
    }
  } catch (err) {
    console.warn('[Direct SDK Failed, attempting REST API fallback]:', err);
  }

  // Fallback to direct REST API calls
  for (const modelName of DIRECT_MODEL_FALLBACKS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: contents,
          generationConfig: { temperature },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText =
          data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (candidateText.trim().length > 0) {
          return { success: true, text: candidateText.trim(), modelUsed: modelName };
        }
      }
    } catch (err: any) {
      console.warn(`[REST Gemini] Model ${modelName} failed:`, err?.message || err);
    }
  }

  // Final graceful fallback if external network or API key is rejected
  return getLocalFallbackResponse(mode, entryContent);
}

// Main helper: Generate Multi-Turn Reflection
export async function requestGeminiReflection(params: GeminiReflectionParams): Promise<GeminiResponse> {
  const { messages, entryContent, entryTitle, mode = 'reflection', customInstruction } = params;

  // 1. Try Express server backend endpoint first
  try {
    const response = await fetch('/api/gemini/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const result = await response.json();
      if (result.success && result.text) {
        return {
          success: true,
          text: result.text,
          modelUsed: result.modelUsed || 'gemini-3.6-flash',
        };
      }
    }
  } catch (err) {
    console.warn('[Server Endpoint unavailable, switching to Direct Gemini client]:', err);
  }

  // 2. Fallback to Direct Gemini client API
  const selectedSystemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.reflection;
  const combinedSystemInstruction = customInstruction
    ? `${selectedSystemPrompt}\n\nUser Context/Custom Guidance: ${customInstruction}`
    : selectedSystemPrompt;

  const contents: any[] = [];

  if (entryContent && entryContent.trim().length > 0) {
    contents.push({
      role: 'user',
      parts: [{ text: `[Journal Entry Title: ${entryTitle || 'Untitled Reflection'}]\n\n[Journal Entry Text]:\n${entryContent.trim()}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: `Thank you for sharing your journal entry. I've read it carefully. What aspect would you like to explore first?` }],
    });
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (!msg) continue;
      const role = msg.role === 'user' ? 'user' : 'model';
      const text = typeof msg.parts === 'string'
        ? msg.parts
        : (msg.content || msg.text || (Array.isArray(msg.parts) ? msg.parts.map((p: any) => p?.text || p).join('\n') : ''));
      if (text && text.trim()) {
        contents.push({
          role,
          parts: [{ text: text.trim() }],
        });
      }
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Please provide a warm welcoming reflection prompt to help me start my daily journal.' }],
    });
  }

  return generateDirectGemini(combinedSystemInstruction, contents, 0.7, mode, entryContent);
}

// Main helper: Generate Session Summary
export async function requestGeminiSummary(params: GeminiSummaryParams): Promise<GeminiResponse> {
  const { title, entryContent, messages } = params;

  // 1. Try Express server backend endpoint first
  try {
    const response = await fetch('/api/gemini/summarize-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const result = await response.json();
      if (result.success && (result.summary || result.text)) {
        return {
          success: true,
          text: result.summary || result.text,
          modelUsed: result.modelUsed || 'gemini-3.6-flash',
        };
      }
    }
  } catch (err) {
    console.warn('[Server Summary Endpoint unavailable, switching to Direct Gemini client]:', err);
  }

  // 2. Fallback to Direct Gemini client API
  let conversationTranscript = `Title: ${title || 'Untitled'}\n\nOriginal Entry:\n${entryContent}\n\nReflection Conversation:\n`;
  if (Array.isArray(messages)) {
    for (const m of messages) {
      const sender = m.role === 'user' ? 'User' : 'Gemini';
      const text = typeof m.parts === 'string' ? m.parts : (m.content || m.text || '');
      conversationTranscript += `${sender}: ${text}\n`;
    }
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: `Please generate a comprehensive reflection synthesis from this journal session:\n\n${conversationTranscript}` }],
    },
  ];

  return generateDirectGemini(SYSTEM_PROMPTS.summarize, contents, 0.4, 'summarize', entryContent);
}
