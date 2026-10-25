import React from 'react';
import {
  BookOpen,
  Languages,
  Landmark,
  Globe2,
  Compass,
  Atom,
  Cpu,
  Calculator,
  Brain,
  Scale,
  Play,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Language, SubjectId, SubjectInfo } from '../types';
import { BCS_SUBJECTS } from '../data/subjects';
import { getQuestionBank } from '../data/questionBank';

interface TopicExamTabProps {
  onSelectSubjectForExam: (subjectId: SubjectId) => void;
  lang: Language;
  currentUser?: FirebaseUser | null;
  onRequireLogin: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5" />,
  Languages: <Languages className="w-5 h-5" />,
  Landmark: <Landmark className="w-5 h-5" />,
  Globe2: <Globe2 className="w-5 h-5" />,
  Compass: <Compass className="w-5 h-5" />,
  Atom: <Atom className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
};

export const TopicExamTab: React.FC<TopicExamTabProps> = ({
  onSelectSubjectForExam,
  lang,
  currentUser,
  onRequireLogin,
}) => {
  const allQuestions = getQuestionBank();

  // Count questions available per subject
  const getSubjectQuestionCount = (subId: SubjectId) => {
    return allQuestions.filter((q) => q.subjectId === subId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Login Required Notice Banner */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4 border border-amber-300/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {lang === 'bn'
                  ? 'বিষয়ভিত্তিক মডেল টেস্টে অংশ নিতে লগইন বাধ্যতামূলক'
                  : 'Login Required for Subject-wise Mock Tests'}
              </h3>
              <p className="text-xs text-white/90">
                {lang === 'bn'
                  ? 'গুগল দিয়ে লগইন করলেই যে কোনো বিষয়ে পরীক্ষা দেওয়া যাবে ও প্রশ্নব্যাংক সমৃদ্ধ হবে।'
                  : 'Sign in to access all subject tests and unlock cloud-stored AI question enrichment.'}
              </p>
            </div>
          </div>
          <button
            onClick={onRequireLogin}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-sm transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'সাইন ইন করুন' : 'Sign In'}</span>
          </button>
        </div>
      )}

      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="max-w-2xl relative z-10 space-y-2">
          <span className="text-xs font-bold text-teal-200 uppercase tracking-wider bg-teal-800/80 px-3 py-1 rounded-full border border-teal-600/40">
            {lang === 'bn' ? '১০টি বিষয়ের পৃথক প্রস্তুতি' : 'Topic-wise Preparation'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {lang === 'bn' ? 'বিসিএস বিষয়ভিত্তিক মডেল টেস্ট' : 'BCS Subject-wise Mock Tests'}
          </h1>
          <p className="text-sm text-teal-100 leading-relaxed">
            {lang === 'bn'
              ? 'আপনার দুর্বল বা প্রিয় বিষয়টি নির্বাচন করে একক বিষয়ের ওপর পরীক্ষা দিন। প্রতিটি পরীক্ষায় থাকবে তাৎক্ষণিক অপশন লক, নেগেটিভ মার্কিং (-০.৫) ও বিস্তারিত বিশ্লেষণ।'
              : 'Choose any subject to test your topic strength with standard time, locking rules, and instant in-depth feedback.'}
          </p>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {BCS_SUBJECTS.map((sub: SubjectInfo) => {
          const availableCount = getSubjectQuestionCount(sub.id);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {iconMap[sub.icon] || <BookOpen className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {lang === 'bn' ? `সিলেবাস: ${sub.officialMarks} নম্বর` : `Syllabus: ${sub.officialMarks} marks`}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                    {lang === 'bn' ? sub.nameBn : sub.nameEn}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {lang === 'bn' ? sub.descriptionBn : sub.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {availableCount} {lang === 'bn' ? 'টি প্রশ্ন প্রস্তুত' : 'questions ready'}
                </span>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onRequireLogin();
                    } else {
                      onSelectSubjectForExam(sub.id);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-semibold text-xs flex items-center space-x-1.5 border border-emerald-200 group-hover:border-emerald-600 transition-all"
                >
                  {currentUser ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{lang === 'bn' ? 'টেস্ট দিন' : 'Start Test'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'লগইন করে টেস্ট' : 'Sign in to Test'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
