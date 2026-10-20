import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle2, Circle, FolderKanban, PencilLine, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useApplicationFilters } from '@/components/app/application-filters';
import { ApplicationFormFields, emptyApplicationForm } from '@/components/app/application-form-fields';
import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch, uploadResume } from '@/lib/api-client';
import {
  mapApplicationResponse,
  mapApplicationToRequest,
  mapResumeResponse,
  type ApplicationFormValues,
  type JobApplicationResponseDto,
  type MatchAnalysisResponseDto,
  type ResumeResponseDto,
} from '@/lib/mappers';
import { cn } from '@/lib/utils';
import { loadResumeMatchResults, saveResumeMatchResults, type ResumeMatchResultsState } from '@/lib/resume-match-results';
import type { JobApplication, Resume } from '@/types';

type Mode = 'manual' | 'existing';

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

function ModeOption({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: typeof PencilLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors',
        selected
          ? 'border-sky-400 bg-sky-500/10'
          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', selected ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-500/10 text-sky-400')}>
          <Icon className="h-4 w-4" />
        </div>
        {selected ? (
          <CheckCircle2 className="h-5 w-5 text-sky-400" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 dark:text-white/15" />
        )}
      </div>
      <div>
        <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/50">{description}</p>
      </div>
    </button>
  );
}

