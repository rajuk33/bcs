import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  Play,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  Tag,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorMode, Language, Question, SubjectId, ThemeName } from '../types';
import { BCS_SUBJECTS } from '../data/subjects';
import { getQuestionBank, saveQuestionsToBank } from '../data/questionBank';
import { saveQuestionsToCloudBank } from '../firebase/service';
import { t } from '../utils/translations';

interface AiQuestionBankTabProps {
  onStartCustomQuiz: (questions: Question[]) => void;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
  currentUser?: FirebaseUser | null;
  onRequireLogin: () => void;
}

export const AiQuestionBankTab: React.FC<AiQuestionBankTabProps> = ({
  onStartCustomQuiz,
  lang,
  colorMode = 'light',
  currentUser,
  onRequireLogin,
}) => {
  const tr = t(lang);
  const isDark = colorMode === 'dark';

  const [questions, setQuestions] = useState<Question[]>(() => getQuestionBank());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Generator panel state
  const [targetSubject, setTargetSubject] = useState<string>('bangla');
  const [targetTopic, setTargetTopic] = useState<string>('');
  const [targetCount, setTargetCount] = useState<number>(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newlyFetchedQuestions, setNewlyFetchedQuestions] = useState<Question[]>([]);

  // Filtered list
  const filtered = questions.filter((q) => {
    const matchesSubject = selectedSubject === 'all' || q.subjectId === selectedSubject;
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.questionEn && q.questionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.reference && q.reference.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Call server-side Gemini API route:
  // "I will also be able to load subject based questions using gemini."
  const handleLoadSubjectQuestions = async () => {
    setIsLoadingMore(true);
    setFetchError(null);

    try {
      const subjectObj = targetSubject !== 'all' ? BCS_SUBJECTS.find((s) => s.id === targetSubject) : null;
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectObj ? subjectObj.nameBn : undefined,
          topic: targetTopic.trim() || undefined,
          count: targetCount,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch authentic BCS questions');
      }

      const incoming: Question[] = data.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        questionEn: q.questionEn,
        options: q.options,
        optionsEn: q.optionsEn,
        correctAnswer: q.correctAnswer,
        subjectId: (subjectObj ? subjectObj.id : (q.subjectId || 'bangla')) as SubjectId,
        subject: q.subject || (subjectObj ? subjectObj.nameBn : 'সাধারণ জ্ঞান'),
        topic: q.topic || targetTopic || 'বিসিএস প্রস্তুতি',
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || 'সঠিক উত্তর যাচাইকৃত।',
        reference: q.reference || 'বিসিএস সিলেবাস ও প্রমিত তথ্যসূত্র',
        isAiGenerated: true,
      }));

      saveQuestionsToBank(incoming);
      if (currentUser) {
        try {
          await saveQuestionsToCloudBank(currentUser.uid, incoming);
        } catch (e) {
          console.warn('Failed to sync generated questions to cloud bank:', e);
        }
      }
      const updatedAll = getQuestionBank();
      setQuestions(updatedAll);
      setNewlyFetchedQuestions(incoming);
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setFetchError(
        lang === 'bn'
          ? `প্রশ্ন লোড করতে সমস্যা হয়েছে: ${err.message || 'অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}`
          : `Failed to load questions: ${err.message || 'Please try again.'}`
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* ========================================================
          GEMINI SUBJECT-BASED QUESTION GENERATOR PANEL
      ======================================================== */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border-emerald-900'}`}>
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 uppercase tracking-wider bg-amber-500/10 w-fit px-3 py-1 rounded-full border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'জেমিনি এআই বিষয়ভিত্তিক জেনারেটর' : 'Gemini Subject Question Generator'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'bn' ? 'যেকোনো বিষয়ের ওপর নতুন প্রশ্ন লোড করুন' : 'Load Subject-Based Questions with Gemini AI'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {lang === 'bn'
              ? 'বিসিএস প্রিলিমিনারির যে বিষয়ের ওপর আপনি অতিরিক্ত অনুশীলন করতে চান তা নির্বাচন করুন। জেমিনি এআই ইন্টারনেট থেকে যাচাইকৃত প্রমিত প্রশ্ন তৈরি করে প্রশ্নব্যাংকে যুক্ত করবে।'
              : 'Select any BCS subject and optional topic to fetch fact-checked standard MCQs via Gemini AI.'}
          </p>

          {/* Interactive Generator Controls */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Subject Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                {lang === 'bn' ? 'বিষয়' : 'Subject'}
              </label>
              <select
                value={targetSubject}
                onChange={(e) => setTargetSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value="all">{lang === 'bn' ? 'মিক্সড (সকল বিষয়)' : 'Mixed (All Subjects)'}</option>
                {BCS_SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'bn' ? s.nameBn : s.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Topic Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                {lang === 'bn' ? 'টপিক (ঐচ্ছিক)' : 'Topic (Optional)'}
              </label>
              <input
                type="text"
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: সংবিধান / সমাস / আলো' : 'e.g. Constitution / Optics'}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                {lang === 'bn' ? 'প্রশ্ন সংখ্যা' : 'Count'}
              </label>
              <select
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/90 text-white border border-slate-700 focus:outline-none focus:border-amber-400"
              >
                <option value={5}>৫টি প্রশ্ন (5 questions)</option>
                <option value={8}>৮টি প্রশ্ন (8 questions)</option>
                <option value={12}>১২টি প্রশ্ন (12 questions)</option>
                <option value={15}>১৫টি প্রশ্ন (15 questions)</option>
              </select>
            </div>

            {/* Generate Action Button */}
            <div className="flex items-end">
              <button
                onClick={handleLoadSubjectQuestions}
                disabled={isLoadingMore}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'প্রশ্ন খোঁজা হচ্ছে...' : 'Fetching...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{lang === 'bn' ? 'জেমিনি দিয়ে লোড করুন' : 'Load with Gemini'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Instant Quiz Notification when questions are loaded */}
      {newlyFetchedQuestions.length > 0 && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              +{newlyFetchedQuestions.length}
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                {lang === 'bn'
                  ? `${newlyFetchedQuestions.length}টি নতুন বিসিএস প্রশ্ন সফলভাবে তৈরি হয়েছে!`
                  : `${newlyFetchedQuestions.length} new BCS questions generated!`}
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-400">
                {lang === 'bn'
                  ? 'এই নতুন প্রশ্নগুলো দিয়ে এখনই একটি স্পেশাল কুইজ শুরু করতে পারেন।'
                  : 'Start an instant quiz with these newly fetched questions.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onRequireLogin();
              } else {
                onStartCustomQuiz(newlyFetchedQuestions);
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{tr.get('startQuizWithAi')}</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className={`p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:border-emerald-500 font-medium ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">{tr.get('allSubjects')}</option>
            {BCS_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'bn' ? s.nameBn : s.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr.get('searchPlaceholder')}
            className={`w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:border-emerald-500 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {lang === 'bn' ? 'টি প্রশ্ন' : 'questions'}
          </span>
          <button
            onClick={() => onStartCustomQuiz(filtered.slice(0, 50))}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{lang === 'bn' ? 'এই তালিকার কুইজ' : 'Quiz List'}</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.map((q, idx) => (
          <div
            key={q.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold">
                  {lang === 'bn' ? q.subject : q.subjectEn || q.subject}
                </span>
                {q.isAiGenerated && (
                  <span className="flex items-center space-x-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Gemini AI</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 italic">
                {q.reference}
              </span>
            </div>

            <h3 className="font-semibold text-sm sm:text-base leading-snug">
              {lang === 'bn' ? q.question : q.questionEn || q.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {q.options.map((opt, optIdx) => {
                const isCorrect = optIdx === q.correctAnswer;
                return (
                  <div
                    key={optIdx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 font-semibold'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>
                      {['ক', 'খ', 'গ', 'ঘ'][optIdx]}. {opt}
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                        {lang === 'bn' ? 'সঠিক উত্তর' : 'Correct'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <span className="font-bold block mb-0.5 text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ব্যাখ্যা:' : 'Explanation:'}
              </span>
              <p>{lang === 'bn' ? q.explanation : q.explanationEn || q.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
