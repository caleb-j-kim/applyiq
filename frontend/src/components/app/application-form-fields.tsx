import type { Dispatch, SetStateAction } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ApplicationFormValues } from '@/lib/mappers';
import {
  APPLICATION_STATUSES,
  INTERVIEW_STAGES,
  PRIORITY_LEVELS,
  type ApplicationStatus,
  type InterviewStage,
  type PriorityLevel,
} from '@/types';

export const emptyApplicationForm: ApplicationFormValues = {
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
  recruiterName: '',
  recruiterEmail: '',
  jobDescription: '',
  notes: '',
  interviewRoundsTotal: '',
  interviewRoundsCompleted: '',
  interviewStage: '',
};

function OptionSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | '';
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  return (
    <Select<string> value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// The job-application fields shared by the Applications dialog and the Resume Match
// manual-entry form. Callers own the <form>, submit button and any surrounding layout.
export function ApplicationFormFields({
  form,
  setForm,
  requireJobDetails = false,
  requireJobDescription = false,
}: {
  form: ApplicationFormValues;
  setForm: Dispatch<SetStateAction<ApplicationFormValues>>;
  requireJobDetails?: boolean;
  requireJobDescription?: boolean;
}) {
  const set = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const textField = (key: 'companyName' | 'jobTitle' | 'location' | 'jobUrl' | 'referralName' | 'referralContactInfo' | 'recruiterName' | 'recruiterEmail', label: string, extra?: { type?: string; required?: boolean }) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} type={extra?.type} required={extra?.required} value={form[key]} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {textField('companyName', 'Company name', { required: requireJobDetails })}
        {textField('jobTitle', 'Job title', { required: requireJobDetails })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {textField('location', 'Location')}
        {textField('jobUrl', 'Job posting URL', { type: 'url' })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <OptionSelect<ApplicationStatus> value={form.status} options={APPLICATION_STATUSES} onChange={(v) => set('status', v)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <OptionSelect<PriorityLevel> value={form.priorityLevel} options={PRIORITY_LEVELS} onChange={(v) => set('priorityLevel', v)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateApplied">Date applied</Label>
          <Input
            id="dateApplied"
            type="date"
            value={form.dateApplied}
            onChange={(e) => set('dateApplied', e.target.value)}
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
          onChange={(e) => set('source', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {textField('recruiterName', 'Recruiter / interviewer name')}
        {textField('recruiterEmail', 'Recruiter / interviewer email', { type: 'email' })}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="hasReferral"
          checked={form.hasReferral}
          onCheckedChange={(checked) => set('hasReferral', checked === true)}
        />
        <Label htmlFor="hasReferral">I have a referral for this job</Label>
      </div>
      {form.hasReferral && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 dark:border-white/10 p-3 sm:grid-cols-2">
          {textField('referralName', 'Referral name')}
          {textField('referralContactInfo', 'Referral contact')}
        </div>
      )}

      {form.status === 'Interviewing' && <InterviewFields form={form} setForm={setForm} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="jobDescription">
          Job description {requireJobDescription && <span className="text-rose-400">*</span>}
        </Label>
        <Textarea
          id="jobDescription"
          required={requireJobDescription}
          rows={requireJobDescription ? 8 : 3}
          placeholder={requireJobDescription ? 'Paste the full job posting here...' : undefined}
          value={form.jobDescription}
          onChange={(e) => set('jobDescription', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </>
  );
}

// Interview rounds and stage; shown for "Interviewing" applications here and in Interview Prep's status prompt.
export function InterviewFields({
  form,
  setForm,
}: {
  form: ApplicationFormValues;
  setForm: Dispatch<SetStateAction<ApplicationFormValues>>;
}) {
  const set = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 dark:border-white/10 p-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interviewRoundsTotal">Total interview rounds</Label>
        <NumberInput id="interviewRoundsTotal" value={form.interviewRoundsTotal} onValueChange={(v) => set('interviewRoundsTotal', v)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interviewRoundsCompleted">Rounds completed</Label>
        <NumberInput
          id="interviewRoundsCompleted"
          value={form.interviewRoundsCompleted}
          max={Number(form.interviewRoundsTotal) || undefined}
          onValueChange={(v) => set('interviewRoundsCompleted', v)}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>Current interview stage</Label>
        <OptionSelect<InterviewStage>
          value={form.interviewStage}
          options={INTERVIEW_STAGES}
          onChange={(v) => set('interviewStage', v)}
          placeholder="Select a stage"
        />
      </div>
    </div>
  );
}