export function ResumeMatchPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('manual');

  // A previous result is kept until "Back to Resume Match" or logout — show it
  // instead of the form so the user doesn't have to re-run the analysis.
  useEffect(() => {
    const saved = loadResumeMatchResults();
    if (saved) navigate('/resume-match/results', { replace: true, state: saved });
  }, [navigate]);

  // Resume section — shared by both modes.
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const data = await apiFetch<ResumeResponseDto[]>('/resumes');
      const mapped = data.map(mapResumeResponse);
      setResumes(mapped);
      setSelectedResumeId((prev) => (prev && mapped.some((r) => r.id === prev) ? prev : mapped.find((r) => r.isActive)?.id ?? mapped[0]?.id ?? ''));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load resumes');
    } finally {
      setResumesLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_RESUME_TYPES.has(file.type)) {
      toast.error('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      toast.error('File exceeds the maximum allowed size of 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadResume<ResumeResponseDto>(file);
      toast.success('Resume uploaded');
      await fetchResumes();
      // Select what was just uploaded rather than leaving whatever resume was
      // previously selected — uploading a resume on this page is the user
      // saying "use this one," not just "add this to my library."
      setSelectedResumeId(uploaded.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Manual-entry mode.
  const [form, setForm] = useState<ApplicationFormValues>({ ...emptyApplicationForm, status: 'Saved' });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Existing-application mode.
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<JobApplicationResponseDto[]>('/applications');
        setApplications(data.map(mapApplicationResponse));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load applications');
      } finally {
        setApplicationsLoading(false);
      }
    })();
  }, []);

  const { filtered: filteredApplications, filterBar } = useApplicationFilters(applications);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedResumeId) {
      toast.error('Select a resume to analyze against.');
      return;
    }
    if (!form.jobDescription.trim()) {
      toast.error('Job description is required.');
      return;
    }
    setShowSaveConfirm(true);
  };

  const handleSaveDecision = async (shouldSave: boolean) => {
    setShowSaveConfirm(false);

    let applicationId: string | null = null;
    if (shouldSave) {
      setIsSaving(true);
      try {
        const payload = mapApplicationToRequest(form);
        const created = await apiFetch<JobApplicationResponseDto>('/applications', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        applicationId = created.id;
        toast.success('Application saved');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save application');
      } finally {
        setIsSaving(false);
      }
    }

    const resumeName = resumes.find((r) => r.id === selectedResumeId)?.fileName;
    const subject = [form.jobTitle, form.companyName].filter(Boolean).join(' · ') || 'this job description';

    setIsAnalyzing(true);
    try {
      const analysis = applicationId
        ? await apiFetch<MatchAnalysisResponseDto>(`/ai/applications/${applicationId}/match-score`, {
            method: 'POST',
            body: JSON.stringify({ resumeId: selectedResumeId, includeBulletSuggestions: true }),
          })
        : await apiFetch<MatchAnalysisResponseDto>('/ai/match-score/preview', {
            method: 'POST',
            body: JSON.stringify({
              jobDescription: form.jobDescription,
              resumeId: selectedResumeId,
              includeBulletSuggestions: true,
            }),
          });
      const state: ResumeMatchResultsState = { analysis, resumeName, subject, applicationId };
      saveResumeMatchResults(state);
      navigate('/resume-match/results', { state });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Match analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExistingSubmit = async () => {
    if (!selectedResumeId) {
      toast.error('Select a resume to analyze against.');
      return;
    }
    if (!selectedApplicationId) {
      toast.error('Select an application to analyze.');
      return;
    }
    const app = applications.find((a) => a.id === selectedApplicationId);
    const resumeName = resumes.find((r) => r.id === selectedResumeId)?.fileName;
    const subject = app ? `${app.jobTitle} · ${app.companyName}` : 'the selected application';

    setIsAnalyzing(true);
    try {
      const analysis = await apiFetch<MatchAnalysisResponseDto>(
        `/ai/applications/${selectedApplicationId}/match-score`,
        { method: 'POST', body: JSON.stringify({ resumeId: selectedResumeId, includeBulletSuggestions: true }) }
      );
      const state: ResumeMatchResultsState = { analysis, resumeName, subject, applicationId: selectedApplicationId };
      saveResumeMatchResults(state);
      navigate('/resume-match/results', { state });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Match analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resume Match Score"
        description="See how well your resume matches a job description before you apply."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ModeOption
          selected={mode === 'manual'}
          icon={PencilLine}
          title="Enter details manually"
          description="Paste a job description and fill in the role details yourself."
          onClick={() => switchMode('manual')}
        />
        <ModeOption
          selected={mode === 'existing'}
          icon={FolderKanban}
          title="Use an existing application"
          description="Pick from the applications you've already added to ApplyIQ."
          onClick={() => switchMode('existing')}
        />
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Resume</h2>
          <p className="text-sm text-slate-500 dark:text-white/50">Choose which resume to score against.</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Select
            value={selectedResumeId}
            onValueChange={(v) => setSelectedResumeId(v ?? '')}
            disabled={resumesLoading || resumes.length === 0}
            items={resumes.map((r) => ({ value: r.id, label: `${r.fileName}${r.isActive ? ' (Active)' : ''}` }))}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={resumesLoading ? 'Loading resumes...' : 'Select a resume'} />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.fileName}
                  {r.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!resumesLoading && resumes.length === 0 && (
            <p className="text-center text-sm text-slate-400 dark:text-white/40">
              No resumes uploaded yet — upload one below to get started.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button
            variant="outline"
            className="w-fit gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Resume'}
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">Application Information</h2>

      {mode === 'manual' ? (
        <form className="flex flex-col gap-4" onSubmit={handleManualSubmit}>
          <ApplicationFormFields form={form} setForm={setForm} requireJobDescription />

          <Button type="submit" disabled={isAnalyzing} className="mx-auto mt-10 w-fit bg-sky-500 text-white hover:bg-sky-400">
            {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {filterBar}

          <Card>
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                    <TableHead className="w-10" />
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationsLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-slate-400 dark:text-white/40">
                        Loading applications...
                      </TableCell>
                    </TableRow>
                  )}
                  {!applicationsLoading &&
                    filteredApplications.map((app) => {
                      const selected = app.id === selectedApplicationId;
                      return (
                        <TableRow
                          key={app.id}
                          onClick={() => setSelectedApplicationId(app.id)}
                          aria-selected={selected}
                          className={cn(
                            'cursor-pointer border-slate-200 dark:border-white/10',
                            selected && 'bg-sky-500/10 hover:bg-sky-500/10'
                          )}
                        >
                          <TableCell>
                            {selected ? (
                              <CheckCircle2 className="h-4 w-4 text-sky-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300 dark:text-white/15" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">{app.companyName}</TableCell>
                          <TableCell className="text-slate-600 dark:text-white/70">{app.jobTitle}</TableCell>
                          <TableCell className="text-slate-500 dark:text-white/50">{app.location}</TableCell>
                          <TableCell>
                            <StatusBadge status={app.status} />
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-white/50">{app.priorityLevel}</TableCell>
                          <TableCell className="text-slate-500 dark:text-white/50">{app.dateApplied}</TableCell>
                        </TableRow>
                      );
                    })}
                  {!applicationsLoading && filteredApplications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-slate-400 dark:text-white/40">
                        {applications.length === 0 ? (
                          <>
                            No applications yet —{' '}
                            <Link to="/applications" className="text-sky-400 hover:underline">
                              add one first
                            </Link>
                            .
                          </>
                        ) : (
                          'No applications match your filters.'
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button onClick={handleExistingSubmit} disabled={isAnalyzing} className="mx-auto mt-6 w-fit bg-sky-500 text-white hover:bg-sky-400">
            {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
          </Button>
        </div>
      )}

      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this application?</DialogTitle>
            <DialogDescription>
              You can also add it to your Applications list so you can track its status going forward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isSaving} onClick={() => handleSaveDecision(false)}>
              No
            </Button>
            <Button className="bg-sky-500 text-white hover:bg-sky-400" disabled={isSaving} onClick={() => handleSaveDecision(true)}>
              {isSaving ? 'Saving...' : 'Yes, save it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
