import type { ApplicationStatus, JobApplication, PriorityLevel, Resume } from '@/types';

export const STATUS_TO_API: Record<ApplicationStatus, string> = {
  Saved: 'SAVED',
  Applied: 'APPLIED',
  'Online Assessment': 'ONLINE_ASSESSMENT',
  Interviewing: 'INTERVIEWING',
  'Final Round': 'FINAL_ROUND',
  Offer: 'OFFER',
  Rejected: 'REJECTED',
  Ghosted: 'GHOSTED',
  Withdrawn: 'WITHDRAWN',
};

export const API_TO_STATUS: Record<string, ApplicationStatus> = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([literal, api]) => [api, literal as ApplicationStatus])
);

export const PRIORITY_TO_API: Record<PriorityLevel, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

export const API_TO_PRIORITY: Record<string, PriorityLevel> = Object.fromEntries(
  Object.entries(PRIORITY_TO_API).map(([literal, api]) => [api, literal as PriorityLevel])
);

export interface JobApplicationResponseDto {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string | null;
  jobUrl: string | null;
  status: string;
  source: string | null;
  dateApplied: string | null;
  lastContactDate: string | null;
  hasReferral: boolean;
  referralName: string | null;
  referralRelationship: string | null;
  referralContactInfo: string | null;
  referralDate: string | null;
  referralNotes: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  priorityLevel: string | null;
  jobDescription: string | null;
  notes: string | null;
  followUpCount: number;
}

export function mapApplicationResponse(dto: JobApplicationResponseDto): JobApplication {
  return {
    id: dto.id,
    companyName: dto.companyName,
    jobTitle: dto.jobTitle,
    location: dto.location ?? '',
    jobUrl: dto.jobUrl ?? undefined,
    status: API_TO_STATUS[dto.status] ?? 'Saved',
    source: dto.source ?? 'Other',
    dateApplied: dto.dateApplied ?? '',
    lastContactDate: dto.lastContactDate ?? undefined,
    hasReferral: dto.hasReferral,
    referralName: dto.referralName ?? undefined,
    referralRelationship: dto.referralRelationship ?? undefined,
    referralContactInfo: dto.referralContactInfo ?? undefined,
    referralDate: dto.referralDate ?? undefined,
    referralNotes: dto.referralNotes ?? undefined,
    recruiterName: dto.recruiterName ?? undefined,
    recruiterEmail: dto.recruiterEmail ?? undefined,
    priorityLevel: dto.priorityLevel ? (API_TO_PRIORITY[dto.priorityLevel] ?? 'Medium') : 'Medium',
    jobDescription: dto.jobDescription ?? undefined,
    notes: dto.notes ?? undefined,
    followUpCount: dto.followUpCount,
    matchScore: undefined,
  };
}

export interface ApplicationFormValues {
  companyName: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  status: ApplicationStatus;
  source: string;
  dateApplied: string;
  priorityLevel: PriorityLevel;
  hasReferral: boolean;
  referralName: string;
  referralContactInfo: string;
  jobDescription: string;
  notes: string;
}

export function mapApplicationToRequest(form: ApplicationFormValues) {
  return {
    companyName: form.companyName,
    jobTitle: form.jobTitle,
    location: form.location || null,
    jobUrl: form.jobUrl || null,
    status: STATUS_TO_API[form.status],
    source: form.source || 'Other',
    dateApplied: form.dateApplied || null,
    hasReferral: form.hasReferral,
    referralName: form.hasReferral ? form.referralName || null : null,
    referralContactInfo: form.hasReferral ? form.referralContactInfo || null : null,
    priorityLevel: PRIORITY_TO_API[form.priorityLevel],
    jobDescription: form.jobDescription || null,
    notes: form.notes || null,
  };
}

export interface ResumeResponseDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  parsedText: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapResumeResponse(dto: ResumeResponseDto): Resume {
  return {
    id: dto.id,
    fileName: dto.fileName,
    uploadedAt: dto.createdAt.slice(0, 10),
    isActive: dto.active,
    sizeKb: Math.round(dto.fileSizeBytes / 1024),
  };
}

export interface DashboardResponseDto {
  total: number;
  active: number;
  withReferral: number;
  withoutReferral: number;
  referralResponseRate: number;
  interviewRateWithReferral: number;
  interviewRateWithoutReferral: number;
  interviews: number;
  offers: number;
  rejected: number;
  ghosted: number;
  followUpsNeeded: number;
  statusBreakdown: { status: string; count: number }[];
  weeklyActivity: { weekStart: string; applications: number }[];
  recentApplications: JobApplicationResponseDto[];
}

export function formatWeekLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
