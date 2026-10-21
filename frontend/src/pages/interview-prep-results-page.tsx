import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, ListChecks, Pencil, Plus, Save, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { isDemoAccount, saveDemoPrep } from '@/lib/demo-ai';
import type { InterviewPrepResponseDto } from '@/lib/mappers';
import { addNotification } from '@/lib/notification-store';
import { interviewPrepResults, type InterviewPrepResultsState } from '@/lib/stored-results';

// Company Research ends with a "Sources: url · url" bullet (CompanyResearchService); it's shown as links.
const SOURCES = 'Sources: ';

function sourceLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.endsWith('wikipedia.org') ? 'Wikipedia' : host;
  } catch {
    return url;
  }
}

export function InterviewPrepResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState(
    () => (location.state as InterviewPrepResultsState | null) ?? interviewPrepResults.load()
  );
  const [isSaving, setIsSaving] = useState(false);
  // Sections being edited; null when not in edit mode.
  const [draft, setDraft] = useState<InterviewPrepResponseDto['sections'] | null>(null);

  useEffect(() => {
    if (!state) navigate('/interview-prep', { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const { prep, resumeName, subject, saved } = state;
  const isDemo = isDemoAccount(user?.email);

  const saveResults = async () => {
    setIsSaving(true);
    try {
      // Demo account keeps saved prep in this browser; real accounts save it to their account
      // and get back its id, which later edits need.
      let savedPrep = prep;
      if (isDemo) saveDemoPrep(prep);
      else savedPrep = await apiFetch<InterviewPrepResponseDto>('/ai/interview-preps', { method: 'POST', body: JSON.stringify(prep) });
      const next = { ...state, prep: savedPrep, saved: true };
      interviewPrepResults.save(next);
      setState(next);
      const message = `Saved interview prep for ${subject}. Open it any time from Retrieve Previous Interview Prep.`;
      toast.success(message);
      addNotification(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save interview prep');
    } finally {
      setIsSaving(false);
    }
  };

  // Edits to an unsaved prep stay local until "Save Results"; edits to a saved one are saved now.
  const saveEdits = async () => {
    if (!draft) return;
    const edited = { ...prep, sections: draft.map((s) => ({ title: s.title.trim(), bullets: s.bullets.map((b) => b.trim()).filter(Boolean) })) };
    setIsSaving(true);
    try {
      let updated = edited;
      if (saved && isDemo) saveDemoPrep(edited);
      else if (saved) updated = await apiFetch<InterviewPrepResponseDto>(`/ai/interview-preps/${prep.id}`, { method: 'PUT', body: JSON.stringify(edited) });
      const next = { ...state, prep: updated };
      interviewPrepResults.save(next);
      setState(next);
      setDraft(null);
      if (saved) toast.success('Interview prep updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update interview prep');
    } finally {
      setIsSaving(false);
    }
  };

  const editSection = (i: number, change: (s: InterviewPrepResponseDto['sections'][number]) => InterviewPrepResponseDto['sections'][number]) =>
    setDraft((d) => d && d.map((s, j) => (j === i ? change(s) : s)));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="w-fit gap-1.5 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={() => {
            interviewPrepResults.clear();
            navigate('/interview-prep');
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interview Prep
        </Button>
        <div className="flex gap-2">
          {draft ? (
            <>
              <Button variant="outline" disabled={isSaving} onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button className="gap-1.5 bg-sky-500 text-white hover:bg-sky-400" disabled={isSaving} onClick={saveEdits}>
                <Check className="h-4 w-4" />
                {isSaving ? 'Saving...' : saved ? 'Save Changes' : 'Done'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-1.5" onClick={() => setDraft(prep.sections)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button className="gap-1.5 bg-sky-500 text-white hover:bg-sky-400" disabled={saved || isSaving} onClick={saveResults}>
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? 'Saved' : isSaving ? 'Saving...' : 'Save Results'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="motion-safe:animate-fade-up">
        <h1 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Interview Preparation Material
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-white/50">
          Prepared for <span className="text-slate-600 dark:text-white/70">{subject}</span>
          {resumeName && (
            <>
              {' '}using <span className="text-slate-600 dark:text-white/70">{resumeName}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-center text-xs text-slate-400 dark:text-white/40">
          {prep.effort} effort{prep.createdAt && ` · Generated ${new Date(prep.createdAt).toLocaleString()}`}
        </p>
      </div>

      {draft ? (
        <div className="flex flex-col gap-6">
          {draft.map((section, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
              <Input
                aria-label="Section title"
                value={section.title}
                onChange={(e) => editSection(i, (s) => ({ ...s, title: e.target.value }))}
                className="font-semibold"
              />
              {section.bullets.map((bullet, j) => (
                <div key={j} className="flex items-start gap-2">
                  <Textarea
                    aria-label={`${section.title} bullet ${j + 1}`}
                    value={bullet}
                    onChange={(e) => editSection(i, (s) => ({ ...s, bullets: s.bullets.map((b, k) => (k === j ? e.target.value : b)) }))}
                    className="min-h-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove bullet"
                    onClick={() => editSection(i, (s) => ({ ...s, bullets: s.bullets.filter((_, k) => k !== j) }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                className="w-fit gap-1.5 text-sky-500"
                onClick={() => editSection(i, (s) => ({ ...s, bullets: [...s.bullets, ''] }))}
              >
                <Plus className="h-4 w-4" />
                Add bullet
              </Button>
            </div>
          ))}
        </div>
      ) : (
      <div className="flex flex-col gap-6">
        {prep.sections.map((section, i) => (
          <div
            key={section.title}
            className="flex flex-col gap-3 border-t border-slate-200 pt-6 motion-safe:animate-fade-up dark:border-white/10"
            style={{ animationDelay: `${Math.min(i, 10) * 80}ms` }}
          >
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/80">
              <ListChecks className="h-4 w-4 text-sky-400" />
              {section.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {section.bullets.filter((b) => !b.startsWith(SOURCES)).map((bullet, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-700 dark:text-white/80">
                  <span className="text-sky-400">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {section.bullets.filter((b) => b.startsWith(SOURCES)).map((bullet) => (
              <div key={bullet} className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-white/40">
                Sources
                {bullet.slice(SOURCES.length).split(' · ').map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-sky-500 hover:bg-sky-500/10 dark:border-white/10"
                  >
                    {sourceLabel(url)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
