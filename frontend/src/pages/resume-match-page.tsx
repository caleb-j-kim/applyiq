import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban, PencilLine } from 'lucide-react';
import { toast } from 'sonner';

import { useApplicationPicker } from '@/components/app/application-picker';
import { ApplicationFormFields, emptyApplicationForm } from '@/components/app/application-form-fields';
import { ModeOption } from '@/components/app/mode-option';
import { PageHeader } from '@/components/app/page-header';
import { useResumePicker } from '@/components/app/resume-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { demoDelay, isDemoAccount, mockMatchAnalysis } from '@/lib/demo-ai';
import {
  mapApplicationToRequest,
  type ApplicationFormValues,
  type JobApplicationResponseDto,
  type MatchAnalysisResponseDto,
} from '@/lib/mappers';
import { resumeMatchResults, useBackgroundResult } from '@/lib/stored-results';

type Mode = 'manual' | 'existing';

export function ResumeMatchPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('manual');

  // A previous result is kept until "Back to Resume Match" or logout — show it
  // instead of the form so the user doesn't have to re-run the analysis.
  useEffect(() => {
    const saved = resumeMatchResults.load();
    if (saved) navigate('/resume-match/results', { replace: true, state: saved });
  }, [navigate]);

  const { user } = useAuth();
  const isDemo = isDemoAccount(user?.email);
  const { selectedResume, picker: resumePicker } = useResumePicker('Choose which resume to score against.');
  const { selectedApplication, picker: applicationPicker } = useApplicationPicker();

  // Manual-entry mode.
  const [form, setForm] = useState<ApplicationFormValues>({ ...emptyApplicationForm, status: 'Saved' });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Keeps running if the user leaves the page; the result opens whenever they're here.
  const { isRunning: isAnalyzing, start: startAnalysis } = useBackgroundResult(resumeMatchResults);

  // Demo account: no Claude call — build the result locally from the same inputs.
  const runAnalysis = async (path: string, jobDescription: string, applicationId: string | null) => {
    if (!selectedResume) throw new Error('Select a resume to analyze against.');
    if (isDemo) {
      await demoDelay();
      return mockMatchAnalysis({ jobDescription, resumeText: selectedResume.parsedText ?? '', resumeId: selectedResume.id, applicationId });
    }
    return apiFetch<MatchAnalysisResponseDto>(path, {
      method: 'POST',
      body: JSON.stringify({ resumeId: selectedResume.id, includeBulletSuggestions: true, ...(applicationId ? {} : { jobDescription }) }),
    });
  };

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedResume) {
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

    const subject = [form.jobTitle, form.companyName].filter(Boolean).join(' · ') || 'this job description';

    const resumeName = selectedResume?.fileName;
    startAnalysis(async () => {
      const analysis = await runAnalysis(
        applicationId ? `/ai/applications/${applicationId}/match-score` : '/ai/match-score/preview',
        form.jobDescription,
        applicationId
      );
      return { analysis, resumeName, subject, applicationId };
    }, 'Match analysis failed');
  };

  const handleExistingSubmit = () => {
    const app = selectedApplication;
    if (!app) {
      toast.error('Select an application to analyze.');
      return;
    }
    if (!app.jobDescription?.trim()) {
      toast.error('This application has no job description to analyze.');
      return;
    }

    const resumeName = selectedResume?.fileName;
    startAnalysis(async () => {
      const analysis = await runAnalysis(`/ai/applications/${app.id}/match-score`, app.jobDescription ?? '', app.id);
      return { analysis, resumeName, subject: `${app.jobTitle} · ${app.companyName}`, applicationId: app.id };
    }, 'Match analysis failed');
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

      {resumePicker}

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
          {applicationPicker}

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
