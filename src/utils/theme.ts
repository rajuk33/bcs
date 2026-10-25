import { ColorMode, ThemeName } from '../types';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  headerGradient: string;
  borderActive: string;
  badgeBg: string;
  badgeText: string;
}

export const THEME_CONFIGS: Record<ThemeName, { nameBn: string; nameEn: string; colors: ThemeColors }> = {
  emerald: {
    nameBn: 'বিসিএস গ্রিন (Emerald)',
    nameEn: 'BPSC Emerald',
    colors: {
      primary: 'bg-emerald-600',
      primaryHover: 'hover:bg-emerald-700',
      primaryLight: 'bg-emerald-50',
      headerGradient: 'from-emerald-950 via-emerald-900 to-teal-900',
      borderActive: 'border-emerald-500',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
    },
  },
  indigo: {
    nameBn: 'পদ্মা ইন্ডিগো (Indigo)',
    nameEn: 'Padma Indigo',
    colors: {
      primary: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
      primaryLight: 'bg-indigo-50',
      headerGradient: 'from-slate-950 via-slate-900 to-indigo-950',
      borderActive: 'border-indigo-500',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
    },
  },
  crimson: {
    nameBn: 'বিজয় লাল-সবুজ (Crimson)',
    nameEn: 'Bijoy Crimson',
    colors: {
      primary: 'bg-rose-700',
      primaryHover: 'hover:bg-rose-800',
      primaryLight: 'bg-rose-50',
      headerGradient: 'from-rose-950 via-red-950 to-slate-950',
      borderActive: 'border-rose-500',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
    },
  },
};
