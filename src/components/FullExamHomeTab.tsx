import React from 'react';
import {
  Play,
  Clock,
  ShieldAlert,
  Award,
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorMode, ExamSession, Language, ThemeName } from '../types';
import { BCS_SUBJECTS } from '../data/subjects';
import { t } from '../utils/translations';
import { THEME_CONFIGS } from '../utils/theme';

interface FullExamHomeTabProps {
  onOpenSetupModal: () => void;
  onResumeSession: () => void;
  onDiscardSession: () => void;
  activeSession: ExamSession | null;
  onOpenRules: () => void;
  onSelectTab: (tab: 'full' | 'subject' | 'ai_bank' | 'history') => void;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
  currentUser?: FirebaseUser | null;
  onRequireLogin: () => void;
  totalQuestionsCount: number;
  isEnrichingQuestions?: boolean;
}

export const FullExamHomeTab: React.FC<FullExamHomeTabProps> = ({
  onOpenSetupModal,
  onResumeSession,
  onDiscardSession,
  activeSession,
  onOpenRules,
  onSelectTab,
  lang,
  theme = 'emerald',
  colorMode = 'light',
  currentUser,
  onRequireLogin,
  totalQuestionsCount,
  isEnrichingQuestions,
}) => {
  const tr = t(lang);
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;
  const isDark = colorMode === 'dark';

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Login Required Notice Banner (if not logged in) */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4 border border-amber-300/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {lang === 'bn' ? 'লগইন বাধ্যতামূলক' : 'Authentication Required'}
              </span>
              <h3 className="text-lg font-extrabold leading-tight">
                {lang === 'bn'
                  ? 'মডেল টেস্টে অংশগ্রহণ করতে গুগল অ্যাকাউন্ট দিয়ে লগইন করুন'
                  : 'Sign in with Google to Participate in Mock Tests'}
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                {lang === 'bn'
                  ? 'লগইন করলেই জেমিনি এআই স্বয়ংক্রিয়ভাবে নতুন প্রশ্ন এনে প্রশ্নব্যাংক সমৃদ্ধ করবে এবং আপনার ফলাফল ক্লাউডে সংরক্ষিত থাকবে।'
                  : 'Logging in auto-enriches the question bank via Gemini AI and saves your progress & history.'}
              </p>
            </div>
          </div>

          <button
            onClick={onRequireLogin}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center space-x-2.5 shadow-md transition-all active:scale-95"
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'bn' ? 'গুগল দিয়ে সাইন ইন করুন' : 'Sign in with Google'}</span>
          </button>
        </div>
      )}

      {/* Cloud Enrichment Live Pill Banner (if logged in) */}
      {currentUser && (
        <div className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs border ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 text-slate-300'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">
                {lang === 'bn' ? 'প্রশ্নব্যাংক ও ক্লাউড স্ট্যাটাস:' : 'Question Bank & Cloud Status:'}
              </span>
              <span className="ml-1.5 font-medium">
                {lang === 'bn'
                  ? `মোট ${totalQuestionsCount}টি যাচাইকৃত প্রশ্ন প্রস্তুত (প্রতি লগইনে জেমিনি নতুন প্রশ্ন যুক্ত করে)`
                  : `${totalQuestionsCount} verified questions ready (Enriched on each login by Gemini)`}
              </span>
            </div>
          </div>

          {isEnrichingQuestions ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{lang === 'bn' ? 'জেমিনি প্রশ্ন তৈরি ও ফায়ারবেসে সংরক্ষণ করছে...' : 'Gemini enriching questions & syncing to Firebase...'}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'bn' ? 'ফায়ারবেস সিঙ্কড' : 'Firebase Synced'}</span>
            </div>
          )}
        </div>
      )}

      {/* Resume Banner */}
      {activeSession && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-slate-950 shadow-md flex flex-wrap items-center justify-between gap-4 border border-amber-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider bg-black/15 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {lang === 'bn' ? 'সংরক্ষিত চলমান পরীক্ষা' : 'Saved In-Progress Exam'}
              </span>
              <h3 className="text-lg font-extrabold leading-tight">
                {lang === 'bn'
                  ? `আপনার একটি পরীক্ষা চলমান রয়েছে (${Object.keys(activeSession.selectedAnswers).length}/${activeSession.questions.length}টি উত্তর সম্পন্ন)`
                  : `You have an active exam in progress (${Object.keys(activeSession.selectedAnswers).length}/${activeSession.questions.length} answered)`}
              </h3>
              <p className="text-xs text-slate-900/80 mt-0.5">
                {lang === 'bn'
                  ? `বাকি সময়: ${Math.floor(activeSession.timeRemainingSeconds / 60)} মিনিট ${activeSession.timeRemainingSeconds % 60} সেকেন্ড।`
                  : `Time left: ${Math.floor(activeSession.timeRemainingSeconds / 60)}m ${activeSession.timeRemainingSeconds % 60}s.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onDiscardSession}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-slate-950 text-xs font-bold transition-colors"
            >
              {tr.get('discardAndNew')}
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  onRequireLogin();
                } else {
                  onResumeSession();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-sm transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{tr.get('resumeExam')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className={`rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg border ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-800'
          : `bg-gradient-to-br ${themeCfg.colors.headerGradient} border-white/10`
      }`}>
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full border border-white/20">
              {lang === 'bn' ? 'বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ প্রস্তুতি' : 'BCS Preliminary Complete Preparation'}
            </span>
            <span className="text-xs font-medium text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full">
              BPSC Standard
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {lang === 'bn' ? 'বিসিএস ক্যাডার হওয়ার স্বপ্নপূরণে প্রমিত প্রস্তুতি' : 'Achieve Your BCS Dream with Standard Preparation'}
          </h1>

          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
            {lang === 'bn'
              ? '১০টি বিষয়ের সমন্বয়ে ১০০টি বহুনির্বাচনী প্রশ্ন, ৩০ সেকেন্ড/প্রশ্ন সময়সীমা, নেগেটিভ মার্কিং (-০.৫), ইনস্ট্যান্ট অপশন লক, ভোকাবুলারি জ্যাম স্টাইল কুইজ এবং পরীক্ষা শেষে বিশদ এআই ডায়াগনস্টিক।'
              : '100 MCQs spanning 10 BCS subjects, 30s/q timing, -0.5 negative penalty, option lock, Vocabulary Jam mode, and Gemini AI performance diagnostics.'}
          </p>

          {/* Key Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center space-x-2.5">
              <BookOpen className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <span className="block font-bold text-white">১০০টি MCQ</span>
                <span className="text-[11px] text-white/80">১০টি পূর্ণাঙ্গ বিষয়</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <span className="block font-bold text-white">৫০ মিনিট</span>
                <span className="text-[11px] text-white/80">০.৫ মিনিট/প্রশ্ন</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <span className="block font-bold text-white">+১ / -০.৫</span>
                <span className="text-[11px] text-amber-200">নেগেটিভ মার্কিং</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center space-x-2.5">
              <Zap className="w-5 h-5 text-teal-300 shrink-0" />
              <div>
                <span className="block font-bold text-white">জ্যাম বা একপৃষ্ঠা</span>
                <span className="text-[11px] text-teal-200">২টি কুইজ মোড</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!currentUser) {
                  onRequireLogin();
                } else {
                  onOpenSetupModal();
                }
              }}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm sm:text-base flex items-center space-x-2.5 shadow-lg transition-all active:scale-95"
            >
              {currentUser ? (
                <>
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>{lang === 'bn' ? '১০০ নম্বরের মডেল টেস্ট শুরু করুন' : 'Start 100-Mark Mock Test'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-slate-950" />
                  <span>{lang === 'bn' ? 'লগইন করে মডেল টেস্ট শুরু করুন' : 'Sign in to Start Mock Test'}</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenRules}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-colors"
            >
              {tr.get('rulesBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* 10 Subjects Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">
              {lang === 'bn' ? 'বিসিএস প্রিলিমিনারি ১০টি বিষয়ের পূর্ণাঙ্গ রূপরেখা' : 'BCS Preliminary 10 Subject Blueprint'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'মডেল টেস্টে এই সকল বিষয়ের ওপর প্রশ্ন বণ্টন রয়েছে' : 'Distributed evenly across official BPSC syllabus'}
            </p>
          </div>
          <button
            onClick={() => onSelectTab('subject')}
            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:underline flex items-center space-x-1"
          >
            <span>{lang === 'bn' ? 'বিষয়ভিত্তিক টেস্ট দিন' : 'Subject Tests'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BCS_SUBJECTS.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-2xl border transition-all space-y-1 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-emerald-500'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
              }`}
            >
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">
                {lang === 'bn' ? `${sub.officialMarks} নম্বর` : `${sub.officialMarks} marks`}
              </span>
              <h4 className="font-bold text-xs sm:text-sm pt-1 leading-snug">
                {lang === 'bn' ? sub.nameBn : sub.nameEn}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
