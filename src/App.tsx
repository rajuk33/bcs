import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase/config';
import {
  signInWithGoogle,
  logOut,
  getUserPreferencesFromCloud,
  saveUserPreferencesToCloud,
  saveExamResultToCloud,
  saveActiveSessionToCloud,
  clearActiveSessionFromCloud,
  fetchQuestionsFromCloudBank,
  saveQuestionsToCloudBank,
} from './firebase/service';
import { Header } from './components/Header';
import { RulesModal } from './components/RulesModal';
import { ExamSetupModal } from './components/ExamSetupModal';
import { AuthRequiredModal } from './components/AuthRequiredModal';
import { ExamView } from './components/ExamView';
import { VocabularyJamExamView } from './components/VocabularyJamExamView';
import { ExamResultView } from './components/ExamResultView';
import { FullExamHomeTab } from './components/FullExamHomeTab';
import { TopicExamTab } from './components/TopicExamTab';
import { AiQuestionBankTab } from './components/AiQuestionBankTab';
import { HistoryTab } from './components/HistoryTab';
import {
  ColorMode,
  ExamConfig,
  ExamDisplayMode,
  ExamResult,
  ExamSession,
  Language,
  Question,
  SubjectId,
  ThemeName,
} from './types';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  getStoredCandidateName,
  saveCandidateName,
  shuffleQuestionsAndOptions,
} from './utils/storage';
import { getQuestionBank, saveQuestionsToBank } from './data/questionBank';
import { BCS_SUBJECTS } from './data/subjects';

