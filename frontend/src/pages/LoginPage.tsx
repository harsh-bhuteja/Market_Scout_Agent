import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USE_REAL_BACKEND } from '../services/api';
import { 
  Radar, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Terminal, 
  Lock, 
  Sparkles,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithSandbox, isLoading, error, isConfigured, clearError } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleGoogleLogin = async () => {
    setAuthError(null);
    clearError();
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed. Please try again.');
    }
  };

  const handleSandboxLogin = async () => {
    setAuthError(null);
    clearError();
    try {
      await loginWithSandbox();
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.message || 'Sandbox authorization failed.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden selection:bg-white/20 selection:text-white">
      {/* Glossy ambient reflections */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-white/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-[500px] h-[400px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top minimal header */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shadow-gloss-reflection">
            <Radar className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-sm text-white">MARKET SCOUT</span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
            Auth Gateway
          </span>
        </div>

        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-zinc-400" />
          <span>OAuth 2.0 PKCE Protected</span>
        </div>
      </header>

      {/* Centered Login Box */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Main Card */}
          <div className="glass-panel-glow rounded-3xl p-8 border border-white/[0.12] space-y-6 shadow-2xl relative">
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center mx-auto shadow-gloss-reflection mb-4">
                <Radar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Market Scout Agent
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Evidence-backed Talent Market Intelligence platform. Sign in to access your intelligence dashboard and stateful graph runs.
              </p>
            </div>

            {/* Error Message banner */}
            {(error || authError) && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-red-500/30 text-xs text-zinc-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-red-400">Authentication Error</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {error || authError}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {/* Continue with Google button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-white hover:bg-zinc-100 text-black font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-glow-white disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-800">
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <>
                    {/* Google G Icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Developer Sandbox Alternative if Client ID is not configured yet */}
              {!USE_REAL_BACKEND && !isConfigured && (
                <div className="pt-2 space-y-2">
                  <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 text-left space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Google OAuth Configuration Status</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      To connect your real Google Cloud Project, add <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code> to your <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded font-mono">.env.local</code> file.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSandboxLogin}
                    disabled={isLoading}
                    className="w-full h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Enter in Evaluation / Sandbox Mode</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Security Guarantee */}
            <div className="pt-4 border-t border-white/[0.08] text-center">
              <span className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                Zero Client Secrets in Browser · Enterprise Ready
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-6 flex items-center justify-center border-t border-white/[0.06] text-xs text-zinc-400 font-mono">
        <span>Market Scout Agent © 2026 · Joveo Technical Assessment</span>
      </footer>
    </div>
  );
};

