export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Online Assessment'
  | 'Interviewing'
  | 'Final Round'
  | 'Offer'
  | 'Rejected'
  | 'Ghosted'
  | 'Withdrawn';

export type PriorityLevel = 'Low' | 'Medium' | 'High';

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
  matchScore?: number;
}

export interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  isActive: boolean;
  sizeKb: number;
}

export interface ResumeMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceGaps: string[];
  suggestedBullets: string[];
}

export type InterviewType = 'Technical' | 'Behavioral' | 'System Design' | 'Full-Stack' | 'AI/ML';

export interface InterviewPrepResult {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  skillsToReview: string[];
  talkingPoints: string[];
}

export type RecommendedAction =
  | 'Send first follow-up'
  | 'Send final follow-up'
  | 'Wait longer'
  | 'Mark as likely ghosted'
  | 'Move to rejected'
  | 'Archive application';

export interface FollowUpRecommendation {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  daysSinceApplied: number;
  recommendedAction: RecommendedAction;
  reason: string;
  ghostingRiskScore: number;
}
