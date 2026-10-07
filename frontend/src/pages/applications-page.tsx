import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api-client';
import {
  mapApplicationResponse,
  mapApplicationToRequest,
  STATUS_TO_API,
  type ApplicationFormValues,
  type JobApplicationResponseDto,
} from '@/lib/mappers';
import type { ApplicationStatus, InterviewStage, JobApplication, PriorityLevel } from '@/types';

const ALL_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interviewing',
  'Final Round',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
];

const KANBAN_COLUMNS: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interviewing',
  'Final Round',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
];

const INTERVIEW_STAGES: InterviewStage[] = [
  'Phone Screening',
  'First Round',
  'Second Round',
  'Third Round',
  'Fourth Round',
  'Fifth Round',
  'Final Round',
];

const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];

const emptyForm: ApplicationFormValues = {
  companyName: '',
  jobTitle: '',
  location: '',
  jobUrl: '',
  status: 'Applied',
  source: '',
  dateApplied: new Date().toISOString().slice(0, 10),
  priorityLevel: 'Medium',
  hasReferral: false,
  referralName: '',
  referralContactInfo: '',
  jobDescription: '',
  notes: '',
  interviewRoundsTotal: '',
  interviewRoundsCompleted: '',
  interviewStage: '',
};

function toFormValues(app: JobApplication): ApplicationFormValues {
  return {
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    location: app.location,
    jobUrl: app.jobUrl ?? '',
    status: app.status,
    source: app.source,
    dateApplied: app.dateApplied,
    priorityLevel: app.priorityLevel,
    hasReferral: app.hasReferral,
    referralName: app.referralName ?? '',
    referralContactInfo: app.referralContactInfo ?? '',
    jobDescription: app.jobDescription ?? '',
    notes: app.notes ?? '',
    interviewRoundsTotal: app.interviewRoundsTotal?.toString() ?? '',
    interviewRoundsCompleted: app.interviewRoundsCompleted?.toString() ?? '',
    interviewStage: app.interviewStage ?? '',
  };
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApplicationFormValues>(emptyForm);

  const fetchApplications = async () => {
    try {
      const data = await apiFetch<JobApplicationResponseDto[]>('/applications');
      setApplications(data.map(mapApplicationResponse));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filtered = useMemo(() => {
    return applications
      .filter((app) => statusFilter === 'All' || app.status === statusFilter)
      .filter((app) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return app.companyName.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : -1));
  }, [applications, search, statusFilter]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (app: JobApplication) => {
    setEditingId(app.id);
    setForm(toFormValues(app));
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = mapApplicationToRequest(form);
      if (editingId) {
        await apiFetch(`/applications/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Application updated');
      } else {
        await apiFetch('/applications', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Application added');
      }
      await fetchApplications();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      await apiFetch(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: STATUS_TO_API[status] }),
      });
      await fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleDelete = async (app: JobApplication) => {
    if (!window.confirm(`Delete the application to ${app.companyName}? This can't be undone.`)) return;
    try {
      await apiFetch(`/applications/${app.id}`, { method: 'DELETE' });
      toast.success('Application deleted');
      await fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete application');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications"
        description="Every job you've applied to, in one place."
        actions={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingId(null);
                setForm(emptyForm);
              }
            }}
          >
            <DialogTrigger
              render={<Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400" onClick={openAddDialog} />}
            >
              <Plus className="h-4 w-4" />
              Add application
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit application' : 'Add application'}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update this job's details." : "Track a new job you've applied to."}
                </DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
                      required
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="jobTitle">Job title</Label>
                    <Input
                      id="jobTitle"
                      required
                      value={form.jobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="jobUrl">Job posting URL</Label>
                    <Input
                      id="jobUrl"
                      type="url"
                      value={form.jobUrl}
                      onChange={(e) => setForm((f) => ({ ...f, jobUrl: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v as ApplicationStatus }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={form.priorityLevel}
                      onValueChange={(v) => setForm((f) => ({ ...f, priorityLevel: v as PriorityLevel }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dateApplied">Date applied</Label>
                    <Input
                      id="dateApplied"
                      type="date"
                      value={form.dateApplied}
                      onChange={(e) => setForm((f) => ({ ...f, dateApplied: e.target.value }))}
                      className="border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white focus-visible:border-sky-400 focus-visible:ring-sky-400/30"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source">Application source</Label>
                  <Input
                    id="source"
                    placeholder="LinkedIn, company website, referral..."
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hasReferral"
                    checked={form.hasReferral}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, hasReferral: checked === true }))}
                  />
                  <Label htmlFor="hasReferral">I have a referral for this job</Label>
                </div>
                {form.hasReferral && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-white/10 p-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="referralName">Referral name</Label>
                      <Input
                        id="referralName"
                        value={form.referralName}
                        onChange={(e) => setForm((f) => ({ ...f, referralName: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="referralContactInfo">Referral contact</Label>
                      <Input
                        id="referralContactInfo"
                        value={form.referralContactInfo}
                        onChange={(e) => setForm((f) => ({ ...f, referralContactInfo: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {form.status === 'Interviewing' && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-white/10 p-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="interviewRoundsTotal">Total interview rounds</Label>
                      <Input
                        id="interviewRoundsTotal"
                        type="number"
                        min={0}
                        value={form.interviewRoundsTotal}
                        onChange={(e) => setForm((f) => ({ ...f, interviewRoundsTotal: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="interviewRoundsCompleted">Rounds completed</Label>
                      <Input
                        id="interviewRoundsCompleted"
                        type="number"
                        min={0}
                        value={form.interviewRoundsCompleted}
                        onChange={(e) => setForm((f) => ({ ...f, interviewRoundsCompleted: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label>Current interview stage</Label>
                      <Select
                        value={form.interviewStage}
                        onValueChange={(v) => setForm((f) => ({ ...f, interviewStage: v as InterviewStage }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERVIEW_STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jobDescription">Job description</Label>
                  <Textarea
                    id="jobDescription"
                    rows={3}
                    value={form.jobDescription}
                    onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="bg-sky-500 text-white hover:bg-sky-400">
                    {isSubmitting ? 'Saving...' : 'Save application'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <Input
            placeholder="Search by company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-black/30 pl-8 text-slate-900 dark:text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | 'All')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="w-[125%] -ml-[12.5%] border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] backdrop-blur">
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-slate-400 dark:text-white/40">
                        Loading applications...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    filtered.map((app) => (
                      <TableRow key={app.id} className="border-slate-200 dark:border-white/10">
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            {app.companyName}
                            {app.jobUrl && (
                              <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-slate-400 dark:text-white/30 hover:text-sky-400">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-white/70">{app.jobTitle}</TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{app.location}</TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <Select
                              value={app.status}
                              onValueChange={(v) => handleStatusChange(app.id, v as ApplicationStatus)}
                            >
                              <SelectTrigger className="h-auto w-auto border-none bg-transparent p-0 shadow-none">
                                <StatusBadge status={app.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {app.status === 'Interviewing' && app.interviewStage && (
                              <span className="text-xs whitespace-nowrap text-slate-400 dark:text-white/40">
                                {app.interviewRoundsCompleted ?? 0}/{app.interviewRoundsTotal ?? '?'} rounds ·{' '}
                                {app.interviewStage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">
                          {app.hasReferral ? `Yes — ${app.referralName ?? ''}` : 'No'}
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{app.priorityLevel}</TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{app.dateApplied}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                              aria-label={`Edit ${app.companyName}`}
                              onClick={() => openEditDialog(app)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-slate-500 dark:text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
                              aria-label={`Delete ${app.companyName}`}
                              onClick={() => handleDelete(app)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-slate-400 dark:text-white/40">
                        No applications match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="flex w-[125%] -ml-[12.5%] gap-4 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((status) => {
              const columnApps = filtered.filter((a) => a.status === status);
              return (
                <div key={status} className="w-64 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <StatusBadge status={status} />
                    <span className="text-xs text-slate-400 dark:text-white/40">{columnApps.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {columnApps.map((app) => (
                      <Card key={app.id} className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
                        <CardContent className="px-3 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">{app.jobTitle}</div>
                              <div className="text-xs text-slate-500 dark:text-white/50">{app.companyName}</div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="h-6 w-6 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                                aria-label={`Edit ${app.companyName}`}
                                onClick={() => openEditDialog(app)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="h-6 w-6 text-slate-500 dark:text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
                                aria-label={`Delete ${app.companyName}`}
                                onClick={() => handleDelete(app)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-white/40">
                            <span>{app.dateApplied}</span>
                            {app.hasReferral && <span className="text-sky-400">Referred</span>}
                          </div>
                          {app.status === 'Interviewing' && app.interviewStage && (
                            <div className="mt-1 text-xs text-slate-400 dark:text-white/40">
                              {app.interviewRoundsCompleted ?? 0}/{app.interviewRoundsTotal ?? '?'} rounds ·{' '}
                              {app.interviewStage}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {columnApps.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-200 dark:border-white/10 px-3 py-6 text-center text-xs text-slate-400 dark:text-white/30">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
