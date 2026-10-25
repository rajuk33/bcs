import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { ColorMode, Language, ThemeName } from '../types';
import { THEME_CONFIGS } from '../utils/theme';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
  reason?: 'start_exam' | 'resume_exam' | 'general';
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  lang,
  theme = 'emerald',
  colorMode = 'light',
  reason = 'start_exam',
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = colorMode === 'dark';
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (e: any) {
      console.error('Sign in failed:', e);
      setErrorMsg(
        lang === 'bn'
          ? 'গুগল সাইন-ইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Google sign-in encountered an issue. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
              {lang === 'bn' ? 'লগইন আবশ্যক' : 'Login Required'}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {reason === 'resume_exam'
                ? lang === 'bn'
                  ? 'পরীক্ষা চালিয়ে যেতে লগইন করুন'
                  : 'Sign in to Resume Test'
                : lang === 'bn'
                ? 'মডেল টেস্টে অংশ নিতে লগইন করুন'
                : 'Sign in to Participate'}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            {lang === 'bn'
              ? 'বিসিএস পরীক্ষার নিয়ম অনুযায়ী প্রার্থী যাচাইকরণ, ক্লাউডে ফলাফল সংরক্ষণ এবং এআই প্রশ্ন সমৃদ্ধকরণের জন্য লগইন বাধ্যতামূলক।'
              : 'Candidate verification, cloud result saving, and AI question enrichment require Google authentication before taking any test.'}
          </p>
        </div>

        {/* Benefits List */}
        <div className="mt-6 space-y-2.5 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-300">
              {lang === 'bn'
                ? '১০০ নম্বরের প্রিলিমিনারি পূর্ণাঙ্গ পরীক্ষা ও বিষয়ভিত্তিক টেস্ট'
                : 'Access to 100-mark Full Mock Tests and Subject Tests'}
            </span>
          </div>

          <div className="flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-300">
              {lang === 'bn'
                ? 'প্রতি লগইনে জেমিনি এআই স্বয়ংক্রিয়ভাবে নতুন প্রশ্ন যোগ করবে ও ফায়ারবেসে ক্লাউডে রাখবে'
                : 'Every login automatically enriches the question bank via Gemini AI & Firebase'}
            </span>
          </div>

          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-300">
              {lang === 'bn'
                ? 'পরীক্ষার ফলাফল, স্কোর ও দুর্বল বিষয়ের ৭ দিনের রিভিশন রোডম্যাপ'
                : 'Exam scores, history, and AI diagnostic 7-day revision roadmap'}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-md font-bold text-sm flex items-center justify-center space-x-3 transition-all active:scale-98 disabled:opacity-70 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-750"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            <span>
              {isSigningIn
                ? lang === 'bn'
                  ? 'সাইন ইন হচ্ছে...'
                  : 'Signing in...'
                : lang === 'bn'
                ? 'Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন'
                : 'Continue with Google'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {lang === 'bn' ? 'পরে করব (ফিরে যান)' : 'Cancel & Return'}
          </button>
        </div>
      </div>
    </div>
  );
};
