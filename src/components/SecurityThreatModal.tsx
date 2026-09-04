import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  Database, 
  Server, 
  Key, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface SecurityThreatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityThreatModal: React.FC<SecurityThreatModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-stone-50 border border-stone-300 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">
                Security Architecture & Threat Model
              </h3>
              <p className="text-xs text-stone-400">
                OWASP Top 10 Aligned • Zero Insecure Defaults • Strict User Isolation
              </p>
            </div>
          </div>
          <button
            id="security-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-700">
          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs mb-1">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Owner-Bound Pathing</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Rules require <code className="text-stone-700 bg-stone-200 px-1 py-0.5 rounded font-mono">request.auth.uid == userId</code> on all reads and writes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs mb-1">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Zero Hardcoded Keys</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                API keys reside exclusively in server-side environment variables / Secret Manager.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs mb-1">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Federated Identity</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Google Sign-In handles all authentication. No passwords ever touch or enter the application codebase.
              </p>
            </div>
          </div>

          {/* Structured Threat Summary Table */}
          <div>
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-2 font-mono">
              Agentic Threat Modeling Matrix (The 5 Threat Zones)
            </h4>
            <div className="overflow-x-auto border border-stone-200 rounded-xl bg-stone-50 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-200/70 text-stone-800 font-semibold border-b border-stone-300">
                    <th className="p-3">Threat Zone</th>
                    <th className="p-3">Identified Risk</th>
                    <th className="p-3">Implemented Countermeasure</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-600 text-[11px] sm:text-xs">
                  <tr>
                    <td className="p-3 font-semibold text-stone-900">1. Input Surfaces</td>
                    <td className="p-3">Untrusted prompts, oversized payloads, script injection.</td>
                    <td className="p-3">Defensive payload parsing, text sanitization, HTML escaping via ReactMarkdown.</td>
                    <td className="p-3 text-right"><span className="text-emerald-700 font-medium">Mitigated</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900">2. Planning & Reasoning</td>
                    <td className="p-3">System prompt override, indirect prompt injection.</td>
                    <td className="p-3">Encapsulated system instructions, role separation, structured payload mapping.</td>
                    <td className="p-3 text-right"><span className="text-emerald-700 font-medium">Mitigated</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900">3. Tool & API Execution</td>
                    <td className="p-3">Gemini API exhaustion, rate limits, 503 outage.</td>
                    <td className="p-3">Resilient fallback ladder (gemini-3.6-flash → 3.1-flash-lite → flash-latest → 3.7-flash).</td>
                    <td className="p-3 text-right"><span className="text-emerald-700 font-medium">Mitigated</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900">4. Memory & State</td>
                    <td className="p-3">Cross-user data leakage, unauthenticated Firestore queries.</td>
                    <td className="p-3">Deployed Firestore security rules strictly scoped to <code className="bg-stone-200 px-1 rounded font-mono">/users/{'{userId}'}</code> with request.auth validation.</td>
                    <td className="p-3 text-right"><span className="text-emerald-700 font-medium">Mitigated</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900">5. Inter-System Comm</td>
                    <td className="p-3">API secret token leakage in browser devtools.</td>
                    <td className="p-3">Server-side Express proxy (/api/gemini/*). Secret keys never shipped to client.</td>
                    <td className="p-3 text-right"><span className="text-emerald-700 font-medium">Mitigated</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Rules Snippet */}
          <div>
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider mb-2 font-mono">
              Deployed Security Rules (firestore.rules)
            </h4>
            <pre className="p-3.5 rounded-xl bg-stone-900 text-stone-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Active & Enforced in Firebase Cloud</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-stone-100 rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Close Threat Model
          </button>
        </div>
      </div>
    </div>
  );
};
