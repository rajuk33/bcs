import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Award,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorMode, ExamResult, Language, ThemeName } from '../types';
import { getExamHistory, deleteExamResult } from '../utils/storage';
import { deleteExamResultFromCloud, fetchExamHistoryFromCloud } from '../firebase/service';
import { t } from '../utils/translations';
import { THEME_CONFIGS } from '../utils/theme';

interface HistoryTabProps {
  onViewResult: (result: ExamResult) => void;
  lang: Language;
  theme?: ThemeName;
  colorMode?: ColorMode;
  currentUser?: FirebaseUser | null;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  onViewResult,
  lang,
  theme = 'emerald',
  colorMode = 'light',
  currentUser,
}) => {
  const tr = t(lang);
  const isDark = colorMode === 'dark';
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;

  const [history, setHistory] = useState<ExamResult[]>(() => getExamHistory());
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Sync with Firestore if logged in
  useEffect(() => {
    if (currentUser) {
      loadCloudHistory(currentUser.uid);
    }
  }, [currentUser]);

  const loadCloudHistory = async (uid: string) => {
    setIsLoadingCloud(true);
    try {
      const cloudRecords = await fetchExamHistoryFromCloud(uid);
      if (cloudRecords && cloudRecords.length > 0) {
        // Merge with local storage
        const map = new Map<string, ExamResult>();
        getExamHistory().forEach((r) => map.set(r.id, r));
        cloudRecords.forEach((r) => map.set(r.id, r));
        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        setHistory(merged);
      }
    } catch (e) {
      console.error('Error fetching cloud history:', e);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteExamResult(id);
    if (currentUser) {
      try {
        await deleteExamResultFromCloud(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete from cloud:', err);
      }
    }
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950'}`}>
        <div className="max-w-xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-600/40">
              {lang === 'bn' ? 'ব্যক্তিগত পারফরম্যান্স ট্র্যাকিং' : 'Personal Performance History'}
            </span>
            {currentUser && (
              <span className="text-xs font-semibold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Firebase Cloud</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lang === 'bn' ? 'পূর্ববর্তী পরীক্ষার রেকর্ড ও ফলাফল' : 'Past Exam Records & History'}
          </h1>
          <p className="text-sm text-slate-300">
            {lang === 'bn'
              ? 'আপনার সম্পন্ন করা সকল পরীক্ষার ফলাফল, প্রাপ্ত নম্বর, নেগেটিভ মার্কস এবং জেমিনি এআই অ্যানালাইসিস এখানে সংরক্ষিত থাকে।'
              : 'Review your complete score logs, negative marks, and AI diagnostic reports.'}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.length > 0 ? (
          history.map((record) => {
            const isPassing = record.percentage >= 60;
            const spentMin = Math.floor(record.timeSpentSeconds / 60);
            const spentSec = record.timeSpentSeconds % 60;

            return (
              <div
                key={record.id}
                onClick={() => onViewResult(record)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 group ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="space-y-1.5 min-w-[240px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {record.mode === 'full'
                        ? (lang === 'bn' ? '১০০ মার্কস পূর্ণাঙ্গ টেস্ট' : '100-mark Full Test')
                        : (lang === 'bn' ? `${record.subjectName || ''} টেস্ট` : `${record.subjectName || ''} Test`)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{record.date}</span>
                    </span>
                    {record.aiAnalysis && (
                      <span className="flex items-center space-x-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5 fill-amber-500" />
                        <span>AI Evaluated</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base group-hover:text-emerald-500 transition-colors">
                    {record.candidateName}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{spentMin}m {spentSec}s</span>
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      ✓ {record.correctCount} {lang === 'bn' ? 'সঠিক' : 'correct'}
                    </span>
                    <span className="text-rose-500 font-semibold">
                      ✗ {record.incorrectCount} {lang === 'bn' ? 'ভুল' : 'wrong'}
                    </span>
                    <span className="font-medium">
                      ○ {record.skippedCount} {lang === 'bn' ? 'বাদ' : 'skipped'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {record.totalMarks}
                      <span className="text-xs font-normal text-slate-500"> / {record.totalQuestions}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block ${
                        isPassing ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {record.percentage}% {lang === 'bn' ? 'নম্বর' : 'score'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResult(record);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={lang === 'bn' ? 'ফলাফল দেখুন' : 'View Result'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={lang === 'bn' ? 'রেকর্ড মুছুন' : 'Delete Record'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`text-center py-16 rounded-3xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="text-base font-semibold">
              {lang === 'bn' ? 'এখনও কোনো পরীক্ষার রেকর্ড নেই' : 'No past exam records found'}
            </p>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'একটি টেস্ট সম্পন্ন করলে ফলাফল এখানে সংরক্ষিত হবে।' : 'Complete an exam to see your history here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
