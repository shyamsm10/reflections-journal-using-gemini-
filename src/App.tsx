import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  signOutUser, 
  subscribeToUserEntries, 
  saveJournalEntry, 
  deleteJournalEntry, 
  sanitizePayload 
} from './lib/firebase';
import { JournalEntry, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { SidebarHistory } from './components/SidebarHistory';
import { JournalEditor } from './components/JournalEditor';
import { SecurityThreatModal } from './components/SecurityThreatModal';
import { StatsModal } from './components/StatsModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  
  // Modals & UI Toggles
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync & Notifications
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Ref for debounced auto-saving
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeEntryRef = useRef<JournalEntry | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setCurrentUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
      } else {
        setCurrentUser(null);
        setEntries([]);
        setSelectedEntryId(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create a brand new blank entry
  const createNewEntry = useCallback((customTitle?: string): JournalEntry => {
    const newId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: currentUser?.uid || '',
      title: customTitle || 'Today’s Reflection',
      content: '',
      mode: 'reflection',
      mood: 'thoughtful',
      tags: [],
      messages: [],
      summary: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      wordCount: 0,
    };
    return newEntry;
  }, [currentUser?.uid]);

  // Subscribe to real-time entries when authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    setSyncStatus('saving');
    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setSyncStatus('synced');
        setSyncError(null);

        // If no entries exist for this user yet, create a default welcome reflection
        if (fetchedEntries.length === 0) {
          const initialEntry = createNewEntry('Welcome to Reflections');
          initialEntry.content = "Welcome to your private reflection journal. Here you can express your thoughts, brainstorm ideas, and converse with Gemini 3.6 Flash. All entries are encrypted and isolated strictly to your account.";
          initialEntry.wordCount = initialEntry.content.split(/\s+/).length;
          
          saveJournalEntry(currentUser.uid, initialEntry).catch((err) => {
            console.error('Failed to create initial entry:', err);
          });
          setSelectedEntryId(initialEntry.id);
        } else if (!selectedEntryId && fetchedEntries.length > 0) {
          setSelectedEntryId(fetchedEntries[0].id);
        }
      },
      (err) => {
        console.error('Error in entries subscription:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to sync with Firestore database');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, createNewEntry, selectedEntryId]);

  // Find currently active entry
  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || entries[0] || null;
  activeEntryRef.current = selectedEntry;

  // Debounced auto-save to Firestore
  const queueAutoSave = useCallback((entryToSave: JournalEntry) => {
    if (!currentUser?.uid) return;

    setSyncStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveJournalEntry(currentUser.uid, entryToSave);
        setSyncStatus('synced');
        setSyncError(null);
      } catch (err: any) {
        console.error('AutoSave error:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Failed to save reflection to Firestore');
      }
    }, 800); // 800ms debounce
  }, [currentUser?.uid]);

  // Handle entry updates from editor
  const handleUpdateEntry = (updatedEntry: JournalEntry) => {
    // Update local state immediately for snappy UI
    setEntries((prev) =>
      prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
    );
    queueAutoSave(updatedEntry);
  };

  // Handle manual explicit save
  const handleManualSave = async () => {
    if (!currentUser?.uid || !selectedEntry) return;

    setSyncStatus('saving');
    try {
      await saveJournalEntry(currentUser.uid, selectedEntry);
      setSyncStatus('synced');
      setSyncError(null);
      addToast('success', 'Saved to Firestore', 'Your reflection has been safely stored.');
    } catch (err: any) {
      console.error('Manual save failed:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Firestore write failed');
      addToast('error', 'Save Failed', err.message);
    }
  };

  // Handle creating a new entry
  const handleNewEntryClick = async () => {
    if (!currentUser?.uid) return;
    const newEntry = createNewEntry();
    
    // Add locally and select
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);

    try {
      await saveJournalEntry(currentUser.uid, newEntry);
      addToast('info', 'New Reflection Created', 'Start writing your thoughts.');
    } catch (err: any) {
      console.error('Error creating new entry:', err);
      addToast('error', 'Creation Error', err.message);
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (selectedEntryId === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        if (remaining.length > 0) {
          setSelectedEntryId(remaining[0].id);
        } else {
          // If no remaining, create a fresh entry
          handleNewEntryClick();
        }
      }
      addToast('info', 'Reflection Deleted');
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (entryId: string) => {
    if (!currentUser?.uid) return;
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;

    const updated = { ...target, isPinned: !target.isPinned };
    handleUpdateEntry(updated);
    addToast('info', updated.isPinned ? 'Reflection Pinned' : 'Reflection Unpinned');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      addToast('info', 'Signed Out Successfully');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center text-stone-700">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg font-medium text-stone-900">Reflections</p>
        <p className="text-xs text-stone-500 font-mono mt-1">Connecting to Firebase Auth...</p>
      </div>
    );
  }

  const handleDemoSignIn = () => {
    const demoUser: UserProfile = {
      uid: 'demo_guest_user',
      email: 'guest@reflections.local',
      displayName: 'Guest Journaler',
      photoURL: null,
    };
    setCurrentUser(demoUser);
    addToast('info', 'Entered Guest / Local Mode', 'Reflections will be saved locally in your browser.');
  };

  // Unauthenticated landing page
  if (!currentUser) {
    return (
      <>
        <AuthLanding onSignInSuccess={() => {}} onDemoSignIn={handleDemoSignIn} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntryClick}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        syncStatus={syncStatus}
        totalEntriesCount={entries.length}
      />

      {/* Main Workspace Layout (Sidebar + Editor) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar History Panel */}
        <SidebarHistory
          entries={entries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
          onNewEntry={handleNewEntryClick}
          onDeleteEntry={handleDeleteEntry}
          onTogglePin={handleTogglePin}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Active Reflection Editor & Gemini Stream */}
        {selectedEntry ? (
          <JournalEditor
            entry={selectedEntry}
            onUpdateEntry={handleUpdateEntry}
            onManualSave={handleManualSave}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isSaving={syncStatus === 'saving'}
            syncError={syncError}
            onClearSyncError={() => setSyncError(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
              📝
            </div>
            <h3 className="font-serif text-xl font-semibold text-stone-800">No Reflection Selected</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
              Select an entry from your history or create a new reflection to start conversing with Gemini.
            </p>
            <button
              onClick={handleNewEntryClick}
              className="px-4 py-2 bg-stone-900 text-stone-100 rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs"
            >
              Write New Reflection
            </button>
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      <SecurityThreatModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        entries={entries}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
