import { ModeConfig, ReflectionMode, JournalMood } from '../types';

export const REFLECTION_MODES: ModeConfig[] = [
  {
    id: 'reflection',
    name: 'Deep Reflection',
    description: 'Empathetic listening, exploring feelings, and discovering personal insights.',
    iconName: 'Sparkles',
    promptPlaceholder: 'Reflect on what happened today, what resonated with you, or how you feel...',
    suggestionChips: [
      'What core lesson is hidden here?',
      'How can I view this with more self-compassion?',
      'What emotional pattern is repeating?',
      'What would my wisest self advise me to do?'
    ]
  },
  {
    id: 'brainstorm',
    name: 'Creative Brainstorming',
    description: 'Expanding possibilities, generating fresh ideas, and creative problem-solving.',
    iconName: 'Lightbulb',
    promptPlaceholder: 'Describe a challenge, creative project, or aspiration you want to brainstorm...',
    suggestionChips: [
      'Give me 5 unconventional angles on this',
      'What are 3 quick wins I could test today?',
      'How would an innovator approach this challenge?',
      'What assumptions am I making that I could break?'
    ]
  },
  {
    id: 'summarize',
    name: 'Synthesis & Insights',
    description: 'Structured distillation of core themes, key takeaways, and emotional currents.',
    iconName: 'FileText',
    promptPlaceholder: 'Write or paste your thoughts and let Gemini synthesize the essence...',
    suggestionChips: [
      'Synthesize this into 3 key takeaways',
      'What underlying emotional themes stand out?',
      'Summarize this into a clear 30-second brief',
      'Highlight the key decisions I need to make'
    ]
  },
  {
    id: 'socratic',
    name: 'Socratic Inquiry',
    description: 'Thought-provoking questions to challenge assumptions and sharpen clarity.',
    iconName: 'Compass',
    promptPlaceholder: 'Examine a belief, difficult dilemma, or complex decision on your mind...',
    suggestionChips: [
      'What assumptions am I taking for granted?',
      'What evidence exists against my current view?',
      'What is the worst case, and how would I handle it?',
      'How will this matter 5 years from now?'
    ]
  },
  {
    id: 'action_plan',
    name: 'Action & Clarity',
    description: 'Transforming reflections into low-friction micro-habits and tangible next steps.',
    iconName: 'CheckCircle2',
    promptPlaceholder: 'What intention or habit do you want to break down into actionable steps?...',
    suggestionChips: [
      'Break this into 3 micro-steps under 5 minutes',
      'What potential obstacle will arise and how do I bypass it?',
      'What is the single highest-leverage action right now?',
      'Draft a gentle schedule for tomorrow'
    ]
  }
];

export const JOURNAL_MOODS: { id: JournalMood; label: string; emoji: string; color: string }[] = [
  { id: 'calm', label: 'Calm', emoji: '🌿', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🤔', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'optimistic', label: 'Optimistic', emoji: '✨', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'energized', label: 'Energized', emoji: '⚡', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'reflective', label: 'Reflective', emoji: '🌙', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌧️', color: 'bg-slate-100 text-slate-700 border-slate-300' },
];

export const DAILY_PROMPTS = [
  "What is one moment from today that gave you unexpected energy or peace?",
  "What is a thought or worry you're ready to let go of before you sleep?",
  "Describe a decision you're facing. What does your intuition say versus your logic?",
  "Who is someone you appreciate right now, and what specific quality of theirs inspires you?",
  "What is a small win today that you haven't given yourself enough credit for?",
  "If today was a chapter in your biography, what would you title it?"
];
