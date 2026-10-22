import type { RecommendedAction } from '@/types';

// Pill/icon colors per follow-up action, shared by the Follow-Ups page and the dashboard cards.
export const ACTION_STYLE: Record<RecommendedAction, string> = {
  'Send first follow-up': 'text-sky-400 bg-sky-500/10',
  'Send final follow-up': 'text-amber-400 bg-amber-500/10',
  'Wait longer': 'text-slate-500 dark:text-white/60 bg-slate-100 dark:bg-white/10',
  'Mark as likely ghosted': 'text-rose-400 bg-rose-500/10',
  'Move to rejected': 'text-rose-400 bg-rose-500/10',
  'Archive application': 'text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/10',
};

export const isSendAction = (action: RecommendedAction) => action.startsWith('Send');
