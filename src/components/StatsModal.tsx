import React from 'react';
import { 
  BarChart3, 
  X, 
  BookOpen, 
  Sparkles, 
  Edit3, 
  Smile, 
  Calendar, 
  Award,
  Layers
} from 'lucide-react';
import { JournalEntry } from '../types';
import { JOURNAL_MOODS, REFLECTION_MODES } from '../data/modes';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  const totalWords = entries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const totalTurns = entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0);
  const totalSummaries = entries.filter((e) => Boolean(e.summary)).length;

  // Mood counts
  const moodCounts = JOURNAL_MOODS.map((mood) => ({
    ...mood,
    count: entries.filter((e) => e.mood === mood.id).length,
  }));

  // Mode counts
  const modeCounts = REFLECTION_MODES.map((mode) => ({
    ...mode,
    count: entries.filter((e) => e.mode === mode.id).length,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-stone-50 border border-stone-300 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">
                Journaling Activity & AI Insights
              </h3>
              <p className="text-xs text-stone-400">
                Personal reflection metrics & Firestore synchronization statistics
              </p>
            </div>
          </div>
          <button
            id="stats-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-700">
          {/* High Level Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-center">
              <BookOpen className="w-5 h-5 text-amber-700 mx-auto mb-1" />
              <div className="font-serif text-xl font-bold text-stone-900">{entries.length}</div>
              <div className="text-[11px] text-stone-500 font-mono">Reflections</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-center">
              <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="font-serif text-xl font-bold text-stone-900">{totalTurns}</div>
              <div className="text-[11px] text-stone-500 font-mono">Gemini Turns</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-center">
              <Edit3 className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
              <div className="font-serif text-xl font-bold text-stone-900">{totalWords}</div>
              <div className="text-[11px] text-stone-500 font-mono">Words Penned</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-center">
              <Award className="w-5 h-5 text-blue-700 mx-auto mb-1" />
              <div className="font-serif text-xl font-bold text-stone-900">{totalSummaries}</div>
              <div className="text-[11px] text-stone-500 font-mono">Syntheses</div>
            </div>
          </div>

          {/* Mood Breakdown */}
          <div>
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-stone-500" />
              <span>Emotional Tone Breakdown</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {moodCounts.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{m.emoji}</span>
                    <span className="text-xs font-medium text-stone-700">{m.label}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-stone-900 bg-stone-200 px-1.5 py-0.5 rounded">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reflection Mode Utilization */}
          <div>
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Gemini Reflection Modes Used</span>
            </h4>
            <div className="space-y-2">
              {modeCounts.map((mode) => {
                const percentage = entries.length > 0 ? Math.round((mode.count / entries.length) * 100) : 0;
                return (
                  <div key={mode.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-stone-800">{mode.name}</span>
                      <span className="font-mono text-stone-500">{mode.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-700 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-stone-100 rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
