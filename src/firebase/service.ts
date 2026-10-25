import {
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { ExamResult, ExamSession, Question } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  return JSON.parse(JSON.stringify(data));
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In with Popup
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      // Sync basic user document
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(
        userRef,
        sanitizeForFirestore({
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || '',
          photoURL: cred.user.photoURL || '',
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
      return cred.user;
    }
    return null;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

// Sign out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

export interface UserPreferences {
  theme: 'emerald' | 'indigo' | 'crimson';
  colorMode: 'light' | 'dark';
  examDisplayMode: 'continuous' | 'jam';
  candidateName: string;
  preferredLanguage: 'bn' | 'en';
  autoSubmitOnTimeUp: boolean;
}

// Save User Settings & Preferences to Firebase
export async function saveUserPreferencesToCloud(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<void> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
    await setDoc(
      prefRef,
      sanitizeForFirestore({
        ...prefs,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Load User Settings from Firebase
export async function getUserPreferencesFromCloud(
  userId: string
): Promise<Partial<UserPreferences> | null> {
  const path = `users/${userId}/settings/preferences`;
  try {
    const prefRef = doc(db, 'users', userId, 'settings', 'preferences');
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserPreferences>;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Save Exam Result to Firebase
export async function saveExamResultToCloud(
  userId: string,
  result: ExamResult
): Promise<void> {
  const path = `users/${userId}/exam_history/${result.id}`;
  try {
    const resultRef = doc(db, 'users', userId, 'exam_history', result.id);
    await setDoc(
      resultRef,
      sanitizeForFirestore({
        ...result,
        userId,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch user's exam history from Firebase
export async function fetchExamHistoryFromCloud(
  userId: string
): Promise<ExamResult[]> {
  const path = `users/${userId}/exam_history`;
  try {
    const historyCol = collection(db, 'users', userId, 'exam_history');
    const q = query(historyCol, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ExamResult);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Delete exam record from Firebase
export async function deleteExamResultFromCloud(
  userId: string,
  examId: string
): Promise<void> {
  const path = `users/${userId}/exam_history/${examId}`;
  try {
    const resultRef = doc(db, 'users', userId, 'exam_history', examId);
    await deleteDoc(resultRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save active in-progress session to Firebase
export async function saveActiveSessionToCloud(
  userId: string,
  session: ExamSession
): Promise<void> {
  const path = `users/${userId}/active_session/current`;
  try {
    const sessionRef = doc(db, 'users', userId, 'active_session', 'current');
    await setDoc(
      sessionRef,
      sanitizeForFirestore({
        ...session,
        userId,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Clear active session from Firebase
export async function clearActiveSessionFromCloud(userId: string): Promise<void> {
  const path = `users/${userId}/active_session/current`;
  try {
    const sessionRef = doc(db, 'users', userId, 'active_session', 'current');
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save newly generated AI questions to the shared Firebase Question Bank
export async function saveQuestionsToCloudBank(
  userId: string,
  questions: Question[]
): Promise<number> {
  let savedCount = 0;
  for (const q of questions) {
    const questionId = q.id || `ai_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `question_bank/${questionId}`;
    try {
      const qRef = doc(db, 'question_bank', questionId);
      await setDoc(
        qRef,
        sanitizeForFirestore({
          ...q,
          id: questionId,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        })
      );
      savedCount++;
    } catch (error) {
      console.warn(`Failed to save question ${questionId} to cloud bank:`, error);
    }
  }
  return savedCount;
}

// Fetch all shared questions from Firebase Question Bank
export async function fetchQuestionsFromCloudBank(): Promise<Question[]> {
  const path = 'question_bank';
  try {
    const colRef = collection(db, 'question_bank');
    const q = query(colRef, limit(200));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        question: data.question,
        questionEn: data.questionEn,
        options: data.options,
        optionsEn: data.optionsEn,
        correctAnswer: data.correctAnswer,
        subjectId: data.subjectId,
        subject: data.subject,
        subjectEn: data.subjectEn,
        topic: data.topic,
        topicEn: data.topicEn,
        difficulty: data.difficulty,
        explanation: data.explanation,
        explanationEn: data.explanationEn,
        reference: data.reference,
        isAiGenerated: true,
      } as Question;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
