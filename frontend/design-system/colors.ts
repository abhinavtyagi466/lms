/**
 * Design System - Color Palette
 * Consistent color system for the E-Learning Platform
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Info Colors
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Special Colors
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
} as const;

// Semantic color mappings
export const semanticColors = {
  // Light mode
  light: {
    background: {
      primary: colors.neutral[50],
      secondary: colors.neutral[100],
      tertiary: colors.neutral[200],
      card: colors.neutral[50],
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      inverse: colors.neutral[50],
    },
    border: {
      primary: colors.neutral[200],
      secondary: colors.neutral[300],
      focus: colors.primary[500],
    },
  },

  // Dark mode
  dark: {
    background: {
      primary: colors.neutral[900],
      secondary: colors.neutral[800],
      tertiary: colors.neutral[700],
      card: colors.neutral[800],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
      tertiary: colors.neutral[400],
      inverse: colors.neutral[900],
    },
    border: {
      primary: colors.neutral[700],
      secondary: colors.neutral[600],
      focus: colors.primary[400],
    },
  },
} as const;

// Status colors
export const statusColors = {
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
  pending: colors.neutral[500],
} as const;

// Chart colors
export const chartColors = [
  colors.primary[500],
  colors.success[500],
  colors.warning[500],
  colors.error[500],
  colors.info[500],
  colors.purple[500],
  colors.indigo[500],
] as const;
