import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  FileText, 
  Lightbulb, 
  Compass, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Save, 
  Pin, 
  RefreshCw, 
  Trash2, 
  ChevronDown,
  AlertCircle,
  HelpCircle,
  Wand2,
  Share2,
  Menu
} from 'lucide-react';
import { JournalEntry, ReflectionMode, JournalMood, InteractionMessage } from '../types';
import { REFLECTION_MODES, JOURNAL_MOODS, DAILY_PROMPTS } from '../data/modes';
import { requestGeminiReflection, requestGeminiSummary } from '../lib/gemini';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updatedEntry: JournalEntry, autoSave?: boolean) => void;
  onManualSave: () => void;
  onToggleSidebar: () => void;
  isSaving: boolean;
  syncError: string | null;
  onClearSyncError: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onManualSave,
  onToggleSidebar,
  isSaving,
  syncError,
  onClearSyncError,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const activeModeConfig = REFLECTION_MODES.find((m) => m.id === entry.mode) || REFLECTION_MODES[0];

  // Auto scroll to bottom of conversation when messages update
  useEffect(() => {
    if (entry.messages.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entry.messages.length]);

  const handleTitleChange = (newTitle: string) => {
    onUpdateEntry({
      ...entry,
      title: newTitle,
    });
  };

  const handleContentChange = (newContent: string) => {
    const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
    onUpdateEntry({
      ...entry,
      content: newContent,
      wordCount,
    });
  };

  const handleModeSelect = (mode: ReflectionMode) => {
    onUpdateEntry({
      ...entry,
      mode,
    });
  };

  const handleMoodSelect = (mood: JournalMood) => {
    onUpdateEntry({
      ...entry,
      mood,
    });
  };

  const handleInsertDailyPrompt = () => {
    const randomPrompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    const prefix = entry.content.trim() ? `${entry.content.trim()}\n\n` : '';
    const newContent = `${prefix}💡 Reflection Prompt: ${randomPrompt}\n`;
    handleContentChange(newContent);
  };

  // Multi-Turn Reflection Dialogue with Gemini API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput.trim();
    if (!textToSend || isAiLoading) return;

    setAiError(null);
    setIsAiLoading(true);

    const userMessage: InteractionMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      mode: entry.mode,
    };

    const updatedMessages = [...entry.messages, userMessage];
    
    // Update local state immediately with user message
    const updatedEntryWithUser = {
      ...entry,
      messages: updatedMessages,
    };
    onUpdateEntry(updatedEntryWithUser);
    setChatInput('');

    try {
      const result = await requestGeminiReflection({
        messages: updatedMessages,
        entryContent: entry.content,
        entryTitle: entry.title,
        mode: entry.mode,
      });

      if (!result.success || !result.text) {
        throw new Error('Failed to receive reflection from Gemini AI');
      }

      const modelMessage: InteractionMessage = {
        id: `msg_${Date.now()}_model`,
        role: 'model',
        content: result.text,
        timestamp: Date.now(),
        modelUsed: result.modelUsed || 'gemini-3.6-flash',
        mode: entry.mode,
      };

      const finalMessages = [...updatedMessages, modelMessage];
      onUpdateEntry({
        ...entry,
        messages: finalMessages,
      });
    } catch (err: any) {
      console.error('Gemini Reflection API error:', err);
      setAiError(err.message || 'Unable to connect to Gemini AI. Please check your network and retry.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate Session Synthesis / Key Takeaways
  const handleGenerateSummary = async () => {
    if (!entry.content.trim() && entry.messages.length === 0) {
      setAiError('Please write some thoughts or have a reflection conversation first to generate a summary.');
      return;
    }

    setIsSummarizing(true);
    setAiError(null);

    try {
      const result = await requestGeminiSummary({
        title: entry.title,
        entryContent: entry.content,
        messages: entry.messages,
      });

      if (!result.success || !result.text) {
        throw new Error('Failed to synthesize summary');
      }

      onUpdateEntry({
        ...entry,
        summary: result.text,
      });
    } catch (err: any) {
      console.error('Gemini Summary API error:', err);
      setAiError(err.message || 'Failed to generate session summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleExport = (format: 'markdown' | 'text' | 'json') => {
    setIsExportMenuOpen(false);
    let contentToExport = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    const dateStr = new Date(entry.createdAt).toLocaleDateString();

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      extension = 'md';
      contentToExport = `# ${entry.title || 'Journal Reflection'}\n\n`;
      contentToExport += `**Date**: ${dateStr} | **Mood**: ${entry.mood} | **Mode**: ${entry.mode}\n\n`;
      contentToExport += `## Reflection Entry\n\n${entry.content}\n\n`;
      if (entry.summary) {
        contentToExport += `## AI Synthesis & Insights\n\n${entry.summary}\n\n`;
      }
      if (entry.messages.length > 0) {
        contentToExport += `## Multi-Turn Dialogue\n\n`;
        entry.messages.forEach((m) => {
          contentToExport += `**${m.role === 'user' ? 'Me' : 'Gemini AI'}** (${new Date(m.timestamp).toLocaleTimeString()}):\n${m.content}\n\n`;
        });
      }
    } else if (format === 'json') {
      mimeType = 'application/json';
      extension = 'json';
      contentToExport = JSON.stringify(entry, null, 2);
    } else {
      contentToExport = `${entry.title || 'Journal Reflection'}\nDate: ${dateStr}\n\n${entry.content}\n\n`;
      if (entry.summary) {
        contentToExport += `--- SUMMARY ---\n${entry.summary}\n\n`;
      }
    }

    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-100/50 overflow-y-auto">
      {/* Top Workspace Header */}
      <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Sidebar Toggle & Title */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <button
              id="editor-mobile-sidebar-toggle"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-200 transition-colors"
              title="Toggle Journal History"
            >
              <Menu className="w-5 h-5" />
            </button>

            <input
              type="text"
              id="editor-title-input"
              value={entry.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title of this reflection..."
              className="font-serif text-lg sm:text-2xl font-medium text-stone-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-stone-300 truncate"
            />
          </div>

          {/* Quick Toolbar Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Generate AI Summary Button */}
            <button
              id="editor-generate-summary-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || (!entry.content && entry.messages.length === 0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition-all border border-amber-300/80 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Synthesize Core Essence, Themes & Action Items"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-amber-700'}`} />
              <span className="hidden sm:inline">{isSummarizing ? 'Synthesizing...' : 'Summarize'}</span>
              <span className="sm:hidden">Summary</span>
            </button>

            {/* Manual Save Button */}
            <button
              id="editor-manual-save-btn"
              onClick={onManualSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium transition-all shadow-xs"
              title="Save to Firestore now"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                id="editor-export-menu-btn"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 text-xs transition-colors border border-stone-300 flex items-center gap-1"
                title="Export Journal Entry"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-stone-50 border border-stone-300 rounded-xl shadow-lg z-30 py-1.5 text-xs">
                  <button
                    onClick={() => handleExport('markdown')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-800 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    onClick={() => handleExport('text')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-800 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-800 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>JSON Raw Data (.json)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Header: Reflection Mode & Mood Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-stone-200/80 text-xs">
          {/* Reflection Mode Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-stone-400 font-mono text-[10px] uppercase mr-1 hidden sm:inline">
              Mode:
            </span>
            {REFLECTION_MODES.map((mode) => (
              <button
                key={mode.id}
                id={`editor-mode-${mode.id}`}
                onClick={() => handleModeSelect(mode.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  entry.mode === mode.id
                    ? 'bg-amber-800 text-stone-100 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
                title={mode.description}
              >
                <span>{mode.name}</span>
              </button>
            ))}
          </div>

          {/* Mood Pill Selector */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-mono text-[10px] uppercase mr-1 hidden sm:inline">
              Mood:
            </span>
            {JOURNAL_MOODS.map((mood) => (
              <button
                key={mood.id}
                id={`editor-mood-${mood.id}`}
                onClick={() => handleMoodSelect(mood.id)}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  entry.mood === mood.id
                    ? 'bg-stone-900 text-stone-100 scale-110 shadow-xs ring-1 ring-amber-400'
                    : 'hover:bg-stone-200 text-stone-500'
                }`}
                title={`Mark as ${mood.label}`}
              >
                <span>{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Error / AI Error Banner */}
      {(syncError || aiError) && (
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{syncError ? 'Firestore Sync Warning' : 'Gemini AI Error'}</p>
              <p className="text-stone-600 mt-0.5">{syncError || aiError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {syncError && (
              <button
                onClick={onManualSave}
                className="px-2.5 py-1 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
              >
                Retry Save
              </button>
            )}
            <button
              onClick={() => {
                setAiError(null);
                onClearSyncError();
              }}
              className="text-stone-400 hover:text-stone-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Section 1: Journal Entry Textarea Canvas */}
        <div className="bg-stone-50 rounded-2xl border border-stone-300 p-5 sm:p-6 shadow-xs relative">
          <div className="flex items-center justify-between mb-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-700 uppercase tracking-wider text-[11px]">
                Daily Reflection Entry
              </span>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-[11px]">{entry.wordCount || 0} words</span>
            </div>

            <button
              id="editor-insert-prompt-btn"
              onClick={handleInsertDailyPrompt}
              className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium hover:underline transition-colors"
              title="Insert a random inspirational daily reflection prompt"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Inspiration Prompt</span>
            </button>
          </div>

          <textarea
            id="editor-journal-textarea"
            value={entry.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={activeModeConfig.promptPlaceholder}
            rows={7}
            className="w-full bg-transparent text-stone-800 text-sm sm:text-base font-normal font-sans leading-relaxed focus:outline-none border-none resize-y placeholder:text-stone-300"
          />

          <div className="mt-3 pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>Mode active: <strong className="text-stone-600">{activeModeConfig.name}</strong></span>
            <span>Created {new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Section 2: AI Structured Summary Card (if generated) */}
        {entry.summary && (
          <div className="bg-amber-50/70 rounded-2xl border border-amber-200/90 p-5 sm:p-6 shadow-xs relative animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-serif font-semibold text-stone-900 text-sm sm:text-base">
                  Gemini Synthesis & Takeaways
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(entry.summary || '', 'summary')}
                  className="p-1 rounded text-stone-500 hover:text-stone-800 transition-colors"
                  title="Copy Summary"
                >
                  {copiedMessageId === 'summary' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className="text-[11px] font-medium text-amber-800 hover:text-amber-950 underline underline-offset-2"
                >
                  {isSummarizing ? 'Updating...' : 'Regenerate'}
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-stone-800 leading-relaxed prose prose-stone max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1">
              <ReactMarkdown>{entry.summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Section 3: Multi-Turn Conversation & Reflection Dialogue */}
        <div className="bg-stone-50 rounded-2xl border border-stone-300 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-800" />
              <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-stone-800">
                Multi-Turn Reflection Dialogue
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
              {entry.messages.length} {entry.messages.length === 1 ? 'turn' : 'turns'}
            </span>
          </div>

          {/* Dialogue Message Stream */}
          {entry.messages.length === 0 ? (
            <div className="text-center py-8 px-4 bg-stone-100/60 rounded-xl border border-dashed border-stone-200">
              <Compass className="w-7 h-7 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-700">Ready to explore your thoughts</p>
              <p className="text-[11px] text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
                Click one of the suggested prompts below or ask Gemini to reflect on your journal entry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entry.messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                        isUser
                          ? 'bg-stone-900 text-stone-100'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm shadow-xs ${
                        isUser
                          ? 'bg-stone-900 text-stone-100 rounded-tr-xs'
                          : 'bg-stone-100 text-stone-900 border border-stone-200 rounded-tl-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className={`leading-relaxed ${isUser ? '' : 'prose prose-stone max-w-none prose-p:my-1.5 prose-ul:my-1 prose-headings:my-2 text-stone-800'}`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        )}
                      </div>

                      {/* Message Footer */}
                      <div
                        className={`mt-2.5 pt-2 flex items-center justify-between text-[10px] font-mono border-t ${
                          isUser
                            ? 'border-stone-800 text-stone-400'
                            : 'border-stone-200 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!isUser && message.modelUsed && (
                            <span className="text-amber-800 font-semibold">{message.modelUsed}</span>
                          )}
                        </div>

                        {!isUser && (
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="p-1 hover:text-stone-900 transition-colors flex items-center gap-1"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="font-sans text-[10px]">
                              {copiedMessageId === message.id ? 'Copied' : 'Copy'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
                  </div>
                  <div className="bg-stone-100 border border-stone-200 rounded-2xl rounded-tl-xs p-4 text-xs text-stone-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Gemini is contemplating your thoughts...</span>
                  </div>
                </div>
              )}

              <div ref={conversationEndRef} />
            </div>
          )}

          {/* Suggestion Chips */}
          <div className="pt-2">
            <p className="text-[11px] font-mono text-stone-400 mb-2 uppercase tracking-wide">
              Suggested Exploration Prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeModeConfig.suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-full text-xs bg-stone-200/80 hover:bg-amber-100 text-stone-800 hover:text-amber-950 border border-stone-300/80 transition-all text-left disabled:opacity-50"
                >
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Composer Input */}
          <div className="pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-stone-100 border border-stone-300 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all"
            >
              <input
                type="text"
                id="editor-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask Gemini to reflect in ${activeModeConfig.name} mode...`}
                disabled={isAiLoading}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-stone-900 placeholder:text-stone-400"
              />

              <button
                type="submit"
                id="editor-chat-submit-btn"
                disabled={!chatInput.trim() || isAiLoading}
                className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send reflection question to Gemini"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
