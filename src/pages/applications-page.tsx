import { useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, Plus, Search } from 'lucide-react';

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
import { mockApplications } from '@/data/mock-data';
import type { ApplicationStatus, JobApplication, PriorityLevel } from '@/types';

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

const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];

const emptyForm = {
  companyName: '',
  jobTitle: '',
  location: '',
  jobUrl: '',
  status: 'Applied' as ApplicationStatus,
  source: '',
  dateApplied: new Date().toISOString().slice(0, 10),
  priorityLevel: 'Medium' as PriorityLevel,
  hasReferral: false,
  referralName: '',
  referralContactInfo: '',
  jobDescription: '',
  notes: '',
};

export function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const newApp: JobApplication = {
      id: `a${Date.now()}`,
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      location: form.location,
      jobUrl: form.jobUrl || undefined,
      status: form.status,
      source: form.source || 'Other',
      dateApplied: form.dateApplied,
      hasReferral: form.hasReferral,
      referralName: form.hasReferral ? form.referralName : undefined,
      referralContactInfo: form.hasReferral ? form.referralContactInfo : undefined,
      priorityLevel: form.priorityLevel,
      jobDescription: form.jobDescription || undefined,
      notes: form.notes || undefined,
      followUpCount: 0,
    };
    setApplications((prev) => [newApp, ...prev]);
    setForm(emptyForm);
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications"
        description="Every job you've applied to, in one place."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400" />}>
              <Plus className="h-4 w-4" />
              Add application
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add application</DialogTitle>
                <DialogDescription>Track a new job you've applied to.</DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={handleAdd}>
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
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 p-3">
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
                  <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-400">
                    Save application
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/15 bg-black/30 pl-8 text-white"
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
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app) => (
                    <TableRow key={app.id} className="border-white/10">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          {app.companyName}
                          {app.jobUrl && (
                            <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-white/30 hover:text-sky-400">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">{app.jobTitle}</TableCell>
                      <TableCell className="text-white/50">{app.location}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-white/50">
                        {app.hasReferral ? `Yes — ${app.referralName ?? ''}` : 'No'}
                      </TableCell>
                      <TableCell className="text-white/50">{app.priorityLevel}</TableCell>
                      <TableCell className="text-white/70">
                        {typeof app.matchScore === 'number' ? `${app.matchScore}%` : '—'}
                      </TableCell>
                      <TableCell className="text-white/50">{app.dateApplied}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-white/40">
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
          <div className="flex gap-4 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((status) => {
              const columnApps = filtered.filter((a) => a.status === status);
              return (
                <div key={status} className="w-64 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <StatusBadge status={status} />
                    <span className="text-xs text-white/40">{columnApps.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {columnApps.map((app) => (
                      <Card key={app.id} className="border-white/10 bg-white/[0.03]">
                        <CardContent className="px-3 py-3">
                          <div className="text-sm font-medium text-white">{app.jobTitle}</div>
                          <div className="text-xs text-white/50">{app.companyName}</div>
                          <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                            <span>{app.dateApplied}</span>
                            {app.hasReferral && <span className="text-sky-400">Referred</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {columnApps.length === 0 && (
                      <div className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/30">
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
