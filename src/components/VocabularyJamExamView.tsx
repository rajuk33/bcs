import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  ArrowLeft,
  Grid,
  Send,
  Lock,
  Sparkles,
  Volume2,
  VolumeX,
  Flag,
  Award,
  BookOpen,
} from 'lucide-react';
import { ExamSession, ExamResult, Language, Question, SubjectScoreBreakdown, WeakTopicRecommendation, SubjectId, ThemeName, ColorMode } from '../types';
import { t } from '../utils/translations';
import { saveActiveSession } from '../utils/storage';
import { getSubjectById } from '../data/subjects';
import { THEME_CONFIGS } from '../utils/theme';

interface VocabularyJamExamViewProps {
  session: ExamSession;
  onFinishExam: (result: ExamResult) => void;
  onSwitchToContinuousView: () => void;
  lang: Language;
  theme: ThemeName;
  colorMode: ColorMode;
}

export const VocabularyJamExamView: React.FC<VocabularyJamExamViewProps> = ({
  session: initialSession,
  onFinishExam,
  onSwitchToContinuousView,
  lang,
  theme,
  colorMode,
}) => {
  const tr = t(lang);
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;
  const isDark = colorMode === 'dark';

  const [session, setSession] = useState<ExamSession>(initialSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isTimeUpModal, setIsTimeUpModal] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Timer effect
  useEffect(() => {
    if (session.isCompleted) return;

    const interval = setInterval(() => {
      setSession((prev) => {
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(interval);
          if (prev.config.autoSubmitOnTimeUp) {
            setIsTimeUpModal(true);
            setTimeout(() => {
              handleSubmitFinal(prev);
            }, 1200);
          }
          return {
            ...prev,
            timeRemainingSeconds: 0,
          };
        }

        const updated = {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1,
        };
        saveActiveSession(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isCompleted]);

  const totalQuestions = session.questions.length;
  const currentQuestion: Question = session.questions[currentIndex] || session.questions[0];
  const isAnswered = session.selectedAnswers[currentQuestion.id] !== undefined;
  const selectedOption = session.selectedAnswers[currentQuestion.id];
  const isFlagged = !!session.flaggedQuestions[currentQuestion.id];

  const answeredCount = Object.keys(session.selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Option selection with LOCK:
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return;

    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);

    setSession((prev) => {
      const updatedAnswers = {
        ...prev.selectedAnswers,
        [currentQuestion.id]: optionIndex,
      };
      const updated = {
        ...prev,
        selectedAnswers: updatedAnswers,
      };
      saveActiveSession(updated);
      return updated;
    });

    // Auto advance to next question after small delay if enabled
    if (autoAdvance && currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1));
      }, 1000);
    }
  };

  const handleToggleFlag = () => {
    setSession((prev) => {
      const updated = {
        ...prev,
        flaggedQuestions: {
          ...prev.flaggedQuestions,
          [currentQuestion.id]: !prev.flaggedQuestions[currentQuestion.id],
        },
      };
      saveActiveSession(updated);
      return updated;
    });
  };

  const handleSubmitFinal = (currentSession: ExamSession) => {
    const totalAllocatedSeconds = currentSession.config.durationMinutes * 60;
    const timeSpentSeconds = Math.max(1, totalAllocatedSeconds - currentSession.timeRemainingSeconds);

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const subjectStats: Record<
      SubjectId,
      { total: number; attempted: number; correct: number; incorrect: number; skipped: number }
    > = {} as any;

    currentSession.questions.forEach((q) => {
      const subId = q.subjectId;
      if (!subjectStats[subId]) {
        subjectStats[subId] = { total: 0, attempted: 0, correct: 0, incorrect: 0, skipped: 0 };
      }
      subjectStats[subId].total += 1;

      const userAns = currentSession.selectedAnswers[q.id];
      if (userAns === undefined) {
        skippedCount += 1;
        subjectStats[subId].skipped += 1;
      } else if (userAns === q.correctAnswer) {
        correctCount += 1;
        subjectStats[subId].attempted += 1;
        subjectStats[subId].correct += 1;
      } else {
        incorrectCount += 1;
        subjectStats[subId].attempted += 1;
        subjectStats[subId].incorrect += 1;
      }
    });

    const negativePenalty = incorrectCount * 0.5;
    const totalMarks = Math.max(0, correctCount * 1.0 - negativePenalty);
    const percentage = Math.round((totalMarks / totalQuestions) * 100);

    const subjectBreakdown: SubjectScoreBreakdown[] = Object.entries(subjectStats).map(
      ([subId, stats]) => {
        const info = getSubjectById(subId as SubjectId);
        const marks = stats.correct * 1.0 - stats.incorrect * 0.5;
        const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
        return {
          subjectId: subId as SubjectId,
          subjectNameBn: info.nameBn,
          subjectNameEn: info.nameEn,
          total: stats.total,
          attempted: stats.attempted,
          correct: stats.correct,
          incorrect: stats.incorrect,
          skipped: stats.skipped,
          marks: Math.max(0, marks),
          accuracy,
        };
      }
    );

    const recommendations: WeakTopicRecommendation[] = [];
    subjectBreakdown.forEach((sub) => {
      if (sub.total >= 2 && sub.accuracy < 65) {
        recommendations.push({
          subjectId: sub.subjectId,
          subjectNameBn: sub.subjectNameBn,
          subjectNameEn: sub.subjectNameEn,
          accuracy: sub.accuracy,
          adviceBn: `${sub.subjectNameBn} বিষয়ে মৌলিক ধারণা ও বিগত বছরের প্রশ্ন বারবার অনুশীলন করুন।`,
          adviceEn: `Practice fundamental concepts and past questions for ${sub.subjectNameEn}.`,
          suggestedTopicsBn: ['বিসিএস প্রশ্নাবলি রিভিশন', 'প্রমিত পাঠ্যবই'],
          suggestedTopicsEn: ['BCS Past Questions', 'Standard Textbook Review'],
        });
      }
    });

    const finalResult: ExamResult = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateName: currentSession.config.candidateName,
      date: new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timestamp: Date.now(),
      mode: currentSession.config.mode,
      subjectName: currentSession.config.subjectId
        ? (lang === 'bn' ? getSubjectById(currentSession.config.subjectId).nameBn : getSubjectById(currentSession.config.subjectId).nameEn)
        : undefined,
      totalQuestions,
      attemptedCount: answeredCount,
      correctCount,
      incorrectCount,
      skippedCount,
      totalMarks: Number(totalMarks.toFixed(2)),
      negativePenalty: Number(negativePenalty.toFixed(2)),
      percentage,
      timeSpentSeconds,
      totalAllocatedSeconds,
      subjectBreakdown,
      recommendations,
      questions: currentSession.questions,
      userAnswers: currentSession.selectedAnswers,
    };

    onFinishExam(finalResult);
  };

  const minutes = Math.floor(session.timeRemainingSeconds / 60);
  const seconds = session.timeRemainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = session.timeRemainingSeconds <= 300;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/80 text-slate-900'}`}>
      {/* ========================================================
          JAM TOP STATUS BAR
      ======================================================== */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 py-3 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xs'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Jam Mode Pill & Question Tracker */}
          <div className="flex items-center space-x-2.5">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jam Mode</span>
            </span>

            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'প্রশ্ন' : 'Question'} <strong>{currentIndex + 1}</strong> / {totalQuestions}
            </span>
          </div>

          {/* Center Streak Badge */}
          {streak >= 2 && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-black animate-streak">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>
                {streak} {lang === 'bn' ? 'টানা সঠিক!' : 'Streak!'}
              </span>
            </div>
          )}

          {/* Right Controls: Timer, Palette, Switch View, Submit */}
          <div className="flex items-center space-x-2">
            {/* Timer */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-all ${
                isTimeCritical
                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse'
                  : isDark
                  ? 'bg-slate-800 text-slate-100 border-slate-700'
                  : 'bg-slate-900 text-white border-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{formattedTime}</span>
            </div>

            {/* Jump Palette button */}
            <button
              onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={lang === 'bn' ? 'প্রশ্ন গ্রিড' : 'Question Grid'}
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Switch to Continuous 100 View */}
            <button
              onClick={onSwitchToContinuousView}
              className="hidden md:inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {lang === 'bn' ? 'একপৃষ্ঠা ভিউ' : '100-List View'}
            </button>

            {/* Submit Exam */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{tr.get('submitExamBtn')}</span>
            </button>
          </div>
        </div>

        {/* Top Progress Line */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* ========================================================
          JAM MAIN CARD CONTAINER (ONE AT A TIME)
      ======================================================== */}
      <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full px-4 py-8">
        <div
          key={currentQuestion.id}
          className={`animate-jam-card rounded-3xl p-6 sm:p-10 border shadow-md transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Card Top: Subject & Lock Status */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm bg-emerald-600 text-white shadow-xs">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? currentQuestion.subject : currentQuestion.subjectEn || currentQuestion.subject}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {isAnswered && (
                <span className="flex items-center space-x-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold border border-emerald-500/20">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>{lang === 'bn' ? 'উত্তর লকড' : 'Locked'}</span>
                </span>
              )}
              <button
                onClick={handleToggleFlag}
                className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 ${
                  isFlagged
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
                title={lang === 'bn' ? 'ফ্ল্যাগ' : 'Flag'}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-xl sm:text-2xl font-bold leading-relaxed mb-6 font-bangla">
            {lang === 'bn' ? currentQuestion.question : currentQuestion.questionEn || currentQuestion.question}
          </h2>

          {/* 4 Interactive Options (Big Jam Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((optText, optIdx) => {
              const optEn = currentQuestion.optionsEn ? currentQuestion.optionsEn[optIdx] : optText;
              const isSelected = selectedOption === optIdx;
              const optionLabel = ['ক', 'খ', 'গ', 'ঘ'][optIdx];

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`text-left p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 font-semibold shadow-md'
                      : isAnswered
                      ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-slate-200 cursor-pointer active:scale-[0.98]'
                      : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-800 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-white text-emerald-800 border-white'
                        : isDark
                        ? 'bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {optionLabel}
                  </span>
                  <span className="text-sm sm:text-base font-medium flex-1 pt-0.5 leading-snug">
                    {lang === 'bn' ? optText : optEn}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card Controls: Prev, Next, Auto-advance toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
            </button>

            {/* Auto Advance Toggle */}
            <label className="flex items-center space-x-2 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>{lang === 'bn' ? 'দাগালে স্বয়ংক্রিয়ভাবে পরের প্রশ্নে যান' : 'Auto-advance on pick'}</span>
            </label>

            <button
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              disabled={currentIndex === totalQuestions - 1}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white disabled:opacity-30 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>{lang === 'bn' ? 'পরবর্তী প্রশ্ন' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Jump Palette Drawer */}
      {showPaletteDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md h-full shadow-2xl flex flex-col p-5 overflow-hidden border-l ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">{lang === 'bn' ? 'প্রশ্ন নির্বাচন করুন' : 'Jump to Question'}</h3>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((q, idx) => {
                  const isAns = session.selectedAnswers[q.id] !== undefined;
                  const isFlg = !!session.flaggedQuestions[q.id];
                  const isCur = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPaletteDrawer(false);
                      }}
                      className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                        isCur
                          ? 'ring-2 ring-emerald-500 border-emerald-500 font-black'
                          : isAns
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isFlg
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setShowPaletteDrawer(false);
                setShowSubmitModal(true);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm"
            >
              {tr.get('submitExamBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold mb-3">{tr.get('confirmSubmitTitle')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {unansweredCount > 0
                ? tr.confirmSubmitWarning(unansweredCount)[lang]
                : tr.get('confirmSubmitAllDone')}
            </p>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold"
              >
                {tr.get('cancelBtn')}
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitFinal(session);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs"
              >
                {tr.get('confirmSubmitBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Submit Timer Expired Modal */}
      {isTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 dark:border-slate-800">
            <Clock className="w-10 h-10 mx-auto text-rose-500 animate-spin mb-3" />
            <h3 className="text-lg font-bold">{tr.get('timeExpiredTitle')}</h3>
            <p className="text-xs text-slate-500 mt-1">{tr.get('timeExpiredMsg')}</p>
          </div>
        </div>
      )}
    </div>
  );
};
