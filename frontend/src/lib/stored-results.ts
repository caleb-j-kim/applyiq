import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import type { InterviewPrepResponseDto, MatchAnalysisResponseDto } from '@/lib/mappers';
import { addNotification } from '@/lib/notification-store';

interface StoredResult {
  resumeName?: string;
  subject: string;
  // Set when the result belongs to a saved application; enables "Save to notes".
  applicationId?: string | null;
}

export interface ResumeMatchResultsState extends StoredResult {
  analysis: MatchAnalysisResponseDto;
}

export interface InterviewPrepResultsState extends StoredResult {
  prep: InterviewPrepResponseDto;
  // Interview prep is only kept long-term when the user presses "Save Results".
  saved: boolean;
}

// The last result of each AI page is kept until the user presses its "Back" button
// or logs out, so revisiting the page shows it again instead of re-running a paid call.
function storedResult<T>(key: string, resultsPath: string, label: string) {
  return {
    key,
    resultsPath,
    label,
    save: (state: T) => localStorage.setItem(key, JSON.stringify(state)),
    load: (): T | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    clear: () => localStorage.removeItem(key),
  };
}

export const resumeMatchResults = storedResult<ResumeMatchResultsState>('applyiq.resumeMatchResults', '/resume-match/results', 'Resume match');
export const interviewPrepResults = storedResult<InterviewPrepResultsState>('applyiq.interviewPrepResults', '/interview-prep/results', 'Interview prep');

export function clearStoredResults() {
  resumeMatchResults.clear();
  interviewPrepResults.clear();
  running.clear();
}

// In-flight AI calls by result key. They live outside any component, so leaving the page doesn't
// cancel them: the result is stored when it arrives, and the page shows it whenever it's open.
const running = new Map<string, Promise<unknown>>();

export function useBackgroundResult<T extends StoredResult>(store: ReturnType<typeof storedResult<T>>) {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(running.has(store.key));
  const mounted = useRef(false);

  const follow = (job: Promise<T | null>) => {
    setIsRunning(true);
    job.then((state) => {
      if (!mounted.current) return;
      setIsRunning(false);
      if (state) navigate(store.resultsPath, { state });
    });
  };

  // Coming back to the page while its call is still running: keep showing progress.
  useEffect(() => {
    mounted.current = true;
    const job = running.get(store.key) as Promise<T | null> | undefined;
    if (job) follow(job);
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (task: () => Promise<T>, failureMessage: string) => {
    const job: Promise<T | null> = task().then(
      (state) => {
        // Logged out meanwhile (running was cleared): drop the result.
        if (running.get(store.key) !== job) return null;
        store.save(state);
        if (!mounted.current) {
          const message = `${store.label} for ${state.subject} is ready.`;
          toast.success(message, { action: { label: 'View', onClick: () => navigate(store.resultsPath, { state }) } });
          addNotification(message);
        }
        return state;
      },
      (error) => {
        toast.error(error instanceof Error ? error.message : failureMessage);
        return null;
      }
    );
    running.set(store.key, job);
    job.finally(() => running.get(store.key) === job && running.delete(store.key));
    follow(job);
  };

  return { isRunning, start };
}