export default function App() {
  // Localization & Branding
  const [lang, setLang] = useState<Language>('bn');
  const [theme, setTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem('bcs_app_theme') as ThemeName) || 'emerald';
  });
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    return (localStorage.getItem('bcs_color_mode') as ColorMode) || 'light';
  });
  const [candidateName, setCandidateName] = useState<string>(() => getStoredCandidateName());

  // Navigation & Views
  const [currentTab, setCurrentTab] = useState<'full' | 'subject' | 'ai_bank' | 'history'>('full');
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam' | 'result'>('dashboard');
  const [examDisplayMode, setExamDisplayMode] = useState<ExamDisplayMode>('continuous');

  // Firebase User
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Active exam session
  const [activeSession, setActiveSession] = useState<ExamSession | null>(() => getActiveSession());
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // Modals & Auth Guards
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'start_exam' | 'resume_exam' | 'general'>('start_exam');
  const [setupMode, setSetupMode] = useState<'full' | 'subject'>('full');
  const [setupSubjectId, setSetupSubjectId] = useState<SubjectId | undefined>(undefined);
  const [customQuizQuestions, setCustomQuizQuestions] = useState<Question[] | null>(null);

  // AI Question Bank Enrichment state
  const [isEnrichingQuestions, setIsEnrichingQuestions] = useState(false);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(() => getQuestionBank().length);
  const enrichedUserIdsRef = React.useRef<Set<string>>(new Set());

  // Apply dark mode and theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bcs_color_mode', colorMode);
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem('bcs_app_theme', theme);
  }, [theme]);

  // Open Auth Required Modal
  const handleOpenAuthModal = (reason: 'start_exam' | 'resume_exam' | 'general' = 'start_exam') => {
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  // Enrich Question Bank via Gemini AI & Firebase on every login
  const enrichQuestionBankOnLogin = async (user: FirebaseUser) => {
    if (enrichedUserIdsRef.current.has(user.uid)) return;
    enrichedUserIdsRef.current.add(user.uid);
    setIsEnrichingQuestions(true);

    try {
      // 1. Load any questions stored in Firebase Cloud Question Bank
      try {
        const cloudQuestions = await fetchQuestionsFromCloudBank();
        if (cloudQuestions.length > 0) {
          saveQuestionsToBank(cloudQuestions);
          setTotalQuestionsCount(getQuestionBank().length);
        }
      } catch (err) {
        console.warn('Could not fetch existing cloud questions:', err);
      }

      // 2. Request fresh authentic questions from Gemini AI
      const randomSubject = BCS_SUBJECTS[Math.floor(Math.random() * BCS_SUBJECTS.length)];
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: randomSubject.nameBn,
          count: 5,
          language: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const formatted: Question[] = data.questions.map((q: any) => ({
            id: q.id || `cloud_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            question: q.question,
            questionEn: q.questionEn,
            options: q.options,
            optionsEn: q.optionsEn,
            correctAnswer: q.correctAnswer,
            subjectId: randomSubject.id,
            subject: q.subject || randomSubject.nameBn,
            topic: q.topic || 'বিসিএস প্রিলিমিনারি প্রস্তুতি',
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || 'সঠিক উত্তর যাচাইকৃত।',
            reference: q.reference || 'বিসিএস সিলেবাস ও প্রমিত তথ্যসূত্র',
            isAiGenerated: true,
          }));

          // 3. Save these questions to Firebase Cloud Bank
          await saveQuestionsToCloudBank(user.uid, formatted);

          // 4. Save to local question bank & update count
          saveQuestionsToBank(formatted);
          setTotalQuestionsCount(getQuestionBank().length);
        }
      }
    } catch (err) {
      console.error('Error enriching question bank on login:', err);
    } finally {
      setIsEnrichingQuestions(false);
    }
  };

  // Auth State Listener & Firebase Settings Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Candidate name fallback
        if (user.displayName && !getStoredCandidateName()) {
          saveCandidateName(user.displayName);
          setCandidateName(user.displayName);
        }

        // Fetch settings from Firebase
        try {
          const cloudPrefs = await getUserPreferencesFromCloud(user.uid);
          if (cloudPrefs) {
            if (cloudPrefs.theme) setTheme(cloudPrefs.theme);
            if (cloudPrefs.colorMode) setColorMode(cloudPrefs.colorMode);
            if (cloudPrefs.examDisplayMode) setExamDisplayMode(cloudPrefs.examDisplayMode);
            if (cloudPrefs.candidateName) {
              setCandidateName(cloudPrefs.candidateName);
              saveCandidateName(cloudPrefs.candidateName);
            }
            if (cloudPrefs.preferredLanguage) setLang(cloudPrefs.preferredLanguage);
          }
        } catch (e) {
          console.error('Failed to load user preferences from cloud:', e);
        }

        // Automatically enrich question bank via Gemini AI & Firebase on login
        enrichQuestionBankOnLogin(user);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update Theme and save to Firebase
  const handleChangeTheme = async (newTheme: ThemeName) => {
    setTheme(newTheme);
    if (currentUser) {
      try {
        await saveUserPreferencesToCloud(currentUser.uid, { theme: newTheme });
      } catch (e) {
        console.error('Failed to save theme to cloud:', e);
      }
    }
  };

  // Toggle Dark/Light Mode and save to Firebase
  const handleToggleColorMode = async () => {
    const newMode: ColorMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(newMode);
    if (currentUser) {
      try {
        await saveUserPreferencesToCloud(currentUser.uid, { colorMode: newMode });
      } catch (e) {
        console.error('Failed to save color mode to cloud:', e);
      }
    }
  };

  // Language toggle and save to Firebase
  const handleToggleLang = async () => {
    const newLang: Language = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    if (currentUser) {
      try {
        await saveUserPreferencesToCloud(currentUser.uid, { preferredLanguage: newLang });
      } catch (e) {
        console.error('Failed to save language to cloud:', e);
      }
    }
  };

  // Google Login
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (user.displayName) {
          setCandidateName(user.displayName);
          saveCandidateName(user.displayName);
        }
        enrichQuestionBankOnLogin(user);
      }
    } catch (e) {
      console.error('Google sign in error:', e);
      throw e;
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      if (currentView === 'exam') {
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  // Launch Exam Setup Modal (Protected: Without login, no option to take test)
  const handleOpenSetupModal = (mode: 'full' | 'subject', subjectId?: SubjectId) => {
    if (!currentUser) {
      handleOpenAuthModal('start_exam');
      return;
    }
    setSetupMode(mode);
    setSetupSubjectId(subjectId);
    setCustomQuizQuestions(null);
    setIsSetupModalOpen(true);
  };

  // Start exam from ExamSetupModal (Protected: Without login, no option to take test)
  const handleStartExamFromConfig = async (config: ExamConfig) => {
    if (!currentUser) {
      handleOpenAuthModal('start_exam');
      return;
    }

    setIsSetupModalOpen(false);
    setExamDisplayMode(config.displayMode || 'continuous');

    let baseQuestions: Question[] = [];
    if (customQuizQuestions && customQuizQuestions.length > 0) {
      baseQuestions = customQuizQuestions;
    } else if (config.mode === 'subject' && config.subjectId) {
      const all = getQuestionBank();
      baseQuestions = all.filter((q) => q.subjectId === config.subjectId);
      if (baseQuestions.length === 0) {
        baseQuestions = all.slice(0, config.totalQuestions);
      }
    } else {
      baseQuestions = getQuestionBank();
    }

    const shuffled = shuffleQuestionsAndOptions(baseQuestions).slice(
      0,
      Math.min(config.totalQuestions, baseQuestions.length)
    );

    const newSession: ExamSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      config: {
        ...config,
        totalQuestions: shuffled.length,
      },
      questions: shuffled,
      selectedAnswers: {},
      flaggedQuestions: {},
      startTime: Date.now(),
      timeRemainingSeconds: config.durationMinutes * 60,
      isCompleted: false,
    };

    saveActiveSession(newSession);
    setActiveSession(newSession);

    // Save to Firebase
    try {
      await saveActiveSessionToCloud(currentUser.uid, newSession);
    } catch (e) {
      console.error('Failed to sync session to cloud:', e);
    }

    setCurrentView('exam');
  };

  // Resume active in-progress session (Protected: Without login, no option to take test)
  const handleResumeSession = () => {
    if (!currentUser) {
      handleOpenAuthModal('resume_exam');
      return;
    }
    if (activeSession) {
      setExamDisplayMode(activeSession.config.displayMode || 'continuous');
      setCurrentView('exam');
    }
  };

  // Discard in-progress session
  const handleDiscardSession = async () => {
    clearActiveSession();
    setActiveSession(null);
    if (currentUser) {
      try {
        await clearActiveSessionFromCloud(currentUser.uid);
      } catch (e) {
        console.error('Failed to clear cloud session:', e);
      }
    }
  };

  // Finish exam
  const handleFinishExam = async (result: ExamResult) => {
    clearActiveSession();
    setActiveSession(null);
    setCurrentResult(result);
    setCurrentView('result');

    // Save to Firebase cloud if authenticated
    if (currentUser) {
      try {
        await saveExamResultToCloud(currentUser.uid, result);
        await clearActiveSessionFromCloud(currentUser.uid);
      } catch (e) {
        console.error('Failed to sync result to cloud:', e);
      }
    }
  };

  // Retake exam (Protected: Without login, no option to take test)
  const handleRetakeExam = async (shuffledQuestions: Question[]) => {
    if (!currentUser) {
      handleOpenAuthModal('start_exam');
      return;
    }

    const name = getStoredCandidateName() || currentUser?.displayName || 'Candidate';
    const durationMinutes = Math.max(1, Math.round(shuffledQuestions.length * 0.5));

    const retakeSession: ExamSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      config: {
        candidateName: name,
        mode: shuffledQuestions.length >= 80 ? 'full' : 'subject',
        subjectId: currentResult?.mode === 'subject' ? shuffledQuestions[0]?.subjectId : undefined,
        totalQuestions: shuffledQuestions.length,
        durationMinutes,
        autoSubmitOnTimeUp: true,
        displayMode: examDisplayMode,
      },
      questions: shuffledQuestions,
      selectedAnswers: {},
      flaggedQuestions: {},
      startTime: Date.now(),
      timeRemainingSeconds: durationMinutes * 60,
      isCompleted: false,
    };

    saveActiveSession(retakeSession);
    setActiveSession(retakeSession);
    setCurrentResult(null);

    try {
      await saveActiveSessionToCloud(currentUser.uid, retakeSession);
    } catch (e) {
      console.error('Failed to sync retake session to cloud:', e);
    }

    setCurrentView('exam');
  };

  // Start instant quiz with custom AI generated questions (Protected: Without login, no option to take test)
  const handleStartCustomQuiz = (questions: Question[]) => {
    if (!currentUser) {
      handleOpenAuthModal('start_exam');
      return;
    }
    setCustomQuizQuestions(questions);
    setSetupMode('full');
    setIsSetupModalOpen(true);
  };

  // Practice weak topic from result (Protected: Without login, no option to take test)
  const handlePracticeTopic = (subjectId: SubjectId) => {
    if (!currentUser) {
      handleOpenAuthModal('start_exam');
      return;
    }
    setCurrentView('dashboard');
    setCurrentTab('subject');
    handleOpenSetupModal('subject', subjectId);
  };

  const handleUpdateResultWithAi = async (updated: ExamResult) => {
    if (currentUser) {
      try {
        await saveExamResultToCloud(currentUser.uid, updated);
      } catch (e) {
        console.error('Failed to save updated AI result to cloud:', e);
      }
    }
  };

  const isDark = colorMode === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Global Header (shown when not in active exam view) */}
      {currentView !== 'exam' && (
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setCurrentView('dashboard');
          }}
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenRules={() => setIsRulesModalOpen(true)}
          hasActiveSession={!!activeSession}
          currentUser={currentUser}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          theme={theme}
          onChangeTheme={handleChangeTheme}
          colorMode={colorMode}
          onToggleColorMode={handleToggleColorMode}
          candidateName={candidateName}
        />
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'exam' && activeSession && currentUser ? (
          examDisplayMode === 'jam' ? (
            <VocabularyJamExamView
              session={activeSession}
              onFinishExam={handleFinishExam}
              onSwitchToContinuousView={() => setExamDisplayMode('continuous')}
              lang={lang}
              theme={theme}
              colorMode={colorMode}
            />
          ) : (
            <ExamView
              session={activeSession}
              onFinishExam={handleFinishExam}
              onExitExam={() => setCurrentView('dashboard')}
              onSwitchToJamView={() => setExamDisplayMode('jam')}
              lang={lang}
              theme={theme}
              colorMode={colorMode}
            />
          )
        ) : currentView === 'result' && currentResult ? (
          <ExamResultView
            result={currentResult}
            onRetake={handleRetakeExam}
            onPracticeTopic={handlePracticeTopic}
            onHome={() => {
              setCurrentResult(null);
              setCurrentView('dashboard');
            }}
            lang={lang}
            theme={theme}
            colorMode={colorMode}
            onSaveUpdatedResult={handleUpdateResultWithAi}
          />
        ) : (
          /* Dashboard Tabs */
          <>
            {currentTab === 'full' && (
              <FullExamHomeTab
                onOpenSetupModal={() => handleOpenSetupModal('full')}
                onResumeSession={handleResumeSession}
                onDiscardSession={handleDiscardSession}
                activeSession={activeSession}
                onOpenRules={() => setIsRulesModalOpen(true)}
                onSelectTab={setCurrentTab}
                lang={lang}
                theme={theme}
                colorMode={colorMode}
                currentUser={currentUser}
                onRequireLogin={() => handleOpenAuthModal('start_exam')}
                totalQuestionsCount={totalQuestionsCount}
                isEnrichingQuestions={isEnrichingQuestions}
              />
            )}

            {currentTab === 'subject' && (
              <TopicExamTab
                onSelectSubjectForExam={(subjectId) => handleOpenSetupModal('subject', subjectId)}
                lang={lang}
                currentUser={currentUser}
                onRequireLogin={() => handleOpenAuthModal('start_exam')}
              />
            )}

            {currentTab === 'ai_bank' && (
              <AiQuestionBankTab
                onStartCustomQuiz={handleStartCustomQuiz}
                lang={lang}
                theme={theme}
                colorMode={colorMode}
                currentUser={currentUser}
                onRequireLogin={() => handleOpenAuthModal('start_exam')}
              />
            )}

            {currentTab === 'history' && (
              <HistoryTab
                onViewResult={(res) => {
                  setCurrentResult(res);
                  setCurrentView('result');
                }}
                lang={lang}
                theme={theme}
                colorMode={colorMode}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        lang={lang}
      />

      {/* Exam Setup Modal */}
      <ExamSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false);
          setCustomQuizQuestions(null);
        }}
        onStartExam={handleStartExamFromConfig}
        lang={lang}
        mode={setupMode}
        initialSubjectId={setupSubjectId}
        availableQuestionsCount={
          customQuizQuestions ? customQuizQuestions.length : setupMode === 'full' ? totalQuestionsCount : 30
        }
        defaultDisplayMode={examDisplayMode}
      />

      {/* Authentication Required Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        lang={lang}
        theme={theme}
        colorMode={colorMode}
        reason={authModalReason}
      />
    </div>
  );
}
