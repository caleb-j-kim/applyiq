import type { MatchAnalysisResponseDto } from '@/lib/mappers';

export interface ResumeMatchResultsState {
  analysis: MatchAnalysisResponseDto;
  resumeName?: string;
  subject: string;
  // Set when the analysis ran against a saved application; enables "Save to notes".
  applicationId?: string | null;
}

// The last match result is kept until the user presses "Back to Resume Match" or
// logs out, so revisiting Resume Match shows it again instead of re-running a paid
// AI analysis.
const STORAGE_KEY = 'applyiq.resumeMatchResults';

export function saveResumeMatchResults(state: ResumeMatchResultsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadResumeMatchResults(): ResumeMatchResultsState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResumeMatchResultsState) : null;
  } catch {
    return null;
  }
}

export function clearResumeMatchResults() {
  localStorage.removeItem(STORAGE_KEY);
}
