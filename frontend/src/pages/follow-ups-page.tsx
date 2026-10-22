import { useCallback, useEffect, useState } from 'react';
import { Archive, Check, FileText, Ghost, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

import { FollowUpDraftsDialog, useFollowUpDrafts, type FollowUpDraft } from '@/components/app/follow-up-drafts-dialog';
import { FollowUpSendDialog, type FollowUpEmail } from '@/components/app/follow-up-send-dialog';
import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { mockFollowUpRecommendations } from '@/data/mock-data';
import { apiFetch } from '@/lib/api-client';
import { isDemoAccount } from '@/lib/demo-ai';
import { mapFollowUpResponse, STATUS_TO_API, type FollowUpResponseDto } from '@/lib/mappers';
import { ACTION_STYLE, isSendAction } from '@/lib/follow-up-actions';
import { addNotification } from '@/lib/notification-store';
import { refreshServerNotifications } from '@/lib/server-notifications';
import {
  APPLICATION_STATUSES,
  RECOMMENDED_ACTIONS,
  type ApplicationStatus,
  type FollowUpRecommendation,
  type RecommendedAction,
} from '@/types';
import { cn } from '@/lib/utils';

const ACTION_ICON: Record<RecommendedAction, typeof Send> = {
  'Send first follow-up': Send,
  'Send final follow-up': Send,
  'Wait longer': Check,
  'Mark as likely ghosted': Ghost,
  'Move to rejected': Archive,
  'Archive application': Archive,
};


// Demo account only: the sample recommendations plus follow-ups added in this browser.
const DEMO_CUSTOM_KEY = 'applyiq.customFollowUps';

function loadDemoCustom(): FollowUpRecommendation[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_CUSTOM_KEY) ?? '[]') as FollowUpRecommendation[];
  } catch {
    return [];
  }
}

const emptyForm = {
  companyName: '',
  jobTitle: '',
  status: 'Applied' as ApplicationStatus,
  dateApplied: '',
  recommendedAction: 'Send first follow-up' as RecommendedAction,
  reason: '',
};

