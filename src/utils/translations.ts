import { Language } from '../types';

export const t = (lang: Language) => {
  const dict = {
    appName: {
      bn: 'বিসিএস প্রিলিমিনারি মডেল টেস্ট',
      en: 'BCS Preliminary Mock Test',
    },
    appSubtitle: {
      bn: '১০০ নম্বরের প্রমিত পরীক্ষা • নেগেটিভ মার্কিং (-০.৫) • জেমিনি এআই প্রশ্নব্যাংক',
      en: '100-mark Standard Exam • Negative Marking (-0.5) • Gemini AI Question Bank',
    },
    tabFullExam: {
      bn: 'পূর্ণাঙ্গ মডেল টেস্ট',
      en: 'Full Mock Test',
    },
    tabSubjectExam: {
      bn: 'বিষয়ভিত্তিক পরীক্ষা',
      en: 'Subject-wise Tests',
    },
    tabAiBank: {
      bn: 'এআই প্রশ্নব্যাংক ও লোড মোর',
      en: 'AI Question Bank & Live',
    },
    tabHistory: {
      bn: 'ফলাফল ও ইতিহাস',
      en: 'Results & History',
    },
    rulesBtn: {
      bn: 'পরীক্ষার নিয়মাবলী',
      en: 'Exam Rules',
    },
    candidateNameLabel: {
      bn: 'প্রার্থীর নাম',
      en: 'Candidate Name',
    },
    enterNamePlaceholder: {
      bn: 'আপনার পূর্ণ নাম লিখুন...',
      en: 'Enter your full name...',
    },
    nameSavedNotice: {
      bn: 'আপনার নাম এবং অগ্রগতি ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।',
      en: 'Your name and progress are automatically saved in the browser.',
    },
    startExam: {
      bn: 'পরীক্ষা শুরু করুন',
      en: 'Start Exam',
    },
    resumeExam: {
      bn: 'অসমাপ্ত পরীক্ষা চালিয়ে যান',
      en: 'Resume Incomplete Exam',
    },
    discardAndNew: {
      bn: 'নতুন পরীক্ষা শুরু করুন',
      en: 'Start Fresh Exam',
    },
    customQuestions: {
      bn: 'প্রশ্ন সংখ্যা',
      en: 'Number of Questions',
    },
    allocatedTime: {
      bn: 'নির্ধারিত সময়',
      en: 'Allocated Time',
    },
    minutes: {
      bn: 'মিনিট',
      en: 'Minutes',
    },
    defaultTimeRule: {
      bn: 'প্রতি প্রশ্নে ৩০ সেকেন্ড (০.৫ মিনিট) হিসেবে',
      en: 'At 30 seconds (0.5 min) per question',
    },
    autoSubmitOption: {
      bn: 'সময় শেষ হলে স্বয়ংক্রিয়ভাবে সাবমিট হবে',
      en: 'Auto-submit immediately when time runs out',
    },
    negativeMarkingRule: {
      bn: 'সঠিক উত্তর: +১ | ভুল উত্তর: -০.৫ | উত্তর না দিলে: ০',
      en: 'Correct: +1 | Wrong: -0.5 | Unanswered: 0',
    },
    lockWarning: {
      bn: 'সতর্কতা: একবার অপশন নির্বাচন করলে তা লক হয়ে যাবে এবং পরিবর্তন করা যাবে না।',
      en: 'Notice: Once an option is selected, it will be locked and cannot be changed.',
    },
    answered: {
      bn: 'উত্তর দেওয়া হয়েছে',
      en: 'Answered',
    },
    unanswered: {
      bn: 'বাকি আছে',
      en: 'Remaining',
    },
    flagged: {
      bn: 'পর্যালোচনা চিহ্নিত',
      en: 'Flagged',
    },
    submitExamBtn: {
      bn: 'পরীক্ষা জমা দিন',
      en: 'Submit Exam',
    },
    confirmSubmitTitle: {
      bn: 'আপনি কি নিশ্চিত যে সাবমিট করতে চান?',
      en: 'Are you sure you want to submit?',
    },
    confirmSubmitWarning: (count: number) => ({
      bn: `আপনার এখনও ${count}টি প্রশ্ন অনুত্তরিত রয়েছে! আপনি কি এখনই পরীক্ষা সমাপ্ত করতে চান?`,
      en: `You still have ${count} unanswered questions! Do you want to submit now?`,
    }),
    confirmSubmitAllDone: {
      bn: 'আপনি সকল প্রশ্নের উত্তর সম্পন্ন করেছেন। সাবমিট করতে নিশ্চিত বাটনে ক্লিক করুন।',
      en: 'You have answered all questions. Click confirm to submit.',
    },
    cancelBtn: {
      bn: 'ফিরে যান',
      en: 'Cancel / Review',
    },
    confirmSubmitBtn: {
      bn: 'হ্যাঁ, সাবমিট করুন',
      en: 'Yes, Submit Now',
    },
    timeExpiredTitle: {
      bn: 'সময় শেষ!',
      en: 'Time is Up!',
    },
    timeExpiredMsg: {
      bn: 'আপনার নির্ধারিত পরীক্ষার সময় সমাপ্ত হয়েছে। আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা নেওয়া হচ্ছে...',
      en: 'Your exam time has expired. Your test is being auto-submitted...',
    },
    resultTitle: {
      bn: 'পরীক্ষার চূড়ান্ত ফলাফল ও বিশ্লেষণ',
      en: 'Final Exam Result & Analytics',
    },
    scoreObtained: {
      bn: 'প্রাপ্ত নম্বর',
      en: 'Score Obtained',
    },
    correctCount: {
      bn: 'সঠিক উত্তর',
      en: 'Correct Answers',
    },
    incorrectCount: {
      bn: 'ভুল উত্তর',
      en: 'Wrong Answers',
    },
    skippedCount: {
      bn: 'বাদ দেওয়া প্রশ্ন',
      en: 'Skipped Questions',
    },
    negativePenalty: {
      bn: 'নেগেটিভ মার্কস কর্তন',
      en: 'Negative Mark Deduction',
    },
    timeUsed: {
      bn: 'ব্যবহৃত সময়',
      en: 'Time Taken',
    },
    accuracyRate: {
      bn: 'সঠিকতার হার (Accuracy)',
      en: 'Accuracy Rate',
    },
    subjectAnalysisTitle: {
      bn: 'বিষয়ভিত্তিক মূল্যায়ন ও দুর্বলতা বিশ্লেষণ',
      en: 'Subject-wise Performance & Gap Analysis',
    },
    weakTopicAdviceTitle: {
      bn: 'ভবিষ্যতে ভালো করার জন্য পরামর্শ ও দিকনির্দেশনা',
      en: 'Actionable Study Recommendations for Weak Areas',
    },
    practiceWeakTopic: {
      bn: 'এই বিষয়ের ওপর স্পেশাল টেস্ট দিন',
      en: 'Practice this subject now',
    },
    retakeExam: {
      bn: 'পুনরায় পরীক্ষা দিন (র্যান্ডম ক্রমসহ)',
      en: 'Retake Exam (Randomized Questions & Options)',
    },
    reviewQuestions: {
      bn: 'প্রশ্নোত্তর, সঠিক উত্তর, ব্যাখ্যা ও তথ্যসূত্র',
      en: 'Detailed Answer Review, Explanations & Citations',
    },
    yourAnswer: {
      bn: 'আপনার উত্তর',
      en: 'Your Answer',
    },
    correctAnswerLabel: {
      bn: 'সঠিক উত্তর',
      en: 'Correct Answer',
    },
    notAnsweredLabel: {
      bn: 'উত্তর দেওয়া হয়নি (বাদ)',
      en: 'Not Attempted (Skipped)',
    },
    explanationLabel: {
      bn: 'বিস্তারিত ব্যাখ্যা',
      en: 'Detailed Explanation',
    },
    referenceLabel: {
      bn: 'তথ্যসূত্র ও উৎস',
      en: 'Source & Citation',
    },
    aiLoadMoreBtn: {
      bn: 'জেমিনি এআই দিয়ে আরও প্রশ্ন খুঁজুন',
      en: 'Fetch More Questions with Gemini AI',
    },
    loadingQuestions: {
      bn: 'জেমিনি এআই ইন্টারনেট থেকে যাচাইকৃত প্রশ্ন অনুসন্ধান করছে...',
      en: 'Gemini AI is searching and verifying authentic questions...',
    },
    startQuizWithAi: {
      bn: 'এই প্রশ্নগুলো দিয়ে কুইজ শুরু করুন',
      en: 'Start Quiz with These Questions',
    },
    allSubjects: {
      bn: 'সকল বিষয় (মিক্সড)',
      en: 'All Subjects (Mixed)',
    },
    searchPlaceholder: {
      bn: 'প্রশ্ন বা টপিক খুঁজুন...',
      en: 'Search questions or topics...',
    },
  };

  return {
    ...dict,
    get: (key: keyof typeof dict) => {
      const val = dict[key];
      if (typeof val === 'object' && val !== null && 'bn' in val && 'en' in val) {
        return (val as any)[lang];
      }
      return '';
    },
  };
};
