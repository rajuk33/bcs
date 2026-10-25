import { ExamSession, ExamResult, Question } from '../types';

const CANDIDATE_NAME_KEY = 'bcs_candidate_name';
const ACTIVE_SESSION_KEY = 'bcs_active_session_v1';
const EXAM_RESULTS_KEY = 'bcs_exam_results_v1';
const APP_SETTINGS_KEY = 'bcs_app_settings_v1';

export const getStoredCandidateName = (): string => {
  return localStorage.getItem(CANDIDATE_NAME_KEY) || '';
};

export const saveCandidateName = (name: string): void => {
  if (name.trim()) {
    localStorage.setItem(CANDIDATE_NAME_KEY, name.trim());
  }
};

export const getActiveSession = (): ExamSession | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const session: ExamSession = JSON.parse(raw);
    if (session && !session.isCompleted && session.questions && session.questions.length > 0) {
      return session;
    }
  } catch (e) {
    console.error('Failed to parse active session:', e);
  }
  return null;
};

export const saveActiveSession = (session: ExamSession): void => {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
};

export const clearActiveSession = (): void => {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
};

export const getExamHistory = (): ExamResult[] => {
  try {
    const raw = localStorage.getItem(EXAM_RESULTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse exam history:', e);
    return [];
  }
};

export const saveExamResult = (result: ExamResult): void => {
  try {
    const history = getExamHistory();
    history.unshift(result);
    // keep latest 30 results
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(history.slice(0, 30)));
    clearActiveSession();
  } catch (e) {
    console.error('Failed to save exam result:', e);
  }
};

export const deleteExamResult = (id: string): void => {
  try {
    const history = getExamHistory().filter(r => r.id !== id);
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to delete result:', e);
  }
};

// Shuffles both the questions AND options while accurately keeping track of the correct answer index
export const shuffleQuestionsAndOptions = (questions: Question[]): Question[] => {
  // First shuffle questions array (Fisher-Yates)
  const qList = [...questions];
  for (let i = qList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [qList[i], qList[j]] = [qList[j], qList[i]];
  }

  // Then shuffle the 4 options of each question and update correctAnswer index
  return qList.map((q) => {
    const originalOptions = [...q.options];
    const originalOptionsEn = q.optionsEn ? [...q.optionsEn] : undefined;
    const correctText = originalOptions[q.correctAnswer];

    // Create array of indices [0, 1, 2, 3] and shuffle
    const indices = [0, 1, 2, 3];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledOptions: [string, string, string, string] = [
      originalOptions[indices[0]],
      originalOptions[indices[1]],
      originalOptions[indices[2]],
      originalOptions[indices[3]],
    ];

    const shuffledOptionsEn: [string, string, string, string] | undefined = originalOptionsEn
      ? [
          originalOptionsEn[indices[0]],
          originalOptionsEn[indices[1]],
          originalOptionsEn[indices[2]],
          originalOptionsEn[indices[3]],
        ]
      : undefined;

    const newCorrectIndex = shuffledOptions.indexOf(correctText);

    return {
      ...q,
      options: shuffledOptions,
      optionsEn: shuffledOptionsEn,
      correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    };
  });
};
