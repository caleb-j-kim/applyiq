import {
  APPLICATION_STATUSES,
  INTERVIEW_STAGES,
  PRIORITY_LEVELS,
  type ApplicationStatus,
  type FollowUpRecommendation,
  type InterviewStage,
  type JobApplication,
  type PriorityLevel,
  type Resume,
  type ScoredKeyword,
} from '@/types';

// Backend enums are the UI labels upper-snake-cased ('Online Assessment' <-> 'ONLINE_ASSESSMENT').
function enumMaps<T extends string>(labels: readonly T[]) {
  const toApi = (label: string) => label.toUpperCase().replaceAll(' ', '_');
  return {
    toApi: Object.fromEntries(labels.map((l) => [l, toApi(l)])) as Record<T, string>,
    fromApi: Object.fromEntries(labels.map((l) => [toApi(l), l])) as Record<string, T>,
  };
}

const statusMaps = enumMaps(APPLICATION_STATUSES);
const stageMaps = enumMaps(INTERVIEW_STAGES);
const priorityMaps = enumMaps(PRIORITY_LEVELS);

export const STATUS_TO_API = statusMaps.toApi;
export const API_TO_STATUS = statusMaps.fromApi;
export const STAGE_TO_API = stageMaps.toApi;

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
  interviewRoundsTotal: number | null;
  interviewRoundsCompleted: number | null;
  interviewStage: string | null;
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
    priorityLevel: dto.priorityLevel ? (priorityMaps.fromApi[dto.priorityLevel] ?? 'Medium') : 'Medium',
    jobDescription: dto.jobDescription ?? undefined,
    notes: dto.notes ?? undefined,
    followUpCount: dto.followUpCount,
    interviewRoundsTotal: dto.interviewRoundsTotal ?? undefined,
    interviewRoundsCompleted: dto.interviewRoundsCompleted ?? undefined,
    interviewStage: dto.interviewStage ? stageMaps.fromApi[dto.interviewStage] : undefined,
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
  recruiterName: string;
  recruiterEmail: string;
  jobDescription: string;
  notes: string;
  interviewRoundsTotal: string;
  interviewRoundsCompleted: string;
  interviewStage: InterviewStage | '';
}

export function mapApplicationToRequest(form: ApplicationFormValues) {
  const isInterviewing = form.status === 'Interviewing';
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
    recruiterName: form.recruiterName || null,
    recruiterEmail: form.recruiterEmail || null,
    priorityLevel: priorityMaps.toApi[form.priorityLevel],
    jobDescription: form.jobDescription || null,
    notes: form.notes || null,
    interviewRoundsTotal: isInterviewing && form.interviewRoundsTotal !== '' ? Number(form.interviewRoundsTotal) : null,
    interviewRoundsCompleted:
      isInterviewing && form.interviewRoundsCompleted !== '' ? Number(form.interviewRoundsCompleted) : null,
    interviewStage: isInterviewing && form.interviewStage ? stageMaps.toApi[form.interviewStage] : null,
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
    hasParsedText: Boolean(dto.parsedText && dto.parsedText.trim()),
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

// Matches backend com.applyiq.ai.MatchAnalysisResponse field-for-field — no mapper
// function needed, the JSON already deserializes directly into this shape.
export interface MatchAnalysisResponseDto {
  id: string;
  resumeId: string;
  jobApplicationId: string | null;
  matchScore: number;
  jdKeywords: ScoredKeyword[];
  foundInResume: ScoredKeyword[];
  missed: ScoredKeyword[];
  predictedFound: ScoredKeyword[];
  predictedMissed: ScoredKeyword[];
  scoreRationale: string;
  suggestedResumeBullets: string[];
  createdAt: string;
}

export const PREP_EFFORTS = ['Low', 'Medium', 'High'] as const;
export type PrepEffort = (typeof PREP_EFFORTS)[number];
// What each level produces; sections come from PrepEffort.java. Shown on Interview Prep and Features.
export const EFFORT_DESCRIPTIONS: Record<PrepEffort, string> = {
  Low: 'Quick refresher: interviewer info, key points with a "why this company" answer, biggest gaps, likely questions and questions to ask. No company research. Fewest tokens.',
  Medium: 'Full prep: adds a qualification-by-qualification fit map, company research, knowledge topics, behavioral stories, interview strategy and notes placeholders.',
  High: 'The complete guide: everything in Medium plus interview approach, data structures recap, technical scenarios, coding strategy, and separate recruiter and hiring-manager questions. Most tokens.',
};

// Interview-prep endpoints (backend: com.applyiq.ai.InterviewPrepService):
//   POST /ai/applications/{id}/interview-prep  { resumeId, effort } -> generates and returns one prep (not saved)
//   POST /ai/interview-preps                   { ...prep }           -> saves it when the user presses "Save Results"
//   GET  /ai/interview-preps                   -> every saved prep, newest first
// Sections are open-ended so the titles come from the prompt/skill, not the frontend.
export interface InterviewPrepResponseDto {
  id: string;
  jobApplicationId: string;
  companyName: string;
  jobTitle: string;
  resumeName: string;
  effort: PrepEffort;
  sections: { title: string; bullets: string[] }[];
  createdAt: string;
}

// Backend: com.applyiq.followups.FollowUpController — same shape as the UI type except the status enum.
export type FollowUpResponseDto = Omit<FollowUpRecommendation, 'status'> & { status: string };

export function mapFollowUpResponse(dto: FollowUpResponseDto): FollowUpRecommendation {
  return { ...dto, status: API_TO_STATUS[dto.status] ?? 'Applied' };
}

export function formatWeekLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
