import React, { useState } from 'react';
import { 
  ShieldAlert, ExternalLink, Copy, Check, Cloud, 
  AlertTriangle, X, Globe, CheckCircle2, Info, RefreshCw
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthErrorInfo {
  code: string;
  message: string;
  domain: string;
  projectId?: string;
}

interface GoogleAuthHelpModalProps {
  isOpen: boolean;
  errorInfo: AuthErrorInfo | null;
  onClose: () => void;
  onRetry: () => void;
  isAuthenticating?: boolean;
}

export const GoogleAuthHelpModal: React.FC<GoogleAuthHelpModalProps> = ({
  isOpen,
  errorInfo,
  onClose,
  onRetry,
  isAuthenticating = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app';
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0798628874';
  const settingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const isUnauthorizedDomain = 
    errorInfo?.code === 'auth/unauthorized-domain' || 
    errorInfo?.message?.toLowerCase().includes('unauthorized') ||
    errorInfo?.message?.toLowerCase().includes('authorized domain');

  const isPopupBlocked = 
    errorInfo?.code === 'auth/popup-blocked' ||
    errorInfo?.message?.toLowerCase().includes('popup');

  const isPopupClosed = 
    errorInfo?.code === 'auth/popup-closed-by-user';

  const handleCopyDomain = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Google Drive Integration</h3>
              <p className="text-[11px] text-slate-400">Domain authorization & authentication guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isUnauthorizedDomain 
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : isPopupBlocked 
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
            {isUnauthorizedDomain ? (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : isPopupBlocked ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold">
                {isUnauthorizedDomain
                  ? 'Domain Authorization Required on Live URL'
                  : isPopupBlocked
                  ? 'Browser Popup Blocked'
                  : isPopupClosed
                  ? 'Sign-in Window Closed'
                  : 'Authentication Error'}
              </div>
              <div className="text-slate-600 leading-relaxed">
                {isUnauthorizedDomain ? (
                  <>
                    Your live site (<span className="font-mono font-semibold text-slate-900">{currentDomain}</span>) is hosted on a new domain that needs to be whitelisted in your Firebase Authentication settings before Google permits sign-in.
                  </>
                ) : isPopupBlocked ? (
                  <>
                    Your web browser blocked the Google authentication popup. Please click the popup icon in your browser address bar and choose <strong>"Always allow popups from {currentDomain}"</strong>.
                  </>
                ) : isPopupClosed ? (
                  <>
                    The Google sign-in window was closed before finishing authorization. You can retry anytime.
                  </>
                ) : (
                  <>
                    {errorInfo?.message || 'Could not complete Google authentication. Please verify domain settings below.'}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Domain Copy Box (Always shown for Vercel/live URLs) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Your Live Domain</span>
              </span>
              <span className="text-[11px] text-slate-400">Copy to whitelist</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 truncate">
                {currentDomain}
              </div>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              How to Authorize on Firebase (30 Seconds):
            </h4>
            <ol className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Click the button below to open your <strong>Firebase Authentication Settings</strong> in a new tab.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down to the <strong>"Authorized domains"</strong> card and click <strong>"Add domain"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Paste <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-900 font-semibold">{currentDomain}</code> and click <strong>Add</strong>. That's it!
                </span>
              </li>
            </ol>
          </div>

          {/* Offline / Standalone Reassurance */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Your app is 100% operational right now:</strong> All core billing features—including creating invoices, delivery challans, downloading PDFs, client accounts, and financial calculations—work locally without Google Drive. Google Drive is solely for optional automated cloud backups.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={settingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <span>Open Firebase Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Continue Offline
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={isAuthenticating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
              <span>{isAuthenticating ? 'Connecting...' : 'Retry Sign In'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
