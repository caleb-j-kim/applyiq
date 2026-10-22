// Single source for the option lists the forms, filters and boards iterate over;
// the union types are derived from them so the two can't drift apart.
export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Online Assessment',
  'Interviewing',
  'Final Round',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const INTERVIEW_STAGES = [
  'Phone Screening',
  'First Round',
  'Second Round',
  'Third Round',
  'Fourth Round',
  'Fifth Round',
  'Final Round',
] as const;
export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  jobUrl?: string;
  status: ApplicationStatus;
  source: string;
  dateApplied: string;
  lastContactDate?: string;
  hasReferral: boolean;
  referralName?: string;
  referralRelationship?: string;
  referralContactInfo?: string;
  referralDate?: string;
  referralNotes?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  priorityLevel: PriorityLevel;
  jobDescription?: string;
  notes?: string;
  followUpCount: number;
  interviewRoundsTotal?: number;
  interviewRoundsCompleted?: number;
  interviewStage?: InterviewStage;
}

export interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  isActive: boolean;
  sizeKb: number;
  hasParsedText: boolean;
}

export interface ScoredKeyword {
  name: string;
  weight: number; // 1-100: how central this keyword is to the role, higher = more expected
}

export const RECOMMENDED_ACTIONS = [
  'Send first follow-up',
  'Send final follow-up',
  'Wait longer',
  'Mark as likely ghosted',
  'Move to rejected',
  'Archive application',
] as const;
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

export interface FollowUpRecommendation {
  id: string; // what the done/action/send endpoints take: the application id, or the user-added follow-up's id
  applicationId: string | null; // null for follow-ups the user added
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  daysSinceApplied: number;
  recommendedAction: RecommendedAction;
  reason: string;
  decisionFactors: string[]; // the decision tree's path, one plain-English factor per feature it split on
  ghostingRiskScore: number;
  confidence: number; // share of training samples in the leaf that agreed with this action
  addedByUser: boolean; // created on the Follow-Ups page, not by the model — no factors/risk/confidence
}
