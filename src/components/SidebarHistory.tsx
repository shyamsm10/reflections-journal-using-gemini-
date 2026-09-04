import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Filter, 
  X,
  ChevronRight,
  BookMarked
} from 'lucide-react';
import { JournalEntry, JournalMood } from '../types';
import { JOURNAL_MOODS } from '../data/modes';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  onTogglePin: (entryId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onTogglePin,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Mood filter
      if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesContent = entry.content.toLowerCase().includes(query);
        const matchesSummary = (entry.summary || '').toLowerCase().includes(query);
        const matchesTags = entry.tags.some((t) => t.toLowerCase().includes(query));
        const matchesMessages = entry.messages.some((m) => m.content.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesSummary || matchesTags || matchesMessages;
      }
      return true;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  const pinnedEntries = useMemo(
    () => filteredEntries.filter((e) => e.isPinned),
    [filteredEntries]
  );
  const otherEntries = useMemo(
    () => filteredEntries.filter((e) => !e.isPinned),
    [filteredEntries]
  );

  const formatEntryDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getMoodBadge = (mood: JournalMood) => {
    return JOURNAL_MOODS.find((m) => m.id === mood) || JOURNAL_MOODS[0];
  };

  const renderEntryCard = (entry: JournalEntry) => {
    const isSelected = entry.id === selectedEntryId;
    const moodInfo = getMoodBadge(entry.mood);

    return (
      <div
        key={entry.id}
        id={`sidebar-entry-${entry.id}`}
        onClick={() => {
          onSelectEntry(entry);
          onCloseMobile();
        }}
        className={`group relative p-3.5 rounded-xl transition-all cursor-pointer border ${
          isSelected
            ? 'bg-amber-50/90 border-amber-300 shadow-xs'
            : 'bg-stone-50 hover:bg-stone-100/90 border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">{moodInfo.emoji}</span>
            <h4
              className={`text-xs sm:text-sm font-semibold truncate ${
                isSelected ? 'text-amber-950' : 'text-stone-800'
              }`}
            >
              {entry.title || 'Untitled Reflection'}
            </h4>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(entry.id);
              }}
              className={`p-1 rounded hover:bg-stone-200 transition-colors ${
                entry.isPinned ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
              }`}
              title={entry.isPinned ? 'Unpin reflection' : 'Pin to top'}
            >
              <Pin className={`w-3 h-3 ${entry.isPinned ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEntryToDelete(entry.id);
              }}
              className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete reflection"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Snippet */}
        <p className="text-[11px] text-stone-500 line-clamp-2 mb-2 leading-relaxed">
          {entry.content || (entry.summary ? `✨ Summary: ${entry.summary}` : 'Empty reflection...')}
        </p>

        {/* Meta details */}
        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
          <span>{formatEntryDate(entry.updatedAt || entry.createdAt)}</span>
          <div className="flex items-center gap-2">
            {entry.messages.length > 0 && (
              <span className="flex items-center gap-0.5 text-stone-600 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>{entry.messages.length}</span>
              </span>
            )}
            <span>{entry.wordCount || 0}w</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 sm:w-80 bg-stone-100 border-r border-stone-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 pt-16 lg:pt-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Actions */}
        <div className="p-4 border-b border-stone-200 space-y-3 bg-stone-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-amber-800" />
              <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-800">
                Journal History
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-stone-200 px-1.5 py-0.5 rounded text-stone-600">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Write New Reflection</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections & AI chats..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-100 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mood Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedMoodFilter === 'all'
                  ? 'bg-stone-900 text-stone-100 font-medium'
                  : 'bg-stone-200/80 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {JOURNAL_MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMoodFilter(m.id)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-colors ${
                  selectedMoodFilter === m.id
                    ? 'bg-amber-800 text-amber-100 font-medium'
                    : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-stone-600">No reflections found</p>
              <p className="text-[11px] text-stone-400 mt-1">
                {searchQuery
                  ? 'Try clearing your search or filter'
                  : 'Start by writing your first reflection!'}
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 px-1 text-[10px] font-mono text-amber-800 font-semibold uppercase tracking-wider">
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    <span>Pinned ({pinnedEntries.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pinnedEntries.map(renderEntryCard)}
                  </div>
                </div>
              )}

              {/* All / Recent Section */}
              {otherEntries.length > 0 && (
                <div className="space-y-2">
                  {pinnedEntries.length > 0 && (
                    <div className="px-1 text-[10px] font-mono text-stone-400 font-semibold uppercase tracking-wider">
                      Recent Entries ({otherEntries.length})
                    </div>
                  )}
                  <div className="space-y-2">
                    {otherEntries.map(renderEntryCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {entryToDelete && (
          <div className="p-3 m-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm animate-in fade-in">
            <p className="text-xs font-medium mb-2">Delete this reflection permanently?</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="flex-1 py-1 px-2.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 py-1 px-2.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
