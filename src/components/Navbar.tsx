import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  LogOut, 
  CheckCircle2, 
  RefreshCw,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurity: () => void;
  onOpenStats: () => void;
  syncStatus: 'synced' | 'saving' | 'error';
  totalEntriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurity,
  onOpenStats,
  syncStatus,
  totalEntriesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-serif font-bold text-xl shadow-inner">
            <Sparkles className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-semibold text-lg sm:text-xl text-stone-100 tracking-tight">
                Reflections
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Private AI Journaling & Firestore Sanctuary
            </p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              {/* Sync Status Badge */}
              <div 
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                    : syncStatus === 'saving'
                    ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 animate-pulse'
                    : 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                }`}
                title={
                  syncStatus === 'synced'
                    ? 'All reflections safely synced to Firestore'
                    : syncStatus === 'saving'
                    ? 'Saving to Firestore...'
                    : 'Firestore sync issue'
                }
              >
                {syncStatus === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {syncStatus === 'saving' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                {syncStatus === 'error' && <RefreshCw className="w-3.5 h-3.5 text-rose-400" />}
                <span className="capitalize">{syncStatus === 'synced' ? 'Firestore Synced' : syncStatus}</span>
              </div>

              {/* New Entry Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Reflection</span>
                <span className="sm:hidden">New</span>
              </button>

              {/* Stats Modal Trigger */}
              <button
                id="navbar-stats-btn"
                onClick={onOpenStats}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs sm:text-sm transition-colors border border-stone-800"
                title="View Journaling Insights & Stats"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline font-mono">{totalEntriesCount} {totalEntriesCount === 1 ? 'Entry' : 'Entries'}</span>
              </button>

              {/* Security & Threat Model Info */}
              <button
                id="navbar-security-btn"
                onClick={onOpenSecurity}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-300 hover:text-stone-100 hover:bg-stone-800 text-xs transition-colors border border-stone-800"
                title="View Security Model & Threat Countermeasures"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Security</span>
              </button>

              {/* User Profile Pill & Sign Out */}
              <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-stone-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-semibold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                )}

                <div className="hidden xl:block text-left">
                  <p className="text-xs font-medium text-stone-200 truncate max-w-[120px]">
                    {user.displayName || 'Journaler'}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate max-w-[120px]">
                    {user.email || ''}
                  </p>
                </div>

                <button
                  id="navbar-sign-out-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
