import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
  Printer,
  Sparkles,
  Target,
  RefreshCw,
  Calendar,
  Zap,
} from 'lucide-react';
import { AiDiagnosticAnalysis, ColorMode, ExamResult, Language, Question, SubjectId, ThemeName } from '../types';
import { t } from '../utils/translations';
import { shuffleQuestionsAndOptions } from '../utils/storage';
import { getSubjectById } from '../data/subjects';
import { THEME_CONFIGS } from '../utils/theme';

interface ExamResultViewProps {
  result: ExamResult;
  onRetake: (shuffledQuestions: Question[]) => void;
  onPracticeTopic: (subjectId: SubjectId) => void;
  onHome: () => void;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
  onSaveUpdatedResult?: (updated: ExamResult) => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result: initialResult,
  onRetake,
  onPracticeTopic,
  onHome,
  lang,
  theme = 'emerald',
  colorMode = 'light',
  onSaveUpdatedResult,
}) => {
  const tr = t(lang);
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;
  const isDark = colorMode === 'dark';

  const [result, setResult] = useState<ExamResult>(initialResult);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'skipped'>('all');
  const [aiAnalysis, setAiAnalysis] = useState<AiDiagnosticAnalysis | null>(initialResult.aiAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Automatically fetch AI analysis if not present
  useEffect(() => {
    if (!aiAnalysis && !isAnalyzing) {
      handleFetchAiAnalysis();
    }
  }, []);

  const handleFetchAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const lightweightPayload = {
        candidateName: result.candidateName,
        totalQuestions: result.totalQuestions,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        skippedCount: result.skippedCount,
        negativePenalty: result.negativePenalty,
        timeSpentSeconds: result.timeSpentSeconds,
        subjectBreakdown: result.subjectBreakdown,
      };

      const res = await fetch('/api/gemini/analyze-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: lightweightPayload,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch Gemini AI analysis');
      }

      setAiAnalysis(data.analysis);
      const updated = { ...result, aiAnalysis: data.analysis };
      setResult(updated);
      if (onSaveUpdatedResult) {
        onSaveUpdatedResult(updated);
      }
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      setAnalysisError(err.message || 'AI analysis unavailable');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetakeClick = () => {
    const shuffled = shuffleQuestionsAndOptions(result.questions);
    onRetake(shuffled);
  };

  const spentMin = Math.floor(result.timeSpentSeconds / 60);
  const spentSec = result.timeSpentSeconds % 60;
  const formattedTimeSpent = `${spentMin}m ${spentSec}s`;

  const filteredReviewQuestions = result.questions.filter((q) => {
    const userAns = result.userAnswers[q.id];
    if (reviewFilter === 'correct') return userAns === q.correctAnswer;
    if (reviewFilter === 'incorrect') return userAns !== undefined && userAns !== q.correctAnswer;
    if (reviewFilter === 'skipped') return userAns === undefined;
    return true;
  });

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ========================================================
            HERO SCORE CARD
        ======================================================== */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${themeCfg.colors.badgeBg} ${themeCfg.colors.badgeText}`}>
                {result.mode === 'full'
                  ? (lang === 'bn' ? '১০০ নম্বরের পূর্ণাঙ্গ মডেল টেস্ট' : '100-Mark Full Mock Test')
                  : (lang === 'bn' ? `${result.subjectName || ''} টেস্ট` : `${result.subjectName || ''} Test`)}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
                {tr.get('resultTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'bn' ? 'পরীক্ষার্থী:' : 'Candidate:'} <strong>{result.candidateName}</strong> • {result.date}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title={lang === 'bn' ? 'প্রিন্ট করুন' : 'Print'}
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleRetakeClick}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-2 shadow-xs transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr.get('retakeExam')}</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-emerald-100 uppercase tracking-wider block">
                {tr.get('scoreObtained')}
              </span>
              <div className="text-2xl sm:text-3xl font-black mt-1">
                {result.totalMarks}
                <span className="text-sm font-normal text-emerald-200"> / {result.totalQuestions}</span>
              </div>
              <span className="text-[11px] text-emerald-100 mt-1 block">
                {result.percentage}% {lang === 'bn' ? 'নম্বর অর্জন' : 'achieved'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr.get('correctCount')}</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                {result.correctCount}
              </div>
              <span className="text-[11px] text-emerald-600 block mt-0.5">
                +{result.correctCount * 1.0} {lang === 'bn' ? 'নম্বর' : 'pts'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-semibold">
                <XCircle className="w-4 h-4" />
                <span>{tr.get('incorrectCount')}</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                {result.incorrectCount}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
                -{result.negativePenalty} {lang === 'bn' ? 'নেগেটিভ' : 'penalty'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>{tr.get('skippedCount')}</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {result.skippedCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {lang === 'bn' ? '০ কর্তন' : '0 deduction'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center space-x-1.5 text-blue-600 text-xs font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>{lang === 'bn' ? 'সঠিকতার হার' : 'Accuracy'}</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {result.attemptedCount > 0
                  ? Math.round((result.correctCount / result.attemptedCount) * 100)
                  : 0}
                %
              </div>
              <span className="text-[11px] text-blue-600 block mt-0.5">
                {result.attemptedCount} {lang === 'bn' ? 'টি দাগিয়েছেন' : 'attempted'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-teal-50 border-teal-200'}`}>
              <div className="flex items-center space-x-1.5 text-teal-600 text-xs font-semibold">
                <Clock className="w-4 h-4" />
                <span>{tr.get('timeUsed')}</span>
              </div>
              <div className="text-xl font-bold mt-1 text-teal-600 dark:text-teal-400">
                {formattedTimeSpent}
              </div>
              <span className="text-[11px] text-teal-600 block mt-0.5">
                {Math.round(result.timeSpentSeconds / (result.attemptedCount || 1))}s / q
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            DYNAMIC GEMINI AI ANALYSIS & 7-DAY ROADMAP
        ======================================================== */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white border-indigo-900'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5 fill-amber-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  {lang === 'bn' ? 'জেমিনি এআই ডায়াগনস্টিক রিপোর্ট' : 'Gemini AI Diagnostic Report'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {lang === 'bn' ? 'এআই পারফরম্যান্স মূল্যায়ন ও ভবিষ্যৎ পরিকল্পনা' : 'AI Performance Assessment & Strategy'}
                </h2>
              </div>
            </div>

            <button
              onClick={handleFetchAiAnalysis}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1.5 border border-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? (lang === 'bn' ? 'বিশ্লেষণ চলছে...' : 'Analyzing...') : (lang === 'bn' ? 'রি-অ্যানালাইজ' : 'Re-analyze')}</span>
            </button>
          </div>

          {isAnalyzing && !aiAnalysis && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-sm font-semibold text-slate-300">
                {lang === 'bn' ? 'জেমিনি এআই আপনার ১০০টি প্রশ্নের ফলাফল ও বিষয়ভিত্তিক দুর্বলতা বিশ্লেষণ করছে...' : 'Gemini AI is analyzing your performance metrics...'}
              </p>
            </div>
          )}

          {aiAnalysis && (
            <div className="space-y-6">
              {/* Executive Summary & Readiness Meter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    {lang === 'bn' ? 'ক্যান্ডিডেট পারফরম্যান্স সামারি' : 'Executive Evaluation'}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-200">
                    {aiAnalysis.summary}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                      {lang === 'bn' ? 'প্রিলিমিনারি প্রস্তুতি স্তর' : 'BCS Readiness Level'}
                    </span>
                    <div className="text-3xl font-black text-white mt-1">
                      {aiAnalysis.readinessScore}%
                    </div>
                    <span className="text-xs font-semibold text-amber-300 block mt-0.5">
                      {aiAnalysis.readinessGrade}
                    </span>
                  </div>

                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300"
                      style={{ width: `${aiAnalysis.readinessScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths & Critical Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-emerald-300 flex items-center space-x-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'bn' ? 'আপনার মূল শক্তিমত্তা' : 'Key Strengths'}</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-200 list-disc list-inside">
                    {aiAnalysis.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                  <h4 className="font-bold text-rose-300 flex items-center space-x-1.5 text-sm">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>{lang === 'bn' ? 'নেগেটিভ মার্কের প্রধান ক্ষেত্রসমূহ' : 'Critical Gaps & Penalty Areas'}</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-200 list-disc list-inside">
                    {aiAnalysis.criticalGaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Tips */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <h4 className="font-bold text-amber-300 text-sm flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'bn' ? 'ট্যাকটিকাল পরীক্ষার কৌশল' : 'Tactical Exam Advice'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {aiAnalysis.strategicTips.map((tip, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-200">
                      • {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day High-Yield Revision Roadmap */}
              {aiAnalysis.revisionRoadmap && aiAnalysis.revisionRoadmap.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-teal-300" />
                    <span>{lang === 'bn' ? 'পরবর্তী ৭ দিনের রিভিশন রুটিন' : '7-Day High-Yield Revision Roadmap'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {aiAnalysis.revisionRoadmap.map((dayPlan, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-teal-400/40 transition-colors space-y-1"
                      >
                        <span className="font-black text-amber-300 text-[11px] block">
                          {dayPlan.day} • {dayPlan.subject}
                        </span>
                        <p className="font-semibold text-white">{dayPlan.focus}</p>
                        <p className="text-slate-300 text-[11px]">{dayPlan.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            SUBJECT-WISE BREAKDOWN
        ======================================================== */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Target className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold">
              {tr.get('subjectAnalysisTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.subjectBreakdown.map((sub) => {
              const isStrong = sub.accuracy >= 70;
              const isModerate = sub.accuracy >= 50 && sub.accuracy < 70;

              return (
                <div
                  key={sub.subjectId}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">
                        {lang === 'bn' ? sub.subjectNameBn : sub.subjectNameEn}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {sub.total} {lang === 'bn' ? 'টি প্রশ্ন' : 'questions'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-block ${
                          isStrong
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isModerate
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {sub.accuracy}% {lang === 'bn' ? 'সঠিক' : 'Acc'}
                      </span>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        {sub.marks} {lang === 'bn' ? 'নম্বর' : 'pts'}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
                    <div
                      style={{ width: `${(sub.correct / sub.total) * 100}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${(sub.incorrect / sub.total) * 100}%` }}
                      className="bg-rose-400 h-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="text-emerald-600 font-medium">✓ {sub.correct} {lang === 'bn' ? 'সঠিক' : 'correct'}</span>
                    <span className="text-rose-500 font-medium">✗ {sub.incorrect} {lang === 'bn' ? 'ভুল' : 'wrong'}</span>
                    <span className="font-medium">○ {sub.skipped} {lang === 'bn' ? 'বাদ' : 'skipped'}</span>
                    <button
                      onClick={() => onPracticeTopic(sub.subjectId)}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      {lang === 'bn' ? 'টেস্ট দিন →' : 'Practice →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            DETAILED QUESTION REVIEW
        ======================================================== */}
        <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold">
                {tr.get('reviewQuestions')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn'
                  ? 'সব প্রশ্নের নির্ভুল উত্তর, বিশদ ব্যাখ্যা ও বিসিএস তথ্যসূত্র'
                  : 'Answer keys, explanations and citations'}
              </p>
            </div>

            <div className={`flex items-center space-x-1 p-1 rounded-xl text-xs font-semibold ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {lang === 'bn' ? `সকল (${result.questions.length})` : `All (${result.questions.length})`}
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'incorrect' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                {lang === 'bn' ? `ভুল (${result.incorrectCount})` : `Wrong (${result.incorrectCount})`}
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'correct' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-2xs font-bold' : 'text-slate-500'
                }`}
              >
                {lang === 'bn' ? `সঠিক (${result.correctCount})` : `Correct (${result.correctCount})`}
              </button>
              <button
                onClick={() => setReviewFilter('skipped')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'skipped' ? 'bg-white dark:bg-slate-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {lang === 'bn' ? `বাদ (${result.skippedCount})` : `Skipped (${result.skippedCount})`}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredReviewQuestions.map((q, idx) => {
              const originalIndex = result.questions.findIndex((orig) => orig.id === q.id);
              const questionNumber = originalIndex >= 0 ? originalIndex + 1 : idx + 1;
              const userAns = result.userAnswers[q.id];
              const isCorrect = userAns === q.correctAnswer;
              const isSkipped = userAns === undefined;
              const isIncorrect = !isCorrect && !isSkipped;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : isIncorrect
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : isDark
                      ? 'border-slate-800 bg-slate-800/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-600 text-white' : isIncorrect ? 'bg-rose-600 text-white' : 'bg-slate-400 text-white'
                        }`}
                      >
                        {questionNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {lang === 'bn' ? q.subject : q.subjectEn || q.subject}
                      </span>
                    </div>

                    <div>
                      {isCorrect && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          +১.০ ({lang === 'bn' ? 'সঠিক' : 'Correct'})
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                          -০.৫ ({lang === 'bn' ? 'ভুল' : 'Wrong'})
                        </span>
                      )}
                      {isSkipped && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-500/10 px-2.5 py-1 rounded-full">
                          ০.০ ({lang === 'bn' ? 'বাদ' : 'Skipped'})
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-semibold mb-3.5 leading-snug">
                    {lang === 'bn' ? q.question : q.questionEn || q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {q.options.map((optText, optIdx) => {
                      const optEn = q.optionsEn ? q.optionsEn[optIdx] : optText;
                      const isOptionCorrect = optIdx === q.correctAnswer;
                      const isOptionUserSelected = optIdx === userAns;

                      let cardStyle = isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700';
                      if (isOptionCorrect) {
                        cardStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-400 font-semibold';
                      } else if (isOptionUserSelected && !isOptionCorrect) {
                        cardStyle = 'border-rose-400 bg-rose-500/10 text-rose-600 dark:text-rose-300 font-medium';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border flex items-start justify-between text-xs sm:text-sm ${cardStyle}`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <span className="font-bold shrink-0">
                              {['ক', 'খ', 'গ', 'ঘ'][optIdx]}.
                            </span>
                            <span>{lang === 'bn' ? optText : optEn}</span>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isOptionCorrect && (
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                {lang === 'bn' ? 'সঠিক' : 'Correct'}
                              </span>
                            )}
                            {isOptionUserSelected && !isOptionCorrect && (
                              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                                {lang === 'bn' ? 'আপনার পিক' : 'Your Pick'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`rounded-xl p-3.5 border space-y-2 text-xs ${isDark ? 'bg-slate-800/50 border-slate-800 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-700'}`}>
                    <div>
                      <span className="font-bold block mb-1">
                        {tr.get('explanationLabel')}:
                      </span>
                      <p>{lang === 'bn' ? q.explanation : q.explanationEn || q.explanation}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 italic">
                      <strong>{tr.get('referenceLabel')}:</strong> {q.reference}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-12">
          <button
            onClick={onHome}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
          >
            {lang === 'bn' ? 'মূল তালিকায় ফিরুন' : 'Back to Home'}
          </button>

          <button
            onClick={handleRetakeClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm flex items-center space-x-2 shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{tr.get('retakeExam')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
