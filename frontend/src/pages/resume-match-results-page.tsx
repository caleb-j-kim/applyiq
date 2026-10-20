import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, Hash, ListChecks, NotebookPen, Sparkles, XCircle, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ScoreMeter } from '@/components/app/score-meter';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { addNotification } from '@/lib/notification-store';
import {
  clearResumeMatchResults,
  loadResumeMatchResults,
  type ResumeMatchResultsState,
} from '@/lib/resume-match-results';
import { cn } from '@/lib/utils';
import type { JobApplicationResponseDto } from '@/lib/mappers';
import type { ScoredKeyword } from '@/types';

// Appends a section of the results to the application's notes. Saving is
// opt-in per section; nothing about the analysis is persisted otherwise.
function SaveToNotesButton({ onSave, disabledReason }: { onSave: () => Promise<void>; disabledReason?: string }) {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={saving || !!disabledReason}
      title={disabledReason ?? 'Append this section to the application notes'}
      className="h-7 shrink-0 gap-1.5 border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-100 print:hidden dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
      onClick={async () => {
        setSaving(true);
        try {
          await onSave();
        } finally {
          setSaving(false);
        }
      }}
    >
      <NotebookPen className="h-3.5 w-3.5" />
      {saving ? 'Saving...' : 'Save to notes'}
    </Button>
  );
}

