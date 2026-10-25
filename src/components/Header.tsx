import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  FileText,
  Globe2,
  HelpCircle,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Palette,
  LogIn,
  LogOut,
  User,
  Zap,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { ColorMode, Language, ThemeName } from '../types';
import { t } from '../utils/translations';
import { THEME_CONFIGS } from '../utils/theme';

interface HeaderProps {
  currentTab: 'full' | 'subject' | 'ai_bank' | 'history';
  onSelectTab: (tab: 'full' | 'subject' | 'ai_bank' | 'history') => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenRules: () => void;
  hasActiveSession?: boolean;
  currentUser: FirebaseUser | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  theme: ThemeName;
  onChangeTheme: (theme: ThemeName) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  candidateName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  onOpenRules,
  hasActiveSession,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  theme,
  onChangeTheme,
  colorMode,
  onToggleColorMode,
  candidateName,
}) => {
  const tr = t(lang);
  const themeCfg = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;
  const isDark = colorMode === 'dark';

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'}`}>
      {/* Top Banner Bar */}
      <div className={`bg-gradient-to-r ${themeCfg.colors.headerGradient} text-white px-4 py-2 sm:py-2.5`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Logo & App Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-sm sm:text-base">
                {tr.get('appName')}
              </span>
              <span className="hidden lg:inline-block ml-2 text-white/80 text-xs border-l border-white/30 pl-2 font-normal">
                {tr.get('appSubtitle')}
              </span>
            </div>
          </div>

          {/* Right Action Bar: Theme, Dark Mode, Rules, Language, Google Login */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 ml-auto">
            {/* 3 Themes Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                title={lang === 'bn' ? 'থিম পরিবর্তন করুন (৩টি থিম)' : 'Change Theme (3 Themes)'}
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {lang === 'bn' ? themeCfg.nameBn.split(' ')[0] : themeCfg.nameEn.split(' ')[0]}
                </span>
              </button>

              {showThemeMenu && (
                <div className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-xl border p-1 z-50 animate-fadeIn ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                  {(['emerald', 'indigo', 'crimson'] as ThemeName[]).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => {
                        onChangeTheme(thm);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        theme === thm
                          ? 'bg-slate-100 dark:bg-slate-700 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            thm === 'emerald' ? 'bg-emerald-500' : thm === 'indigo' ? 'bg-indigo-600' : 'bg-rose-600'
                          }`}
                        />
                        <span>{lang === 'bn' ? THEME_CONFIGS[thm].nameBn : THEME_CONFIGS[thm].nameEn}</span>
                      </div>
                      {theme === thm && <span className="text-emerald-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleColorMode}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isDark ? (lang === 'bn' ? 'লাইট মোড' : 'Switch to Light') : (lang === 'bn' ? 'ডার্ক মোড' : 'Switch to Dark')}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider transition-colors"
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Rules Button */}
            <button
              onClick={onOpenRules}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{tr.get('rulesBtn')}</span>
            </button>

            {/* Google Authentication Section */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1.5 p-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all"
                  title={currentUser.displayName || currentUser.email || 'User'}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs font-semibold max-w-[100px] truncate pr-1">
                    {currentUser.displayName?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className={`absolute right-0 mt-1.5 w-56 rounded-2xl shadow-xl border p-3 z-50 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-xs truncate">
                        {currentUser.displayName || candidateName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Cloud Sync Active (Firebase)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSignOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center space-x-2 transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সাইন আউট করুন' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'bn' ? 'গুগল লগইন' : 'Google Login'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          <button
            onClick={() => onSelectTab('full')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'full'
                ? `${themeCfg.colors.primary} text-white shadow-xs`
                : isDark
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{tr.get('tabFullExam')}</span>
            {hasActiveSession && (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('subject')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'subject'
                ? `${themeCfg.colors.primary} text-white shadow-xs`
                : isDark
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{tr.get('tabSubjectExam')}</span>
          </button>

          <button
            onClick={() => onSelectTab('ai_bank')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'ai_bank'
                ? `${themeCfg.colors.primary} text-white shadow-xs`
                : isDark
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{tr.get('tabAiBank')}</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
              currentTab === 'history'
                ? `${themeCfg.colors.primary} text-white shadow-xs`
                : isDark
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{tr.get('tabHistory')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
