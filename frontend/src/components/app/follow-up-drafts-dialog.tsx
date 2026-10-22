import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api-client';

export interface FollowUpDraft {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
}

type DraftFields = Omit<FollowUpDraft, 'id'>;

// Demo account only: drafts live in this browser. Real accounts use /follow-ups/drafts.
const DEMO_STORAGE_KEY = 'applyiq.followUpDrafts';

const DEMO_DRAFTS: FollowUpDraft[] = [
  {
    id: 'default-first',
    title: 'Checking in on my application',
    subtitle: 'First follow-up',
    description:
      "Hi [Recruiter],\n\nI applied for the [Role] position at [Company] and wanted to check in on its status. I'm still very interested in the role and would welcome the chance to talk.\n\nThanks for your time,\n[Name]",
  },
  {
    id: 'default-final',
    title: 'One last check-in',
    subtitle: 'Final follow-up',
    description:
      "Hi [Recruiter],\n\nI wanted to follow up one last time on the [Role] position at [Company]. If the team has moved in another direction, I completely understand — I'd appreciate knowing either way.\n\nBest,\n[Name]",
  },
  {
    id: 'default-thanks',
    title: 'Thank you for your time',
    subtitle: 'Post-interview thank-you',
    description:
      'Hi [Recruiter],\n\nThank you for taking the time to speak with me about the [Role] position at [Company]. I enjoyed our conversation and am excited about the opportunity.\n\nBest regards,\n[Name]',
  },
];

function loadDemoDrafts(): FollowUpDraft[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FollowUpDraft[]) : DEMO_DRAFTS;
  } catch {
    return DEMO_DRAFTS;
  }
}

export function useFollowUpDrafts(isDemo: boolean) {
  const [drafts, setDrafts] = useState<FollowUpDraft[]>(() => (isDemo ? loadDemoDrafts() : []));

  useEffect(() => {
    if (!isDemo) apiFetch<FollowUpDraft[]>('/follow-ups/drafts').then(setDrafts).catch(() => undefined);
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo) return;
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // storage blocked — drafts last for this session only
    }
  }, [isDemo, drafts]);

  const create = async (fields: DraftFields) => {
    const draft = isDemo
      ? { id: crypto.randomUUID(), ...fields }
      : await apiFetch<FollowUpDraft>('/follow-ups/drafts', { method: 'POST', body: JSON.stringify(fields) });
    setDrafts((prev) => [...prev, draft]);
  };

  const update = async (id: string, fields: DraftFields) => {
    const draft = isDemo
      ? { id, ...fields }
      : await apiFetch<FollowUpDraft>(`/follow-ups/drafts/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
    setDrafts((prev) => prev.map((d) => (d.id === id ? draft : d)));
  };

  const remove = async (id: string) => {
    if (!isDemo) await apiFetch(`/follow-ups/drafts/${id}`, { method: 'DELETE' });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return { drafts, create, update, remove };
}

const emptyFields: DraftFields = { title: '', subtitle: '', description: '' };

export function FollowUpDraftsDialog({
  open,
  onOpenChange,
  onPick,
  pickingFor,
  store,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (draft: FollowUpDraft) => void;
  // Set when opened from a "Send follow-up" button, so the header says what the pick is for.
  pickingFor?: string;
  store: ReturnType<typeof useFollowUpDrafts>;
}) {
  // null = list view; 'new' = creating; otherwise the id of the draft being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFields);
  const [saving, setSaving] = useState(false);

  const close = (next: boolean) => {
    if (!next) setEditing(null);
    onOpenChange(next);
  };

  const startEdit = (draft?: FollowUpDraft) => {
    setForm(draft ? { title: draft.title, subtitle: draft.subtitle ?? '', description: draft.description } : emptyFields);
    setEditing(draft?.id ?? 'new');
  };

  const save = async () => {
    setSaving(true);
    try {
      const fields = { title: form.title.trim(), subtitle: form.subtitle?.trim() || null, description: form.description };
      if (editing === 'new') await store.create(fields);
      else if (editing) await store.update(editing, fields);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (draft: FollowUpDraft) => {
    if (!window.confirm(`Delete the draft "${draft.title}"?`)) return;
    await store.remove(draft.id).catch(() => undefined);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle>{editing === 'new' ? 'Create draft' : editing ? 'Edit draft' : 'Drafts'}</DialogTitle>
              <DialogDescription>
                {editing
                  ? 'Plain text. [Recruiter], [Role], [Company] and [Name] are filled in when you send it.'
                  : pickingFor
                    ? `Pick a draft for ${pickingFor}.`
                    : 'Pick a draft to copy it to your clipboard.'}
              </DialogDescription>
            </div>
            {!editing && (
              <Button size="sm" className="shrink-0 gap-1.5 bg-sky-500 text-white hover:bg-sky-400" onClick={() => startEdit()}>
                <Plus className="h-4 w-4" />
                Create Draft
              </Button>
            )}
          </div>
        </DialogHeader>

        {editing ? (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="draft-title">Title</Label>
                <Input id="draft-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="draft-subtitle">Subtitle</Label>
                <Input
                  id="draft-subtitle"
                  placeholder="What type of draft this is, e.g. First follow-up"
                  value={form.subtitle ?? ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="draft-description">Description</Label>
                <Textarea
                  id="draft-description"
                  rows={8}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button disabled={saving || !form.title.trim() || !form.description.trim()} onClick={save}>
                {editing === 'new' ? 'Save draft' : 'Save changes'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {store.drafts.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-white/40">No drafts yet — create one.</p>
            )}
            {store.drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-start gap-1 rounded-lg border border-slate-200 p-3 hover:border-sky-400/60 hover:bg-sky-500/[0.04] dark:border-white/10"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onPick(draft)}>
                  <p className="font-medium text-slate-900 dark:text-white">{draft.title}</p>
                  {draft.subtitle && <p className="text-xs font-medium text-sky-500 dark:text-sky-400">{draft.subtitle}</p>}
                  <p className="mt-1.5 line-clamp-3 text-sm whitespace-pre-line text-slate-500 dark:text-white/60">{draft.description}</p>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit draft ${draft.title}`}
                  className="h-7 w-7 shrink-0 text-slate-400 hover:text-sky-400"
                  onClick={() => startEdit(draft)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete draft ${draft.title}`}
                  className="h-7 w-7 shrink-0 text-slate-400 hover:text-rose-400"
                  onClick={() => remove(draft)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
