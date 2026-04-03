// Severity palette (keyboard issues) — WCAG AA compliant on white backgrounds
export const SEV = {
  error:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C', badge: '#DC2626', label: 'Error' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', badge: '#B45309', label: 'Warning' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', badge: '#1D4ED8', label: 'Info' },
  pass:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', badge: '#16A34A', label: 'Pass' },
} as const;

export type SeverityKey = keyof typeof SEV;

// Priority palette — text colors all ≥4.5:1 on their bg
export const PRIO = {
  1: { bg: '#FEF2F2', text: '#B91C1C', badge: '#DC2626', label: 'P1 Critical' },
  2: { bg: '#FFF7ED', text: '#9A3412', badge: '#C2410C', label: 'P2 High' },
  3: { bg: '#FFFBEB', text: '#92400E', badge: '#B45309', label: 'P3 Medium' },
  4: { bg: '#F3F4F6', text: '#4B5563', badge: '#6B7280', label: 'P4 Low' },
} as const;

// Axe impact severity — badge used on white bg, text on tinted bg
export const IMPACT = {
  critical: { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', badge: '#DC2626' },
  serious:  { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', badge: '#C2410C' },
  moderate: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', badge: '#B45309' },
  minor:    { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563', badge: '#6B7280' },
} as const;

// WCAG level colors — all pass AA on white (≥4.5:1)
export const WCAG_LEVEL = {
  A:   '#BE185D',
  AA:  '#6D28D9',
  AAA: '#1D4ED8',
} as const;

// Header
export const HEADER_BG = '#2563EB';

// Accent colors
export const ACCENT = '#4F46E5';
export const ACCENT_BG = '#EEF2FF';
export const ACCENT_BORDER = '#C7D2FE';
export const HIGHLIGHT = '#4F46E5';
export const HIGHLIGHT_BG = '#F5F3FF';

// Status — text colors pass AA on white
export const SUCCESS = '#15803D';
export const SUCCESS_BG = '#F0FDF4';
export const SUCCESS_BORDER = '#BBF7D0';
export const DANGER = '#DC2626';
export const DANGER_BG = '#FEF2F2';

// Surface
export const SURFACE = '#FFFFFF';
export const CARD = '#FFFFFF';
export const BORDER = '#E5E7EB';
export const BORDER_LIGHT = '#F3F4F6';
export const TEXT = '#1F2937';
export const TEXT_SECONDARY = '#4B5563';
export const TEXT_MUTED = '#6B7280';

// Scroll / list background
export const BG_SUBTLE = '#F9FAFB';

// Interactive states
export const DISABLED_BG = '#F3F4F6';
export const DISABLED_TEXT = '#6B7280';
export const DISABLED_BORDER = '#E5E7EB';
export const HOVER_BORDER = '#4F46E5';

// Links — 5.56:1 on white
export const LINK = '#1D4ED8';

// Axe result type badges — all text colors ≥4.5:1 on their bg
export const RESULT_TYPE = {
  violation:       { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', badge: '#DC2626', label: 'Violation', icon: '✕' },
  'needs-review':  { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', badge: '#B45309', label: 'Needs Review', icon: '?' },
  'best-practice': { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', badge: '#1D4ED8', label: 'Best Practice', icon: '★' },
} as const;

export function severityColor(sev: 'error' | 'warning' | 'info' | 'pass') {
  return SEV[sev];
}

export function priorityColor(p: 1 | 2 | 3 | 4) {
  return PRIO[p];
}

export function impactColor(impact: string | null | undefined) {
  const key = (impact || 'minor') as keyof typeof IMPACT;
  return IMPACT[key] || IMPACT.minor;
}