export function FollowUpsPage() {
  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);

  const [demoDismissed, setDemoDismissed] = useState<Set<string>>(new Set());
  const [demoCustom, setDemoCustom] = useState(loadDemoCustom);
  const [serverRecs, setServerRecs] = useState<FollowUpRecommendation[] | null>(null);
  const [canEmail, setCanEmail] = useState(false);

  const drafts = useFollowUpDrafts(isDemo);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [sendingFor, setSendingFor] = useState<FollowUpRecommendation | null>(null);
  const [pickedDraft, setPickedDraft] = useState<FollowUpDraft | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const reload = useCallback(() => {
    apiFetch<FollowUpResponseDto[]>('/follow-ups')
      .then((data) => setServerRecs(data.map(mapFollowUpResponse)))
      .catch(() => setServerRecs([]));
  }, []);

  useEffect(() => {
    if (isDemo) return;
    reload();
    apiFetch<{ connected: boolean }[]>('/email')
      .then((accounts) => setCanEmail(accounts.some((a) => a.connected)))
      .catch(() => undefined);
  }, [isDemo, reload]);

  useEffect(() => {
    if (!isDemo) return;
    try {
      localStorage.setItem(DEMO_CUSTOM_KEY, JSON.stringify(demoCustom));
    } catch {
      // storage blocked — added follow-ups last for this session only
    }
  }, [isDemo, demoCustom]);

  const recommendations = isDemo
    ? [...demoCustom, ...mockFollowUpRecommendations].filter((r) => !demoDismissed.has(r.id))
    : serverRecs;

  // After any change on a real account: refetch the list and pull the new notification into the bell.
  const afterChange = () => {
    reload();
    refreshServerNotifications();
  };

  const demoRemove = (rec: FollowUpRecommendation) => {
    setDemoDismissed((prev) => new Set(prev).add(rec.id));
    if (rec.addedByUser) setDemoCustom((prev) => prev.filter((r) => r.id !== rec.id));
  };

  const markDone = async (rec: FollowUpRecommendation) => {
    if (isDemo) return demoRemove(rec);
    await apiFetch(`/follow-ups/${rec.id}/done`, { method: 'POST' }).catch(() => undefined);
    reload();
  };

  const runAction = async (rec: FollowUpRecommendation) => {
    if (isSendAction(rec.recommendedAction)) {
      setSendingFor(rec);
      setDraftsOpen(true);
      return;
    }
    const message = `${rec.companyName}: ${rec.recommendedAction.toLowerCase()}.`;
    if (isDemo) {
      demoRemove(rec);
      addNotification(message);
    } else {
      try {
        await apiFetch(`/follow-ups/${rec.id}/action`, { method: 'POST', body: JSON.stringify({ action: rec.recommendedAction }) });
      } catch {
        return;
      }
      afterChange();
    }
    toast.success(message);
  };

  const pickDraft = async (draft: FollowUpDraft) => {
    if (sendingFor) {
      setPickedDraft(draft);
      setDraftsOpen(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(draft.description);
      toast.success(`Copied "${draft.title}" to your clipboard.`);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };

  const closeSend = () => {
    setSendingFor(null);
    setPickedDraft(null);
  };

  const send = async (email: FollowUpEmail) => {
    const rec = sendingFor;
    if (!rec) return;
    if (!email.sendEmail) {
      try {
        await navigator.clipboard.writeText(email.body);
      } catch {
        toast.error("Couldn't copy to the clipboard.");
        return;
      }
    }
    if (isDemo) {
      demoRemove(rec);
      addNotification(`Follow-up marked as sent: ${rec.companyName} — ${rec.jobTitle}. You sent it yourself.`);
    } else {
      try {
        await apiFetch(`/follow-ups/${rec.id}/send`, {
          method: 'POST',
          body: JSON.stringify({ sendEmail: email.sendEmail, recipientEmail: email.to.trim() || null, subject: email.subject, body: email.body }),
        });
      } catch (error) {
        // The failure is already in the bell (apiFetch); toast it too and keep the dialog open to retry.
        toast.error(error instanceof Error ? error.message : 'Failed to send the follow-up');
        return;
      }
      // The backend recorded a "sent" notification; pull it into the bell now rather than at the next poll.
      afterChange();
    }
    toast.success(
      email.sendEmail ? `Follow-up emailed to ${email.to.trim()}.` : 'Copied to your clipboard and marked as sent.'
    );
    closeSend();
  };

  const addFollowUp = async () => {
    const fields = {
      companyName: form.companyName.trim(),
      jobTitle: form.jobTitle.trim(),
      recommendedAction: form.recommendedAction,
    };
    if (isDemo) {
      const days = form.dateApplied ? Math.max(0, Math.floor((Date.now() - new Date(form.dateApplied).getTime()) / 86_400_000)) : 0;
      setDemoCustom((prev) => [
        {
          ...fields,
          id: crypto.randomUUID(),
          applicationId: null,
          status: form.status,
          daysSinceApplied: days,
          reason: form.reason.trim(),
          decisionFactors: [],
          ghostingRiskScore: 0,
          confidence: 0,
          addedByUser: true,
        },
        ...prev,
      ]);
    } else {
      try {
        await apiFetch('/follow-ups', {
          method: 'POST',
          body: JSON.stringify({
            ...fields,
            status: STATUS_TO_API[form.status],
            dateApplied: form.dateApplied || null,
            note: form.reason.trim() || null,
          }),
        });
      } catch {
        return;
      }
      reload();
    }
    setForm(emptyForm);
    setAddOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Follow-Up Recommendations"
        description="Applications that may need action, ranked by ghosting risk. A decision tree picks each action, and the factors show the path it took."
        actions={
          <div className="flex flex-col items-end gap-2">
            {isDemo && <Badge className="bg-amber-500/10 text-amber-300">Sample data</Badge>}
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setDraftsOpen(true)}>
                <FileText className="h-4 w-4" />
                Drafts
              </Button>
              <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add follow-up
              </Button>
            </div>
          </div>
        }
      />

      {recommendations === null && (
        <Card>
          <CardContent className="py-16 text-center text-sm text-slate-400 dark:text-white/40">Loading follow-ups…</CardContent>
        </Card>
      )}

      {recommendations?.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-sm text-slate-400 dark:text-white/40">
            You're all caught up — no follow-ups needed right now.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {recommendations?.map((rec) => {
          const Icon = ACTION_ICON[rec.recommendedAction];
          return (
            <Card key={rec.id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ACTION_STYLE[rec.recommendedAction])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{rec.companyName}</span>
                      <span className="text-slate-400 dark:text-white/40">·</span>
                      <span className="text-slate-600 dark:text-white/70">{rec.jobTitle}</span>
                      <StatusBadge status={rec.status} />
                    </div>
                    {rec.reason && <p className="mt-1 text-sm text-slate-500 dark:text-white/60">{rec.reason}</p>}
                    {rec.decisionFactors.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Decision factors">
                        {rec.decisionFactors.map((factor) => (
                          <li
                            key={factor}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/[0.06] dark:text-white/60"
                          >
                            {factor}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-white/40">
                      <span>Days since applied: {rec.daysSinceApplied}</span>
                      {rec.addedByUser ? (
                        <span>Added by you</span>
                      ) : (
                        <>
                          <span>Ghosting risk: {Math.round(rec.ghostingRiskScore * 100)}%</span>
                          <span>Model confidence: {Math.round(rec.confidence * 100)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn('border-transparent hover:opacity-80', ACTION_STYLE[rec.recommendedAction])}
                    onClick={() => runAction(rec)}
                  >
                    {rec.recommendedAction}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-white/15 bg-transparent text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"
                    onClick={() => markDone(rec)}
                  >
                    Mark as done
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FollowUpDraftsDialog
        open={draftsOpen}
        onOpenChange={(open) => {
          setDraftsOpen(open);
          if (!open && !pickedDraft) setSendingFor(null);
        }}
        onPick={pickDraft}
        pickingFor={sendingFor ? `${sendingFor.companyName} · ${sendingFor.jobTitle}` : undefined}
        store={drafts}
      />

      <FollowUpSendDialog
        rec={sendingFor}
        draft={pickedDraft}
        senderName={user?.name ?? ''}
        canEmail={!isDemo && canEmail}
        onClose={closeSend}
        onSend={send}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add follow-up</DialogTitle>
            <DialogDescription>Track a follow-up you want to do yourself.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-company">Company</Label>
              <Input id="fu-company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-title">Job title</Label>
              <Input id="fu-title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select<string> value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ApplicationStatus })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-date">Date applied</Label>
              <Input id="fu-date" type="date" value={form.dateApplied} onChange={(e) => setForm({ ...form, dateApplied: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Action</Label>
              <Select<string>
                value={form.recommendedAction}
                onValueChange={(v) => setForm({ ...form, recommendedAction: v as RecommendedAction })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDED_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fu-reason">Note</Label>
              <Textarea id="fu-reason" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.companyName.trim() || !form.jobTitle.trim()} onClick={addFollowUp}>
              Add follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
