import React, { useState, useEffect } from 'react';
import { Play, Clock, HelpCircle, User, ShieldAlert, Settings, Check, Sparkles, LayoutList, Zap } from 'lucide-react';
import { ExamConfig, ExamDisplayMode, Language, SubjectId } from '../types';
import { BCS_SUBJECTS, getSubjectById } from '../data/subjects';
import { t } from '../utils/translations';
import { getStoredCandidateName, saveCandidateName } from '../utils/storage';

interface ExamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (config: ExamConfig) => void;
  lang: Language;
  mode: 'full' | 'subject';
  initialSubjectId?: SubjectId;
  availableQuestionsCount?: number;
  defaultDisplayMode?: ExamDisplayMode;
}

export const ExamSetupModal: React.FC<ExamSetupModalProps> = ({
  isOpen,
  onClose,
  onStartExam,
  lang,
  mode,
  initialSubjectId,
  availableQuestionsCount = 100,
  defaultDisplayMode = 'continuous',
}) => {
  const tr = t(lang);

  const [candidateName, setCandidateName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>(initialSubjectId || 'bangla');
  const [questionCount, setQuestionCount] = useState<number>(mode === 'full' ? 100 : 20);
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customTimeMinutes, setCustomTimeMinutes] = useState<number>(
    mode === 'full' ? 50 : 10
  );
  const [displayMode, setDisplayMode] = useState<ExamDisplayMode>(defaultDisplayMode);
  const [autoSubmitOnTimeUp, setAutoSubmitOnTimeUp] = useState<boolean>(true);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCandidateName();
      setCandidateName(stored || '');
      if (initialSubjectId) {
        setSelectedSubjectId(initialSubjectId);
      }
      const initialCount = mode === 'full' ? Math.min(100, availableQuestionsCount) : Math.min(20, availableQuestionsCount);
      setQuestionCount(initialCount);
      setCustomTimeMinutes(Math.round(initialCount * 0.5));
      setIsCustomTime(false);
      setNameError(false);
      if (defaultDisplayMode) {
        setDisplayMode(defaultDisplayMode);
      }
    }
  }, [isOpen, mode, initialSubjectId, availableQuestionsCount, defaultDisplayMode]);

  const handleCountChange = (count: number) => {
    setQuestionCount(count);
    if (!isCustomTime) {
      setCustomTimeMinutes(Math.max(1, Math.round(count * 0.5)));
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setNameError(true);
      return;
    }

    saveCandidateName(candidateName.trim());

    const duration = isCustomTime
      ? Math.max(1, customTimeMinutes)
      : Math.max(1, Math.round(questionCount * 0.5));

    onStartExam({
      candidateName: candidateName.trim(),
      mode,
      subjectId: mode === 'subject' ? selectedSubjectId : undefined,
      totalQuestions: questionCount,
      durationMinutes: duration,
      autoSubmitOnTimeUp,
      displayMode,
    });
  };

  if (!isOpen) return null;

  const subjectInfo = mode === 'subject' ? getSubjectById(selectedSubjectId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
          <div className="flex items-center space-x-2 text-xs font-medium text-emerald-200 uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>
              {mode === 'full'
                ? lang === 'bn' ? '১০০ নম্বরের পূর্ণাঙ্গ পরীক্ষা' : '100-Mark Full Exam Setup'
                : lang === 'bn' ? 'বিষয়ভিত্তিক মডেল টেস্ট' : 'Subject Test Setup'}
            </span>
          </div>
          <h2 className="text-xl font-bold">
            {mode === 'full'
              ? (lang === 'bn' ? 'বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ টেস্ট' : 'BCS Preliminary Full Mock Test')
              : (lang === 'bn' ? subjectInfo?.nameBn : subjectInfo?.nameEn)}
          </h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Candidate Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {tr.get('candidateNameLabel')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                placeholder={tr.get('enterNamePlaceholder')}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  nameError
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
                autoFocus
              />
            </div>
            {nameError ? (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {lang === 'bn' ? 'অনুগ্রহ করে প্রার্থীর নাম প্রদান করুন।' : 'Please enter candidate name.'}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {tr.get('nameSavedNotice')}
              </p>
            )}
          </div>

          {/* Exam Quiz Style / Display Mode (Vocabulary Jam vs Continuous 100) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'bn' ? 'কুইজ ফরম্যাট নির্বাচন করুন' : 'Select Quiz Format'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDisplayMode('continuous')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  displayMode === 'continuous'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <LayoutList className={`w-4 h-4 ${displayMode === 'continuous' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`} />
                  {displayMode === 'continuous' && <span className="text-xs text-emerald-600 font-bold">✓</span>}
                </div>
                <span className="font-bold text-xs block text-slate-900 dark:text-slate-100">
                  {lang === 'bn' ? 'পূর্ণাঙ্গ তালিকা ভিউ' : 'Continuous 100'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'সব প্রশ্ন একবারে স্ক্রোলযোগ্য' : 'All questions scrollable'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDisplayMode('jam')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  displayMode === 'jam'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-400'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Zap className={`w-4 h-4 ${displayMode === 'jam' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  {displayMode === 'jam' && <span className="text-xs text-amber-600 font-bold">✓</span>}
                </div>
                <span className="font-bold text-xs block text-slate-900 dark:text-slate-100">
                  {lang === 'bn' ? 'ভোকাবুলারি জ্যাম স্টাইল' : 'Vocabulary Jam Style'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'একটি করে প্রশ্ন, দ্রুত ও লাইভ' : 'One question at a time'}
                </span>
              </button>
            </div>
          </div>

          {/* Subject Selector for Subject Mode */}
          {mode === 'subject' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'বিষয় নির্বাচন করুন' : 'Select Subject'}
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value as SubjectId)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {BCS_SUBJECTS.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {lang === 'bn' ? sub.nameBn : sub.nameEn} ({lang === 'bn' ? `মূল সিলেবাস: ${sub.officialMarks} নম্বর` : `Syllabus: ${sub.officialMarks} marks`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Question Count Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {tr.get('customQuestions')}
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                {questionCount} {lang === 'bn' ? 'টি প্রশ্ন' : 'questions'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { count: mode === 'full' ? 100 : 30, label: mode === 'full' ? (lang === 'bn' ? '১০০ (স্ট্যান্ডার্ড)' : '100 (Std)') : '30' },
                { count: mode === 'full' ? 50 : 20, label: mode === 'full' ? (lang === 'bn' ? '৫০টি' : '50') : (lang === 'bn' ? '২০টি' : '20') },
                { count: mode === 'full' ? 25 : 10, label: mode === 'full' ? (lang === 'bn' ? '২৫টি' : '25') : (lang === 'bn' ? '১০টি' : '10') },
                { count: mode === 'full' ? 10 : 5, label: mode === 'full' ? (lang === 'bn' ? '১০টি' : '10') : (lang === 'bn' ? '৫টি' : '5') },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.count}
                  onClick={() => handleCountChange(opt.count)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all ${
                    questionCount === opt.count
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Allocation Customization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {tr.get('allocatedTime')}
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isCustomTime
                  ? (lang === 'bn' ? 'কাস্টম সময়' : 'Custom time')
                  : (lang === 'bn' ? '০.৫ মিনিট/প্রশ্ন (ডিফল্ট)' : '0.5 min/question (default)')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {lang === 'bn' ? 'মোট পরীক্ষা সময়:' : 'Total Exam Duration:'}
                </span>
                <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  {isCustomTime ? customTimeMinutes : Math.max(1, Math.round(questionCount * 0.5))}{' '}
                  {tr.get('minutes')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCustomTime(!isCustomTime)}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  {isCustomTime
                    ? (lang === 'bn' ? 'ডিফল্ট সময়ে ফিরুন (০.৫ মিনিট/প্রশ্ন)' : 'Use default timing (0.5m/q)')
                    : (lang === 'bn' ? 'সময় নিজে পরিবর্তন করুন' : 'Customize time manually')}
                </button>
              </div>

              {isCustomTime && (
                <div className="pt-2 flex items-center space-x-3">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={customTimeMinutes}
                    onChange={(e) => setCustomTimeMinutes(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold w-12 text-right">
                    {customTimeMinutes} m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Auto Submit Option */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSubmitOnTimeUp}
                onChange={(e) => setAutoSubmitOnTimeUp(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 block">
                  {tr.get('autoSubmitOption')}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  {lang === 'bn'
                    ? 'কাউন্টডাউন ০:০০ হলে স্বয়ংক্রিয়ভাবে খাতা জমা হয়ে ফলাফল চলে আসবে।'
                    : 'When countdown reaches 0:00, paper will be submitted automatically.'}
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold flex items-center space-x-2 shadow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{tr.get('startExam')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
