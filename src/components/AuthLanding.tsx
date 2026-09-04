import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  Lock, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  Lightbulb, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthLandingProps {
  onSignInSuccess: () => void;
  onDemoSignIn?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onSignInSuccess, onDemoSignIn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; isUnauthorizedDomain?: boolean } | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onSignInSuccess();
    } catch (err: any) {
      console.error('Sign In failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError({ message: 'Sign in popup was closed before completing.' });
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError({ message: 'Sign in popup was blocked by browser. Please enable popups.' });
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setAuthError({ 
          message: 'Firebase Error (auth/unauthorized-domain): This domain (e.g. localhost) is not authorized in your Firebase Auth settings.', 
          isUnauthorizedDomain: true 
        });
      } else {
        setAuthError({ message: err.message || 'Failed to authenticate with Google.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full">
        {/* Top Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/80 border border-stone-300 text-stone-800 text-xs font-medium tracking-wide">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End User Isolation with Firebase & Cloud Firestore</span>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-stone-900 tracking-tight leading-[1.15]">
            A private space for your thoughts, reflected by <span className="italic font-medium text-amber-800 underline decoration-amber-400 decoration-2 underline-offset-4">Gemini</span>.
          </h1>
          <p className="text-stone-600 text-lg sm:text-xl font-normal max-w-2xl mx-auto leading-relaxed">
            Write daily reflections, converse with Gemini in multi-turn dialogues, and uncover deeper insights—all securely stored in your personal, isolated Firestore database.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="mt-10 max-w-md mx-auto bg-stone-50 border border-stone-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Sign in to your Journal</h2>
            <p className="text-xs text-stone-500 mt-1">
              Authenticate with your Google account to access your private reflection vault.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col gap-2 shadow-xs">
              <div className="flex items-start gap-2 font-medium text-rose-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError.message}</span>
              </div>
              {authError.isUnauthorizedDomain && (
                <div className="mt-1 pl-6 text-[11px] text-rose-700 space-y-1 bg-rose-100/60 p-2.5 rounded-lg border border-rose-200/80">
                  <p className="font-semibold text-rose-900">How to fix in Firebase Console:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to <strong>Firebase Console</strong> &gt; select project <strong>reflections-journal-1cd34</strong>.</li>
                    <li>Navigate to <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong>.</li>
                    <li>Click <strong>Add domain</strong> and add <code>localhost</code> (and any custom port or domain).</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              id="landing-google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 active:scale-[0.99] font-medium text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed border border-stone-950"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Connecting to Firebase...' : 'Continue with Google'}</span>
            </button>

            {onDemoSignIn && (
              <button
                type="button"
                onClick={onDemoSignIn}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-100 text-amber-950 hover:bg-amber-200 active:scale-[0.99] font-medium text-xs transition-all border border-amber-300/80 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Continue in Guest / Local Demo Mode</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200 text-center">
            <p className="text-[11px] text-stone-500 leading-relaxed">
              🔐 Direct Federated Google Sign-In. We never see or store your Google password. Your journals are strictly isolated by your user ID.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base mb-1">Gemini 3.6 Flash Engine</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Engage in multi-turn dialogues, generate brainstorming variations, and receive structured syntheses with resilient fallback ladders.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-1.5 text-xs text-amber-900 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-turn reflection modes</span>
            </div>
          </div>

          <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base mb-1">Firestore User Isolation</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Every reflection, prompt, and summary is stored strictly under <code className="font-mono text-[11px] bg-stone-200 px-1 py-0.5 rounded">/users/{'{userId}'}</code> with zero insecure defaults.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Owner-bound Security Rules</span>
            </div>
          </div>

          <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base mb-1">Zero-Hardcoding Hygiene</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Secrets are strictly accessed via server-side environment variables and Secret Manager bindings. No client-side leaks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-1.5 text-xs text-blue-800 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>OWASP Top 10 Aligned</span>
            </div>
          </div>
        </div>

        {/* Sample Interactive Flow Showcase */}
        <div className="mt-16 bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 border border-stone-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-800 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-semibold">
                Interactive Journey
              </span>
              <h3 className="font-serif text-2xl text-stone-100 font-normal mt-1">
                How Reflections Work
              </h3>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
            >
              <span>Try It Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-stone-800/80 p-5 rounded-xl border border-stone-700/60">
              <div className="text-amber-400 font-mono text-xs mb-2">Step 01</div>
              <h4 className="font-semibold text-stone-200 text-sm mb-1.5">1. Write Freely</h4>
              <p className="text-stone-400 text-xs leading-relaxed">
                Jot down today's dilemmas, reflections, creative questions, or emotional states in your private canvas.
              </p>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-xl border border-stone-700/60">
              <div className="text-amber-400 font-mono text-xs mb-2">Step 02</div>
              <h4 className="font-semibold text-stone-200 text-sm mb-1.5">2. Converse with Gemini</h4>
              <p className="text-stone-400 text-xs leading-relaxed">
                Ask questions, explore Socratic inquiries, or request creative brainstorming with tailored reflection personas.
              </p>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-xl border border-stone-700/60">
              <div className="text-amber-400 font-mono text-xs mb-2">Step 03</div>
              <h4 className="font-semibold text-stone-200 text-sm mb-1.5">3. Auto-Save & Summarize</h4>
              <p className="text-stone-400 text-xs leading-relaxed">
                Gemini automatically extracts core essence, emotional themes, and action steps, persisted to your isolated Firestore.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Reflections Journal. Powered by Google Gemini & Firebase Firestore.</p>
          <p className="font-mono text-[11px] text-stone-400">Strictly Isolated User Sandbox</p>
        </div>
      </footer>
    </div>
  );
};
