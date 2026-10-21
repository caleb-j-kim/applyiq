import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Circle, FolderKanban, History } from 'lucide-react';
import { toast } from 'sonner';

import { emptyApplicationForm, InterviewFields } from '@/components/app/application-form-fields';
import { useApplicationPicker } from '@/components/app/application-picker';
import { ModeOption } from '@/components/app/mode-option';
import { PageHeader } from '@/components/app/page-header';
import { useResumePicker } from '@/components/app/resume-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { demoDelay, isDemoAccount, loadDemoPreps, mockInterviewPrep } from '@/lib/demo-ai';
import {
  EFFORT_DESCRIPTIONS,
  PREP_EFFORTS,
  STAGE_TO_API,
  STATUS_TO_API,
  type ApplicationFormValues,
  type InterviewPrepResponseDto,
  type PrepEffort,
} from '@/lib/mappers';
import { interviewPrepResults, useBackgroundResult } from '@/lib/stored-results';
import { cn } from '@/lib/utils';
import type { JobApplication } from '@/types';

type Mode = 'retrieve' | 'generate';

const prepState = (prep: InterviewPrepResponseDto, saved: boolean) => ({
  prep,
  saved,
  resumeName: prep.resumeName,
  subject: `${prep.jobTitle} · ${prep.companyName}`,
  applicationId: prep.jobApplicationId,
});

