export type ReflectionMode = 
  | 'reflection'
  | 'brainstorm'
  | 'summarize'
  | 'socratic'
  | 'action_plan';

export type JournalMood = 
  | 'calm'
  | 'thoughtful'
  | 'optimistic'
  | 'energized'
  | 'grateful'
  | 'overwhelmed'
  | 'reflective';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  mode?: ReflectionMode;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mode: ReflectionMode;
  mood: JournalMood;
  tags: string[];
  messages: InteractionMessage[];
  summary: string | null;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  wordCount: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ModeConfig {
  id: ReflectionMode;
  name: string;
  description: string;
  iconName: string;
  promptPlaceholder: string;
  suggestionChips: string[];
}
