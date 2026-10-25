export type Language = 'bn' | 'en';

export type ThemeName = 'emerald' | 'indigo' | 'crimson';
export type ColorMode = 'light' | 'dark';
export type ExamDisplayMode = 'continuous' | 'jam';

export type SubjectId =
  | 'bangla'
  | 'english'
  | 'bangladesh'
  | 'international'
  | 'geography'
  | 'science'
  | 'ict'
  | 'math'
  | 'mental_ability'
  | 'ethics';

export interface SubjectInfo {
  id: SubjectId;
  nameBn: string;
  nameEn: string;
  icon: string;
  color: string;
  descriptionBn: string;
  descriptionEn: string;
  officialMarks: number; // In standard 200 marks BCS exam
}

export interface Question {
  id: string;
  question: string;
  questionEn?: string;
  options: [string, string, string, string];
  optionsEn?: [string, string, string, string];
  correctAnswer: number; // 0, 1, 2, 3
  subjectId: SubjectId;
  subject: string;
  subjectEn?: string;
  topic?: string;
  topicEn?: string;
  difficulty?: 'easy' | 'medium' | 'hard'; // strictly kept internal, never displayed as a label
  explanation: string;
  explanationEn?: string;
  reference: string; // Authentic source/citation
  isAiGenerated?: boolean;
}

export interface ExamConfig {
  candidateName: string;
  mode: 'full' | 'subject';
  subjectId?: SubjectId;
  totalQuestions: number;
  durationMinutes: number; // default totalQuestions * 0.5
  autoSubmitOnTimeUp: boolean;
  displayMode: ExamDisplayMode; // 'continuous' or 'jam' (vocabulary jam style)
}

export interface ExamSession {
  id: string;
  config: ExamConfig;
  questions: Question[];
  selectedAnswers: Record<string, number>; // questionId -> optionIndex
  flaggedQuestions: Record<string, boolean>;
  startTime: number;
  timeRemainingSeconds: number;
  isCompleted: boolean;
  submittedAt?: number;
}

export interface SubjectScoreBreakdown {
  subjectId: SubjectId;
  subjectNameBn: string;
  subjectNameEn: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  marks: number;
  accuracy: number;
}

export interface WeakTopicRecommendation {
  subjectId: SubjectId;
  subjectNameBn: string;
  subjectNameEn: string;
  accuracy: number;
  adviceBn: string;
  adviceEn: string;
  suggestedTopicsBn: string[];
  suggestedTopicsEn: string[];
}

export interface AiDiagnosticAnalysis {
  summary: string;
  readinessScore: number;
  readinessGrade: string;
  strengths: string[];
  criticalGaps: string[];
  strategicTips: string[];
  revisionRoadmap: {
    day: string;
    subject: string;
    focus: string;
    action: string;
  }[];
}

export interface ExamResult {
  id: string;
  userId?: string;
  candidateName: string;
  date: string;
  timestamp: number;
  mode: 'full' | 'subject';
  subjectName?: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalMarks: number; // correct * 1 - incorrect * 0.5
  negativePenalty: number; // incorrect * 0.5
  percentage: number;
  timeSpentSeconds: number;
  totalAllocatedSeconds: number;
  subjectBreakdown: SubjectScoreBreakdown[];
  recommendations: WeakTopicRecommendation[];
  questions: Question[];
  userAnswers: Record<string, number>;
  aiAnalysis?: AiDiagnosticAnalysis;
}