export function InterviewPrepPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const [mode, setMode] = useState<Mode>('generate');
  const { selectedResume, picker: resumePicker } = useResumePicker('Choose which resume to prepare with.');
  const { selectedApplication, picker: applicationPicker, updateApplication } = useApplicationPicker();
  const [effort, setEffort] = useState<PrepEffort>('Medium');
  const [interviewer, setInterviewer] = useState({ name: '', email: '' });
  // Keeps running if the user leaves the page; the result opens whenever they're here.
  const { isRunning: isGenerating, start } = useBackgroundResult(interviewPrepResults);
  const [savedPreps, setSavedPreps] = useState<InterviewPrepResponseDto[] | null>(null);
  const [selectedPrepId, setSelectedPrepId] = useState('');
  // Asked before generating for an application that isn't marked Interviewing yet.
  const [statusPrompt, setStatusPrompt] = useState<'ask' | 'rounds' | null>(null);
  const [rounds, setRounds] = useState<ApplicationFormValues>(emptyApplicationForm);

  // Same as Resume Match: the last opened result stays until "Back" or logout.
  useEffect(() => {
    const saved = interviewPrepResults.load();
    if (saved) navigate('/interview-prep/results', { replace: true, state: saved });
  }, [navigate]);

  // Picking an application pre-fills its recruiter; edits are saved back to it on Generate.
  useEffect(() => {
    setInterviewer({ name: selectedApplication?.recruiterName ?? '', email: selectedApplication?.recruiterEmail ?? '' });
  }, [selectedApplication]);

  useEffect(() => {
    if (mode !== 'retrieve' || savedPreps) return;
    (async () => {
      try {
        setSavedPreps(isDemo ? loadDemoPreps() : await apiFetch<InterviewPrepResponseDto[]>('/ai/interview-preps'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load saved interview prep');
        setSavedPreps([]);
      }
    })();
  }, [mode, savedPreps, isDemo]);

  const retrieve = () => {
    const prep = savedPreps?.find((p) => p.id === selectedPrepId);
    if (!prep) {
      toast.error('Select a saved interview prep to retrieve.');
      return;
    }
    const state = prepState(prep, true);
    interviewPrepResults.save(state);
    navigate('/interview-prep/results', { state });
  };

  const handleGenerate = () => {
    const app = selectedApplication;
    if (!selectedResume) {
      toast.error('Select a resume to prepare with.');
      return;
    }
    if (!app) {
      toast.error('Select an application to prepare for.');
      return;
    }
    if (!app.jobDescription?.trim()) {
      toast.error('This application has no job description to prepare from.');
      return;
    }
    if (app.status === 'Interviewing') generate(app);
    else setStatusPrompt('ask');
  };

  const askRounds = () => {
    const app = selectedApplication;
    setRounds({
      ...emptyApplicationForm,
      interviewRoundsTotal: app?.interviewRoundsTotal?.toString() ?? '',
      interviewRoundsCompleted: app?.interviewRoundsCompleted?.toString() ?? '',
      interviewStage: app?.interviewStage ?? '',
    });
    setStatusPrompt('rounds');
  };

  // markInterviewing: the user said yes to the status prompt and filled in their rounds.
  const generate = (app: JobApplication, markInterviewing = false) => {
    setStatusPrompt(null);
    if (!selectedResume) return;
    const resume = selectedResume;
    const name = interviewer.name.trim();
    const email = interviewer.email.trim();
    start(async () => {
      // Interviewer edits and the status change are saved to the application first.
      const patch: Record<string, unknown> = {};
      let updated = app;
      if ((name && name !== app.recruiterName) || (email && email !== app.recruiterEmail)) {
        Object.assign(patch, { recruiterName: name || null, recruiterEmail: email || null });
        updated = { ...updated, recruiterName: name || app.recruiterName, recruiterEmail: email || app.recruiterEmail };
      }
      if (markInterviewing) {
        const total = rounds.interviewRoundsTotal === '' ? undefined : Number(rounds.interviewRoundsTotal);
        const completed = rounds.interviewRoundsCompleted === '' ? undefined : Number(rounds.interviewRoundsCompleted);
        const stage = rounds.interviewStage || undefined;
        Object.assign(patch, {
          status: STATUS_TO_API.Interviewing,
          interviewRoundsTotal: total ?? null,
          interviewRoundsCompleted: completed ?? null,
          interviewStage: stage ? STAGE_TO_API[stage] : null,
        });
        updated = { ...updated, status: 'Interviewing', interviewRoundsTotal: total, interviewRoundsCompleted: completed, interviewStage: stage };
      }
      if (Object.keys(patch).length > 0) {
        await apiFetch(`/applications/${app.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
        updateApplication(updated);
      }

      // Demo account: no Claude call. Everyone else gets a real Claude-generated prep from the backend.
      // Nothing is saved until the user presses "Save Results" on the results page.
      let prep: InterviewPrepResponseDto;
      if (isDemo) {
        await demoDelay();
        prep = mockInterviewPrep(updated, resume, effort);
      } else {
        prep = await apiFetch<InterviewPrepResponseDto>(`/ai/applications/${app.id}/interview-prep`, {
          method: 'POST',
          body: JSON.stringify({ resumeId: resume.id, effort: effort.toUpperCase() }),
        });
      }
      return prepState(prep, false);
    }, 'Interview prep generation failed');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Interview Preparation Material"
        description="Generate personalized prep material for an upcoming interview."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ModeOption
          selected={mode === 'retrieve'}
          icon={History}
          title="Retrieve Previous Interview Prep"
          description="Open interview prep you've already generated."
          onClick={() => setMode('retrieve')}
        />
        <ModeOption
          selected={mode === 'generate'}
          icon={FolderKanban}
          title="Use an existing application"
          description="Generate new prep for one of the applications you've added to ApplyIQ."
          onClick={() => setMode('generate')}
        />
      </div>

      {mode === 'retrieve' ? (
        <>
          <Card>
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                    <TableHead className="w-10" />
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Effort</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedPreps?.map((prep) => {
                    const selected = prep.id === selectedPrepId;
                    return (
                      <TableRow
                        key={prep.id}
                        onClick={() => setSelectedPrepId(prep.id)}
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
                        <TableCell className="font-medium text-slate-900 dark:text-white">{prep.companyName}</TableCell>
                        <TableCell className="text-slate-600 dark:text-white/70">{prep.jobTitle}</TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{prep.effort}</TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{prep.resumeName}</TableCell>
                        <TableCell className="text-slate-500 dark:text-white/50">{new Date(prep.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  {(!savedPreps || savedPreps.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-400 dark:text-white/40">
                        {savedPreps ? 'No saved interview prep yet. Generate some from an application.' : 'Loading saved interview prep...'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button onClick={retrieve} disabled={!selectedPrepId} className="mx-auto mt-6 w-fit bg-sky-500 text-white hover:bg-sky-400">
            Retrieve
          </Button>
        </>
      ) : (
        <>
          {resumePicker}

          <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">Application Information</h2>

          <div className="flex flex-col gap-4">{applicationPicker}</div>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Interviewer</h2>
              <p className="text-sm text-slate-500 dark:text-white/50">
                Who you're meeting with. Saved to the application's recruiter fields.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="interviewerName">Name</Label>
                <Input id="interviewerName" value={interviewer.name} onChange={(e) => setInterviewer((i) => ({ ...i, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="interviewerEmail">Email</Label>
                <Input
                  id="interviewerEmail"
                  type="email"
                  value={interviewer.email}
                  onChange={(e) => setInterviewer((i) => ({ ...i, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Effort</h2>
              <p className="text-sm text-slate-500 dark:text-white/50">More effort means more detail, and more AI tokens.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Effort">
              {PREP_EFFORTS.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={effort === level}
                  onClick={() => setEffort(level)}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                    effort === level
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/[0.06]'
                  )}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{level} effort</span>
                  <span className="text-xs text-slate-500 dark:text-white/50">{EFFORT_DESCRIPTIONS[level]}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button onClick={handleGenerate} disabled={isGenerating} className="mx-auto mt-6 w-fit bg-sky-500 text-white hover:bg-sky-400">
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </>
      )}

      <Dialog open={statusPrompt !== null} onOpenChange={(open) => !open && setStatusPrompt(null)}>
        <DialogContent className="sm:max-w-md">
          {statusPrompt === 'ask' ? (
            <>
              <DialogHeader>
                <DialogTitle>Update status to Interviewing?</DialogTitle>
                <DialogDescription>
                  {selectedApplication?.jobTitle} at {selectedApplication?.companyName} is marked as {selectedApplication?.status}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => selectedApplication && generate(selectedApplication)}>
                  No, keep {selectedApplication?.status}
                </Button>
                <Button className="bg-sky-500 text-white hover:bg-sky-400" onClick={askRounds}>
                  Yes
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Where are you in the process?</DialogTitle>
                <DialogDescription>Saved to the application before your prep is generated.</DialogDescription>
              </DialogHeader>
              <InterviewFields form={rounds} setForm={setRounds} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusPrompt(null)}>
                  Cancel
                </Button>
                <Button className="bg-sky-500 text-white hover:bg-sky-400" onClick={() => selectedApplication && generate(selectedApplication, true)}>
                  Generate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
