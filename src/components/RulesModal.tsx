import React from 'react';
import { X, ShieldAlert, Award, Clock, Lock, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { Language } from '../types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-700/50 rounded-lg">
              <Award className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {lang === 'bn' ? 'বিসিএস প্রিলিমিনারি পরীক্ষার বিস্তারিত নিয়মাবলী' : 'BCS Preliminary Exam Detailed Rules'}
              </h2>
              <p className="text-xs text-emerald-100">
                {lang === 'bn' ? 'বাংলাদেশ সরকারি কর্ম কমিশন (BPSC) প্রমিত মানদণ্ড' : 'BPSC Standard Guidelines & Criteria'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm leading-relaxed">
          {/* Rule 1: Question Format */}
          <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900">
                {lang === 'bn' ? '১. প্রশ্ন কাঠামো ও সিলেবাস' : '1. Question Structure & Syllabus'}
              </h3>
              <p className="text-slate-600 mt-1">
                {lang === 'bn'
                  ? 'পূর্ণাঙ্গ মডেল টেস্টে মোট ১০০টি বহুনির্বাচনী (MCQ) প্রশ্ন থাকবে। প্রতিটি প্রশ্নের জন্য চারটি করে অপশন থাকবে। প্রশ্নগুলো বিসিএসের ১০টি নির্ধারিত বিষয়ের আনুপাতিক সমন্বয়ে গঠিত।'
                  : 'The full mock test contains 100 MCQs with 4 options each, proportionately covering all 10 standard BCS preliminary subjects.'}
              </p>
            </div>
          </div>

          {/* Rule 2: Marking Scheme */}
          <div className="flex items-start space-x-3 p-3.5 bg-rose-50 rounded-xl border border-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900">
                {lang === 'bn' ? '২. নম্বর বণ্টন ও নেগেটিভ মার্কিং' : '2. Marking Scheme & Negative Penalty'}
              </h3>
              <ul className="text-rose-800 mt-1.5 space-y-1 list-disc list-inside">
                <li>
                  <strong>{lang === 'bn' ? 'সঠিক উত্তর:' : 'Correct Answer:'}</strong> {lang === 'bn' ? '+১.০ নম্বর যোগ হবে।' : '+1.0 mark added.'}
                </li>
                <li>
                  <strong>{lang === 'bn' ? 'ভুল উত্তর:' : 'Wrong Answer:'}</strong> {lang === 'bn' ? '-০.৫ (অর্ধেক) নম্বর কাটা যাবে।' : '-0.5 mark deducted.'}
                </li>
                <li>
                  <strong>{lang === 'bn' ? 'উত্তর না দিলে:' : 'Unattempted:'}</strong> {lang === 'bn' ? 'কোনো নম্বর কাটা যাবে না (০ নম্বর)।' : 'No marks deducted (0 marks).'}
                </li>
              </ul>
            </div>
          </div>

          {/* Rule 3: Option Lock Rule */}
          <div className="flex items-start space-x-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">
                {lang === 'bn' ? '৩. অপশন লক নিয়ম (পরিবর্তন অযোগ্য)' : '3. Instant Lock Rule (Irreversible)'}
              </h3>
              <p className="text-amber-800 mt-1">
                {lang === 'bn'
                  ? 'প্রকৃত ওএমআর (OMR) শিটের মতো কোনো প্রশ্নে একবার বৃত্ত ভরাট/অপশন ক্লিক করলে তা তাৎক্ষণিকভাবে লক বা নিষ্ক্রিয় হয়ে যাবে। পরবর্তীতে কোনো অপশন পরিবর্তন করা যাবে না। তাই ভেবেচিন্তে সিদ্ধান্ত নিন।'
                  : 'Like an actual physical OMR sheet, once you tap an option, it is immediately locked and cannot be changed. Choose cautiously.'}
              </p>
            </div>
          </div>

          {/* Rule 4: Time Limit & Auto-Submit */}
          <div className="flex items-start space-x-3 p-3.5 bg-blue-50 rounded-xl border border-blue-200">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">
                {lang === 'bn' ? '৪. সময়সীমা ও অটো-সাবমিট' : '4. Time Allocation & Auto-Submit'}
              </h3>
              <p className="text-blue-800 mt-1">
                {lang === 'bn'
                  ? 'ডিফল্ট হিসেবে প্রতি প্রশ্নের জন্য আধা মিনিট বা ৩০ সেকেন্ড সময় বরাদ্দ (১০০ প্রশ্নে ৫০ মিনিট)। তবে পরীক্ষা শুরুর পূর্বে আপনি নিজের প্রয়োজনমতো সময় ও প্রশ্নসংখ্যা কাস্টমাইজ করতে পারবেন। নির্ধারিত সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে সাবমিট হয়ে যাবে।'
                  : 'Default allocation is 30 seconds (0.5 minute) per question (50 mins for 100 questions). You may customize questions and time before starting. The test will automatically submit when the countdown expires.'}
              </p>
            </div>
          </div>

          {/* Rule 5: State Persistence */}
          <div className="flex items-start space-x-3 p-3.5 bg-teal-50 rounded-xl border border-teal-200">
            <BookOpen className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-teal-900">
                {lang === 'bn' ? '৫. প্রার্থীর নাম ও রিলোড রিকভারি' : '5. Candidate Profile & State Persistence'}
              </h3>
              <p className="text-teal-800 mt-1">
                {lang === 'bn'
                  ? 'আপনার নাম এবং চলমান পরীক্ষার সমস্ত অগ্রগতি (বাকি সময়, উত্তরসমূহ) ব্রাউজারের মেমরিতে সংরক্ষিত থাকে। ভুলবশত পেজ বন্ধ বা রিলোড হলেও কোনো ক্ষতি ছাড়াই পরীক্ষা আবার চালু করতে পারবেন।'
                  : 'Your candidate name and in-progress exam state (remaining time, locked responses) are stored in the browser, enabling seamless resume if disconnected or refreshed.'}
              </p>
            </div>
          </div>

          {/* Rule 6: Retake & Randomization */}
          <div className="flex items-start space-x-3 p-3.5 bg-purple-50 rounded-xl border border-purple-200">
            <AlertTriangle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900">
                {lang === 'bn' ? '৬. পুনরায় পরীক্ষা ও র্যান্ডম ক্রম' : '6. Retake & Shuffling'}
              </h3>
              <p className="text-purple-800 mt-1">
                {lang === 'bn'
                  ? 'ফলাফল প্রকাশের পর প্রতিটি প্রশ্নের নির্ভুল উত্তর, পূর্ণাঙ্গ ব্যাখ্যা ও তথ্যসূত্র দেখতে পাবেন। পুনরায় পরীক্ষা দিলে প্রশ্নের ক্রম এবং ৪টি অপশনের ক্রম স্বয়ংক্রিয়ভাবে পরিবর্তন (Shuffle) হয়ে আসবে।'
                  : 'After submission, explore comprehensive explanations and citations. Retaking the exam automatically randomizes both the question order and option arrangements.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm"
          >
            {lang === 'bn' ? 'বুঝেছি, বন্ধ করুন' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