// A row's bar width is the keyword's own 1-100 importance weight — a sequential
// (single-hue, more-is-darker-equivalent) encoding of "how expected is this,"
// orthogonal to the found/missed status already carried by the icon + section.
function KeywordList({
  title,
  keywords,
  icon: Icon,
  iconClassName,
  emptyLabel,
  onSave,
  saveDisabledReason,
}: {
  title: string;
  keywords: ScoredKeyword[];
  icon: LucideIcon;
  iconClassName: string;
  emptyLabel: string;
  onSave: (title: string, lines: string[]) => Promise<void>;
  saveDisabledReason?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-white/80">{title}</h3>
        <SaveToNotesButton
          disabledReason={saveDisabledReason ?? (keywords.length === 0 ? 'Nothing to save' : undefined)}
          onSave={() => onSave(title, keywords.map((kw) => `${kw.name} - ${kw.weight}%`))}
        />
      </div>
      {keywords.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-white/40">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {keywords.map((kw) => (
            <li key={kw.name} className="flex items-center gap-2">
              <Icon className={cn('h-3.5 w-3.5 shrink-0', iconClassName)} />
              <span className="w-44 shrink-0 truncate text-sm text-slate-700 dark:text-white/80" title={kw.name}>
                {kw.name}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${kw.weight}%` }} />
              </div>
              <span className="w-9 shrink-0 text-right text-xs text-slate-400 tabular-nums dark:text-white/40">
                {kw.weight}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResumeMatchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as ResumeMatchResultsState | null) ?? loadResumeMatchResults();

  useEffect(() => {
    if (!state) {
      navigate('/resume-match', { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const { analysis, resumeName, subject, applicationId } = state;
  const saveDisabledReason = applicationId ? undefined : 'Save this job as an application to enable';

  const saveToNotes = async (title: string, lines: string[]) => {
    if (!applicationId) return;
    try {
      // Re-fetch so we append to the latest notes rather than a stale copy.
      const app = await apiFetch<JobApplicationResponseDto>(`/applications/${applicationId}`);
      // Trailing newline leaves a blank line between consecutively saved sections.
      const block = `\n${title}\n${lines.map((line) => `• ${line}`).join('\n')}\n`;
      await apiFetch(`/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: (app.notes ?? '') + block }),
      });
      const message = `Saved "${title}" to the notes for ${subject}.`;
      toast.success(message);
      addNotification(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save to notes');
    }
  };

  // Browser print dialog -> "Save as PDF". The dark: variant is screen-only
  // (index.css), so the printout always uses the light palette. The keyword bars
  // are background colors, which browsers drop when printing unless
  // print-color-adjust is exact (set on the page root below).
  const downloadPdf = () => {
    const previousTitle = document.title;
    document.title = `ApplyIQ Match Results - ${subject}`;
    window.print();
    document.title = previousTitle;
  };

  return (
    <div className="flex flex-col gap-8 [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button
          variant="ghost"
          className="w-fit gap-1.5 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={() => {
            clearResumeMatchResults();
            navigate('/resume-match');
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resume Match
        </Button>
        <Button className="gap-1.5 bg-sky-500 text-white hover:bg-sky-400" onClick={downloadPdf}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="relative pb-8 sm:min-h-[190px] sm:pr-52">
        <h1 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Match Results
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-white/50">
          {resumeName ? (
            <>
              Comparing <span className="text-slate-600 dark:text-white/70">{resumeName}</span> against{' '}
              <span className="text-slate-600 dark:text-white/70">{subject}</span>
            </>
          ) : (
            <>
              No resume selected — pick one on the Resume Match page for a personalized score. Comparing against{' '}
              <span className="text-slate-600 dark:text-white/70">{subject}</span> for now.
            </>
          )}
        </p>
        {analysis.scoreRationale && (
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-600 italic dark:text-white/70">
            "{analysis.scoreRationale}"
          </p>
        )}
        <div className="mt-8 flex justify-center sm:absolute sm:top-0 sm:right-0 sm:mt-0">
          <ScoreMeter
            score={analysis.matchScore}
            found={analysis.foundInResume.length}
            total={analysis.jdKeywords.length}
            size={140}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-slate-200 pt-8 dark:border-white/10">
        <p className="text-xs text-slate-400 dark:text-white/40">
          The number beside each keyword is its importance score (1-100) — how central that skill typically is to
          this kind of role, highest first.
        </p>

        <KeywordList
          title="Keywords Found in Job Description"
          keywords={analysis.jdKeywords}
          icon={Hash}
          iconClassName="text-sky-400"
          saveDisabledReason={saveDisabledReason}
          onSave={saveToNotes}
          emptyLabel="No recognizable keywords found in this job description."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <KeywordList
            title="Keywords Found in Your Resume"
            keywords={analysis.foundInResume}
            icon={CheckCircle2}
            iconClassName="text-emerald-400"
            saveDisabledReason={saveDisabledReason}
          onSave={saveToNotes}
          emptyLabel="None of the job description's keywords were found."
          />
          <KeywordList
            title="Keywords Missed"
            keywords={analysis.missed}
            icon={XCircle}
            iconClassName="text-rose-400"
            saveDisabledReason={saveDisabledReason}
          onSave={saveToNotes}
          emptyLabel="Nothing missed — great coverage."
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/80">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Predicted Keywords
          </h3>
          <p className="-mt-1.5 text-xs text-slate-400 dark:text-white/40">
            Skills this role likely expects even though the posting never names them directly.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <KeywordList
              title="Found Predicted Keywords"
              keywords={analysis.predictedFound}
              icon={CheckCircle2}
              iconClassName="text-emerald-400"
              saveDisabledReason={saveDisabledReason}
          onSave={saveToNotes}
          emptyLabel="None found."
            />
            <KeywordList
              title="Missed Predicted Keywords"
              keywords={analysis.predictedMissed}
              icon={XCircle}
              iconClassName="text-rose-400"
              saveDisabledReason={saveDisabledReason}
          onSave={saveToNotes}
          emptyLabel="None missed."
            />
          </div>
        </div>

        {analysis.suggestedResumeBullets.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/80">
                <ListChecks className="h-4 w-4 text-sky-400" />
                Suggested Resume Bullets
              </h3>
              <SaveToNotesButton
                disabledReason={saveDisabledReason}
                onSave={() => saveToNotes('Suggested Resume Bullets', analysis.suggestedResumeBullets)}
              />
            </div>
            <ul className="flex flex-col gap-2">
              {analysis.suggestedResumeBullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-white/80">
                  <span className="text-sky-400">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
