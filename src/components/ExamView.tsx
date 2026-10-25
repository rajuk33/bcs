import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  HelpCircle,
  Flag,
  Send,
  AlertTriangle,
  ChevronUp,
  Grid,
  Lock,
  X,
  Volume2,
  Sparkles,
} from 'lucide-react';
import {
  ColorMode,
  ExamResult,
  ExamSession,
  Language,
  Question,
  SubjectId,
  SubjectScoreBreakdown,
  ThemeName,
  WeakTopicRecommendation,
} from '../types';
import { t } from '../utils/translations';
import { saveActiveSession, clearActiveSession, saveExamResult } from '../utils/storage';
import { BCS_SUBJECTS, getSubjectById } from '../data/subjects';

interface ExamViewProps {
  session: ExamSession;
  onFinishExam: (result: ExamResult) => void;
  onExitExam: () => void;
  onSwitchToJamView?: () => void;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
}

export const ExamView: React.FC<ExamViewProps> = ({
  session: initialSession,
  onFinishExam,
  onExitExam,
  onSwitchToJamView,
  lang,
  theme = 'emerald',
  colorMode = 'light',
}) => {
  const tr = t(lang);

  const [session, setSession] = useState<ExamSession>(initialSession);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'answered' | 'flagged'>('all');
  const [isTimeUpModal, setIsTimeUpModal] = useState(false);

  // References for scrolling smoothly to a question
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Countdown timer effect
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
        // Persist to local storage
        saveActiveSession(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.isCompleted]);

  // Handle option select with strict LOCK rule:
  // "একবার দাগালে প্রশ্নটি ডিসেবল হয়ে যাবে, পরিবর্তন করা যাবে না।"
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    // If already answered, cannot change
    if (session.selectedAnswers[questionId] !== undefined) {
      return;
    }

    setSession((prev) => {
      const updatedAnswers = {
        ...prev.selectedAnswers,
        [questionId]: optionIndex,
      };
      const updatedSession = {
        ...prev,
        selectedAnswers: updatedAnswers,
      };
      saveActiveSession(updatedSession);
      return updatedSession;
    });
  };

  const handleToggleFlag = (questionId: string) => {
    setSession((prev) => {
      const updatedFlagged = {
        ...prev.flaggedQuestions,
        [questionId]: !prev.flaggedQuestions[questionId],
      };
      const updatedSession = {
        ...prev,
        flaggedQuestions: updatedFlagged,
      };
      saveActiveSession(updatedSession);
      return updatedSession;
    });
  };

  const scrollToQuestion = (questionId: string) => {
    const el = questionRefs.current[questionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowPaletteDrawer(false);
    }
  };

  // Calculations for sticky header
  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(session.selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.values(session.flaggedQuestions).filter(Boolean).length;

  const minutes = Math.floor(session.timeRemainingSeconds / 60);
  const seconds = session.timeRemainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = session.timeRemainingSeconds <= 300; // Under 5 minutes

  // Compute final grading and analytics
  const handleSubmitFinal = (currentSession: ExamSession) => {
    const totalAllocatedSeconds = currentSession.config.durationMinutes * 60;
    const timeSpentSeconds = Math.max(1, totalAllocatedSeconds - currentSession.timeRemainingSeconds);

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    // Subject breakdown accumulator
    const subjectStats: Record<
      SubjectId,
      {
        total: number;
        attempted: number;
        correct: number;
        incorrect: number;
        skipped: number;
      }
    > = {} as any;

    currentSession.questions.forEach((q) => {
      const subId = q.subjectId;
      if (!subjectStats[subId]) {
        subjectStats[subId] = {
          total: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
        };
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

    // Score calculation: +1 for correct, -0.5 for wrong
    const negativePenalty = incorrectCount * 0.5;
    const totalMarks = Math.max(0, correctCount * 1.0 - negativePenalty);
    const percentage = Math.round((totalMarks / totalQuestions) * 100);

    // Subject score breakdown list
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

    // Identify weak topics (accuracy < 65% or marks ratio < 50%)
    const recommendations: WeakTopicRecommendation[] = [];
    subjectBreakdown.forEach((sub) => {
      if (sub.total >= 2 && sub.accuracy < 65) {
        let adviceBn = '';
        let adviceEn = '';
        let suggestedTopicsBn: string[] = [];
        let suggestedTopicsEn: string[] = [];

        switch (sub.subjectId) {
          case 'bangla':
            adviceBn = 'বাংলা ব্যাকরণের সমাস, প্রত্যয়, কারক এবং আধুনিক সাহিত্যের উল্লেখযোগ্য উপন্যাস ও সাহিত্যিকদের সালভিত্তিক তালিকায় বেশি জোর দিন।';
            adviceEn = 'Focus on Bangla grammar (Samas, Pratyay, Karaka) and modern era literary milestones.';
            suggestedTopicsBn = ['নবম-দশম শ্রেণির ব্যাকরণ', 'চর্যাপদ ও মধ্যযুগ', 'রবীন্দ্রনাথ ও নজরুল সাহিত্য'];
            suggestedTopicsEn = ['Class 9-10 Grammar', 'Charyapada & Medieval Age', 'Tagore & Nazrul Literature'];
            break;
          case 'english':
            adviceBn = 'Subject-Verb Agreement, Appropriate Preposition এবং বিখ্যাত রোমান্টিক ও ভিক্টোরিয়ান কবিদের সাহিত্যকর্ম রিভিশন করুন।';
            adviceEn = 'Revise Subject-Verb Agreement, Prepositions, and Romantic/Victorian literature.';
            suggestedTopicsBn = ['Appropriate Preposition', 'Idioms & Phrases', 'Romantic Era Poets'];
            suggestedTopicsEn = ['Appropriate Preposition', 'Idioms & Phrases', 'Romantic Era Poets'];
            break;
          case 'bangladesh':
            adviceBn = 'সংবিধানের মৌলিক অধিকার ও অনুচ্ছেদসমূহ, মুক্তিযুদ্ধের ১১টি সেক্টর এবং সাম্প্রতিক মেগা প্রকল্প ও অর্থনৈতিক সমীক্ষা পড়ুন।';
            adviceEn = 'Review Constitutional articles, 1971 war sectors, and latest economic survey data.';
            suggestedTopicsBn = ['সংবিধানের গুরুত্বপূর্ণ অনুচ্ছেদ', '১৯৭১ মুক্তিযুদ্ধ সেক্টর', 'সাম্প্রতিক অর্থনৈতিক সমীক্ষা'];
            suggestedTopicsEn = ['Constitutional Articles', 'Liberation War Sectors', 'Economic Survey'];
            break;
          case 'science':
            adviceBn = 'রক্ত সংবহন, ভিটামিন ও রোগব্যাধি, আলোর প্রতিফলন ও তরঙ্গ তত্ত্বের মৌলিক সূত্রগুলো পুনরায় দেখুন।';
            adviceEn = 'Brush up on human physiology, vitamins, optics, and chemical bonds.';
            suggestedTopicsBn = ['রক্ত ও সংবহনতন্ত্র', 'আলো ও শব্দ তরঙ্গ', 'অ্যাসিড-ক্ষারক ও ধাতু'];
            suggestedTopicsEn = ['Circulatory System', 'Optics & Acoustics', 'Acids & Bases'];
            break;
          case 'math':
            adviceBn = 'শতকরা, লাভ-ক্ষতি, ধারা এবং পিথাগোরাসের জ্যামিতিক উপপাদ্য সংক্রান্ত শর্টকাট কৌশল আয়ত্ত করুন।';
            adviceEn = 'Practice percentage, profit-loss, series, and geometric fundamentals.';
            suggestedTopicsBn = ['সমান্তর ও গুণোত্তর ধারা', 'শতকরা ও সরল মুনাফা', 'দ্বিঘাত সমীকরণ ও সেট'];
            suggestedTopicsEn = ['Arithmetic/Geometric Series', 'Percentage & Profit', 'Quadratic & Sets'];
            break;
          default:
            adviceBn = `${sub.subjectNameBn} বিষয়ে মৌলিক ধারণা ও বিগত বছরের প্রশ্ন বারবার অনুশীলন করুন।`;
            adviceEn = `Practice fundamental concepts and past BCS questions for ${sub.subjectNameEn}.`;
            suggestedTopicsBn = ['বিগত বিসিএস প্রিলিমিনারি প্রশ্নাবলি', 'প্রমিত পাঠ্যবই রিভিশন'];
            suggestedTopicsEn = ['Past BCS Question Bank', 'Standard Textbook Review'];
            break;
        }

        recommendations.push({
          subjectId: sub.subjectId,
          subjectNameBn: sub.subjectNameBn,
          subjectNameEn: sub.subjectNameEn,
          accuracy: sub.accuracy,
          adviceBn,
          adviceEn,
          suggestedTopicsBn,
          suggestedTopicsEn,
        });
      }
    });

    const finalResult: ExamResult = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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

    saveExamResult(finalResult);
    onFinishExam(finalResult);
  };

  // Filter questions for navigation palette or list
  const filteredQuestions = session.questions.filter((q, idx) => {
    const isAnswered = session.selectedAnswers[q.id] !== undefined;
    const isFlagged = !!session.flaggedQuestions[q.id];
    if (filterMode === 'answered') return isAnswered;
    if (filterMode === 'unanswered') return !isAnswered;
    if (filterMode === 'flagged') return isFlagged;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 pb-24">
      {/* ========================================================
          STICKY TOP HEADER:
          "উপরে সবসময় দেখা যাবে সময়ের কাউন্টার, কতগুলো উত্তর দেওয়া হয়েছে ও কতগুলো বাকি।"
      ======================================================== */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Candidate & Mode Info */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {session.config.candidateName.charAt(0).toUpperCase()}
              </span>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {session.config.candidateName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {session.config.mode === 'full'
                    ? (lang === 'bn' ? '১০০ মার্কস পূর্ণাঙ্গ টেস্ট' : '100-mark Full Test')
                    : (lang === 'bn' ? getSubjectById(session.config.subjectId!).nameBn : getSubjectById(session.config.subjectId!).nameEn)}
                </span>
              </div>
            </div>

            {/* Answered & Remaining Counters */}
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-semibold">
              {/* Answered Counter */}
              <div
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
                title={tr.get('answered')}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {lang === 'bn' ? 'উত্তর:' : 'Ans:'}{' '}
                  <strong className="text-emerald-900 font-bold">{answeredCount}</strong>
                </span>
              </div>

              {/* Remaining Counter */}
              <div
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
                title={tr.get('unanswered')}
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {lang === 'bn' ? 'বাকি:' : 'Rem:'}{' '}
                  <strong className="text-slate-900 font-bold">{unansweredCount}</strong>
                </span>
              </div>

              {/* Flagged Count */}
              {flaggedCount > 0 && (
                <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <Flag className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{flaggedCount}</span>
                </div>
              )}
            </div>

            {/* Right: Countdown Timer & Submit Button */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Countdown Timer */}
              <div
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-all ${
                  isTimeCritical
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse shadow-xs'
                    : 'bg-slate-900 text-white border-slate-800'
                }`}
              >
                <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-emerald-400'}`} />
                <span>{formattedTime}</span>
              </div>

              {/* Quick Jump Palette Toggle */}
              <button
                onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                title={lang === 'bn' ? 'সকল প্রশ্নের গ্রিড দেখুন' : 'View Question Palette'}
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Switch to Jam Mode button */}
              {onSwitchToJamView && (
                <button
                  onClick={onSwitchToJamView}
                  className="hidden md:inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                  title={lang === 'bn' ? 'ভোকাবুলারি জ্যাম স্টাইলে দেখুন' : 'Switch to Jam View'}
                >
                  {lang === 'bn' ? 'জ্যাম মোড' : 'Jam View'}
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{tr.get('submitExamBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Examination Content Container */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Important Instructions Alert */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-start space-x-3 text-xs leading-relaxed">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-amber-950">
              {lang === 'bn' ? 'জরুরি পরীক্ষার নির্দেশিকা:' : 'Important Examination Guidelines:'}
            </span>
            <span>
              {lang === 'bn'
                ? 'সঠিক উত্তরে +১, ভুল উত্তরে -০.৫ নম্বর। একবার অপশন নির্বাচন করলে তা অপরিবর্তনীয়ভাবে লক হয়ে যাবে। সকল ১০০টি প্রশ্ন নিচে ক্রমান্বয়ে সাজানো আছে।'
                : 'Correct answer +1, wrong answer -0.5. Once an option is chosen, it is permanently locked. All 100 questions are listed continuously below.'}
            </span>
          </div>
        </div>

        {/* 100 Questions Continuous List (Single page/continuous flow) */}
        <div className="space-y-5">
          {session.questions.map((q, idx) => {
            const questionNumber = idx + 1;
            const isAnswered = session.selectedAnswers[q.id] !== undefined;
            const selectedOption = session.selectedAnswers[q.id];
            const isFlagged = !!session.flaggedQuestions[q.id];

            return (
              <div
                key={q.id}
                ref={(el) => {
                  questionRefs.current[q.id] = el;
                }}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                  isAnswered
                    ? 'border-emerald-200 shadow-xs'
                    : isFlagged
                    ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Question Header: Number, Subject Badge, and Flag Button */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold flex items-center justify-center text-xs sm:text-sm ${
                        isAnswered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {questionNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                      {lang === 'bn' ? q.subject : q.subjectEn || q.subject}
                    </span>
                    {q.topic && (
                      <span className="hidden sm:inline-block text-[11px] text-slate-600">
                        • {lang === 'bn' ? q.topic : q.topicEn || q.topic}
                      </span>
                    )}
                    {/* Notice: Difficulty is purposefully NOT displayed here per strict instructions */}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Locked Status Badge */}
                    {isAnswered && (
                      <span className="flex items-center space-x-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>{lang === 'bn' ? 'উত্তর লকড' : 'Locked'}</span>
                      </span>
                    )}

                    {/* Flag button */}
                    <button
                      onClick={() => handleToggleFlag(q.id)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                        isFlagged
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title={lang === 'bn' ? 'পর্যালোচনার জন্য চিহ্নিত করুন' : 'Flag for review'}
                    >
                      <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                      <span className="hidden sm:inline">{lang === 'bn' ? 'ফ্ল্যাগ' : 'Flag'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-4">
                  {lang === 'bn' ? q.question : q.questionEn || q.question}
                </h3>

                {/* 4 Options Grid */}
                {/* Rule: "একবার দাগালে প্রশ্নটি ডিসেবল হয়ে যাবে, পরিবর্তন করা যাবে না।" */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((optText, optIdx) => {
                    const optionEnText = q.optionsEn ? q.optionsEn[optIdx] : optText;
                    const isSelected = selectedOption === optIdx;
                    const isOtherOption = isAnswered && !isSelected;

                    // Option labels (ক, খ, গ, ঘ or A, B, C, D)
                    const optionLabelBn = ['ক', 'খ', 'গ', 'ঘ'][optIdx];
                    const optionLabelEn = ['A', 'B', 'C', 'D'][optIdx];
                    const optionLabel = lang === 'bn' ? optionLabelBn : optionLabelEn;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`text-left p-3 sm:p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 font-medium cursor-default shadow-xs'
                            : isOtherOption
                            ? 'bg-slate-50/70 border-slate-200 text-slate-600 opacity-60 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer active:scale-[0.99]'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {optionLabel}
                        </span>
                        <span className="text-sm flex-1 pt-0.5">
                          {lang === 'bn' ? optText : optionEnText}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Question Palette (Jump Grid) Drawer */}
      {showPaletteDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-5 overflow-hidden border-l border-slate-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'bn' ? 'প্রশ্ন প্যালেট (দ্রুত নেভিগেশন)' : 'Question Palette'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'যেকোনো প্রশ্নে সরাসরি যেতে ক্লিক করুন' : 'Click number to jump to question'}
                </p>
              </div>
              <button
                onClick={() => setShowPaletteDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 py-3 text-xs overflow-x-auto">
              {[
                { id: 'all', label: lang === 'bn' ? `সকল (${totalQuestions})` : `All (${totalQuestions})` },
                { id: 'answered', label: lang === 'bn' ? `উত্তর (${answeredCount})` : `Ans (${answeredCount})` },
                { id: 'unanswered', label: lang === 'bn' ? `বাকি (${unansweredCount})` : `Rem (${unansweredCount})` },
                { id: 'flagged', label: lang === 'bn' ? `ফ্ল্যাগ (${flaggedCount})` : `Flag (${flaggedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    filterMode === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grid of 1 to 100 */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((q, idx) => {
                  const num = idx + 1;
                  const isAns = session.selectedAnswers[q.id] !== undefined;
                  const isFlg = !!session.flaggedQuestions[q.id];

                  // Check if matches filter
                  if (filterMode === 'answered' && !isAns) return null;
                  if (filterMode === 'unanswered' && isAns) return null;
                  if (filterMode === 'flagged' && !isFlg) return null;

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className={`relative h-11 rounded-xl text-xs font-bold flex items-center justify-center border transition-all ${
                        isAns
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700'
                          : isFlg
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold hover:bg-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-white'
                      }`}
                    >
                      {num}
                      {isFlg && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom palette submit button */}
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowPaletteDrawer(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all"
              >
                {tr.get('submitExamBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM SUBMISSION MODAL:
          "উত্তর না দিয়েও যেকোনো সময় সাবমিট করা যাবে (অনুত্তরিত থাকলে সতর্ক করবে)।"
      ======================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center space-x-3 text-slate-900 mb-3">
              {unansweredCount > 0 ? (
                <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <h3 className="text-lg font-bold">
                {tr.get('confirmSubmitTitle')}
              </h3>
            </div>

            {/* Warning Text */}
            <div className="py-2 text-sm text-slate-600 leading-relaxed">
              {unansweredCount > 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-semibold">
                    {tr.confirmSubmitWarning(unansweredCount)[lang]}
                  </p>
                  <p className="text-xs text-amber-800">
                    {lang === 'bn'
                      ? 'অনুত্তরিত প্রশ্নের জন্য কোনো নম্বর কাটা যাবে না, তবে সাবমিট করার পর আর উত্তর দেওয়া সম্ভব হবে না।'
                      : 'No negative marks for unanswered questions, but you cannot return after submitting.'}
                  </p>
                </div>
              ) : (
                <p className="text-slate-700">
                  {tr.get('confirmSubmitAllDone')}
                </p>
              )}

              {/* Quick Summary in modal */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-500 font-medium">
                    {lang === 'bn' ? 'মোট প্রশ্ন' : 'Total'}
                  </span>
                  <span className="text-base font-bold text-slate-800">{totalQuestions}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="block text-[11px] text-emerald-700 font-medium">
                    {lang === 'bn' ? 'উত্তরকৃত' : 'Answered'}
                  </span>
                  <span className="text-base font-bold text-emerald-800">{answeredCount}</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="block text-[11px] text-rose-700 font-medium">
                    {lang === 'bn' ? 'অনুত্তরিত' : 'Skipped'}
                  </span>
                  <span className="text-base font-bold text-rose-800">{unansweredCount}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs sm:text-sm transition-colors"
              >
                {tr.get('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitFinal(session);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                {tr.get('confirmSubmitBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          AUTO-SUBMIT ON TIME EXPIRATION NOTICE
      ======================================================== */}
      {isTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {tr.get('timeExpiredTitle')}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {tr.get('timeExpiredMsg')}
            </p>
            <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};
