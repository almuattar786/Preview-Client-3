import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onGoToHome?: () => void;
  onBackToStore?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onGoToHome,
  onBackToStore
}) => {
  const handleHome = onGoToHome || onBackToStore || (() => {});
  const { initializeAdminSession, isAdminLoggedIn } = useAuth();
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    // If already logged in, enter dashboard immediately
    if (isAdminLoggedIn) {
      onLoginSuccess();
    } else {
      // Automatically authorize default admin session
      setAuthorizing(true);
      initializeAdminSession().then((res) => {
        setAuthorizing(false);
        if (res.success) {
          onLoginSuccess();
        }
      });
    }
  }, [isAdminLoggedIn, onLoginSuccess]);

  const handleEnterDashboard = async () => {
    setAuthorizing(true);
    const res = await initializeAdminSession();
    setAuthorizing(false);

    if (res.success) {
      onShowToast('Admin session authorized.', 'success');
      onLoginSuccess();
    } else {
      onShowToast(res.message || 'Unable to authorize admin session.', 'error');
    }
  };

  return (
    <div className="bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/30 rounded-3xl p-8 space-y-8 shadow-xl dark:shadow-2xl relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#9a7229]/10 dark:bg-[#c5a059]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059] flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-7 h-7 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <span className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.3em]">Maison Portal</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Admin Control Panel</h1>
          <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
            Direct server-authorized portal for store administration, order processing, catalog CMS, inventory management, and store analytics.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#9a7229]/5 dark:bg-[#c5a059]/10 border border-[#9a7229]/20 dark:border-[#c5a059]/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9a7229] dark:text-[#c5a059]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Server-Controlled Secure Session</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-zinc-400 leading-relaxed">
            Administrative access is authorized securely via server-level session management with zero email/password exposure.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleEnterDashboard}
            disabled={authorizing}
            className="w-full py-3.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{authorizing ? 'Connecting to Admin Session...' : 'Enter Admin Control Panel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={handleHome}
            className="text-xs text-stone-500 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] font-mono uppercase tracking-wider cursor-pointer"
          >
            ← Return to Customer Store
          </button>
        </div>
      </div>
    </div>
  );
};
