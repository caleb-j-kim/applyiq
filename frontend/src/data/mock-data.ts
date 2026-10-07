import type {
  FollowUpRecommendation,
  InterviewPrepResult,
  JobApplication,
  Resume,
  ResumeMatchResult,
} from '@/types';

export const mockResumes: Resume[] = [
  { id: 'r1', fileName: 'Caleb_Kim_Resume_2026.pdf', uploadedAt: '2026-07-18', isActive: true, sizeKb: 142, hasParsedText: true },
  { id: 'r2', fileName: 'Caleb_Kim_Resume_SWE_Intern.pdf', uploadedAt: '2026-06-02', isActive: false, sizeKb: 138, hasParsedText: true },
  { id: 'r3', fileName: 'Caleb_Kim_Resume_DataFocus.pdf', uploadedAt: '2026-04-11', isActive: false, sizeKb: 151, hasParsedText: true },
];

export const mockApplications: JobApplication[] = [
  {
    id: 'a1',
    companyName: 'Capital One',
    jobTitle: 'Software Engineer Intern',
    location: 'McLean, VA',
    jobUrl: 'https://capitalone.com/careers/123',
    status: 'Interviewing',
    source: 'Company Website',
    dateApplied: '2026-07-05',
    lastContactDate: '2026-07-22',
    hasReferral: true,
    referralName: 'John Smith',
    referralRelationship: 'Former coworker',
    referralContactInfo: 'john.smith@capitalone.com',
    referralDate: '2026-07-04',
    referralNotes: 'Referred into the platform engineering team.',
    recruiterName: 'Alicia Reyes',
    recruiterEmail: 'alicia.reyes@capitalone.com',
    priorityLevel: 'High',
    jobDescription: 'Build and maintain secure REST APIs using Java, Spring Boot, and PostgreSQL.',
    notes: 'Final round scheduled for next week.',
    followUpCount: 1,
    matchScore: 86,
  },
  {
    id: 'a2',
    companyName: 'Google',
    jobTitle: 'Software Engineer Intern',
    location: 'Mountain View, CA',
    status: 'Applied',
    source: 'LinkedIn',
    dateApplied: '2026-07-19',
    hasReferral: false,
    priorityLevel: 'High',
    followUpCount: 0,
    matchScore: 74,
  },
  {
    id: 'a3',
    companyName: 'Stripe',
    jobTitle: 'Backend Engineer',
    location: 'Remote',
    status: 'Online Assessment',
    source: 'Referral',
    dateApplied: '2026-07-14',
    lastContactDate: '2026-07-20',
    hasReferral: true,
    referralName: 'Maya Chen',
    referralRelationship: 'College friend',
    referralContactInfo: 'maya.chen@stripe.com',
    referralDate: '2026-07-13',
    priorityLevel: 'Medium',
    followUpCount: 0,
    matchScore: 81,
  },
  {
    id: 'a4',
    companyName: 'Deloitte',
    jobTitle: 'Technology Consultant',
    location: 'Arlington, VA',
    status: 'Applied',
    source: 'Handshake',
    dateApplied: '2026-07-01',
    hasReferral: false,
    priorityLevel: 'Low',
    followUpCount: 0,
    matchScore: 58,
  },
  {
    id: 'a5',
    companyName: 'Microsoft',
    jobTitle: 'Product Manager Intern',
    location: 'Redmond, WA',
    status: 'Final Round',
    source: 'Company Website',
    dateApplied: '2026-06-20',
    lastContactDate: '2026-07-21',
    hasReferral: false,
    priorityLevel: 'High',
    followUpCount: 2,
    matchScore: 69,
  },
  {
    id: 'a6',
    companyName: 'Booz Allen Hamilton',
    jobTitle: 'Java Developer',
    location: 'Rockville, MD',
    status: 'Ghosted',
    source: 'Indeed',
    dateApplied: '2026-06-01',
    lastContactDate: '2026-06-10',
    hasReferral: false,
    priorityLevel: 'Medium',
    followUpCount: 2,
    matchScore: 77,
  },
  {
    id: 'a7',
    companyName: 'Fintasy',
    jobTitle: 'Full-Stack Engineer',
    location: 'Remote',
    status: 'Offer',
    source: 'Referral',
    dateApplied: '2026-06-15',
    lastContactDate: '2026-07-25',
    hasReferral: true,
    referralName: 'Priya Nair',
    referralRelationship: 'Former teammate',
    referralContactInfo: 'priya@fintasy.io',
    referralDate: '2026-06-14',
    priorityLevel: 'High',
    followUpCount: 1,
    matchScore: 91,
  },
  {
    id: 'a8',
    companyName: 'JPMorgan Chase',
    jobTitle: 'Software Engineer Intern',
    location: 'Jersey City, NJ',
    status: 'Rejected',
    source: 'Company Website',
    dateApplied: '2026-05-28',
    lastContactDate: '2026-06-12',
    hasReferral: false,
    priorityLevel: 'Medium',
    followUpCount: 1,
    matchScore: 63,
  },
  {
    id: 'a9',
    companyName: 'Palantir',
    jobTitle: 'Forward Deployed Engineer',
    location: 'Washington, DC',
    status: 'Saved',
    source: 'Company Website',
    dateApplied: '2026-07-27',
    hasReferral: false,
    priorityLevel: 'Medium',
    followUpCount: 0,
    matchScore: 72,
  },
  {
    id: 'a10',
    companyName: 'Amazon',
    jobTitle: 'SDE Intern',
    location: 'Seattle, WA',
    status: 'Applied',
    source: 'University Career Fair',
    dateApplied: '2026-07-08',
    hasReferral: false,
    priorityLevel: 'Medium',
    followUpCount: 0,
    matchScore: 79,
  },
  {
    id: 'a11',
    companyName: 'Northrop Grumman',
    jobTitle: 'Software Engineer',
    location: 'Fairfax, VA',
    status: 'Withdrawn',
    source: 'Handshake',
    dateApplied: '2026-05-10',
    hasReferral: false,
    priorityLevel: 'Low',
    followUpCount: 0,
    matchScore: 55,
  },
  {
    id: 'a12',
    companyName: 'Datadog',
    jobTitle: 'Backend Engineer Intern',
    location: 'New York, NY',
    status: 'Applied',
    source: 'LinkedIn',
    dateApplied: '2026-07-21',
    hasReferral: false,
    priorityLevel: 'Medium',
    followUpCount: 0,
    matchScore: 83,
  },
];

export const mockResumeMatchResult: ResumeMatchResult = {
  matchScore: 82,
  matchedSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'Docker', 'REST APIs'],
  missingSkills: ['Kafka', 'Kubernetes', 'AWS ECS'],
  experienceGaps: ['Limited production cloud deployment experience'],
  suggestedBullets: [
    'Built a full-stack Java application using Spring Boot, PostgreSQL, and Docker to track job applications and generate AI-driven resume feedback.',
    'Designed secure REST APIs with Spring Security and JWT authentication, supporting user authentication for 500+ test accounts.',
  ],
};

export const mockInterviewPrepResult: InterviewPrepResult = {
  technicalQuestions: [
    'How would you design a REST API for tracking job applications?',
    'How does Spring Security handle JWT authentication?',
    'How would you index a PostgreSQL table that stores millions of job postings?',
    'Walk me through how you would cache resume match scores to avoid recomputing them.',
  ],
  behavioralQuestions: [
    'Tell me about a project where you had full ownership.',
    'Describe a time you had to learn a new technology quickly.',
    'Tell me about a time you worked under strict deadlines.',
  ],
  skillsToReview: ['Spring Boot REST APIs', 'JWT authentication', 'SQL joins and indexing', 'React state management'],
  talkingPoints: [
    'ApplyIQ — end-to-end resume match scoring and application tracking platform',
    "Tomorrow's Weather — a forecasting dashboard project",
    'Fintasy — full-stack fantasy finance simulator',
  ],
};

export const mockFollowUpRecommendations: FollowUpRecommendation[] = [
  {
    applicationId: 'a2',
    companyName: 'Google',
    jobTitle: 'Software Engineer Intern',
    status: 'Applied',
    daysSinceApplied: 14,
    recommendedAction: 'Send first follow-up',
    reason: 'You applied 14 days ago and have not sent a follow-up yet.',
    ghostingRiskScore: 0.42,
  },
  {
    applicationId: 'a6',
    companyName: 'Booz Allen Hamilton',
    jobTitle: 'Java Developer',
    status: 'Ghosted',
    daysSinceApplied: 61,
    recommendedAction: 'Mark as likely ghosted',
    reason: 'No response for 51 days and one follow-up already sent. Recruiter contact went unanswered.',
    ghostingRiskScore: 0.81,
  },
  {
    applicationId: 'a5',
    companyName: 'Microsoft',
    jobTitle: 'Product Manager Intern',
    status: 'Final Round',
    daysSinceApplied: 42,
    recommendedAction: 'Send final follow-up',
    reason: 'Final round completed 11 days ago with no update. One more follow-up is reasonable before moving on.',
    ghostingRiskScore: 0.58,
  },
  {
    applicationId: 'a10',
    companyName: 'Amazon',
    jobTitle: 'SDE Intern',
    status: 'Applied',
    daysSinceApplied: 25,
    recommendedAction: 'Send first follow-up',
    reason: 'You applied 25 days ago with no recruiter contact recorded yet.',
    ghostingRiskScore: 0.51,
  },
  {
    applicationId: 'a11',
    companyName: 'Northrop Grumman',
    jobTitle: 'Software Engineer',
    status: 'Withdrawn',
    daysSinceApplied: 84,
    recommendedAction: 'Archive application',
    reason: 'Application was withdrawn — safe to archive and remove from active tracking.',
    ghostingRiskScore: 0.1,
  },
];

export function computeDashboardSummary(applications: JobApplication[]) {
  const total = applications.length;
  const active = applications.filter((a) =>
    ['Saved', 'Applied', 'Online Assessment', 'Interviewing', 'Final Round'].includes(a.status)
  ).length;
  const withReferral = applications.filter((a) => a.hasReferral).length;
  const withoutReferral = total - withReferral;
  const interviewedWithReferral = applications.filter(
    (a) => a.hasReferral && ['Interviewing', 'Final Round', 'Offer', 'Rejected'].includes(a.status)
  ).length;
  const interviewedWithoutReferral = applications.filter(
    (a) => !a.hasReferral && ['Interviewing', 'Final Round', 'Offer', 'Rejected'].includes(a.status)
  ).length;

  const interviews = applications.filter((a) => ['Interviewing', 'Final Round'].includes(a.status)).length;
  const offers = applications.filter((a) => a.status === 'Offer').length;
  const rejected = applications.filter((a) => a.status === 'Rejected').length;
  const ghosted = applications.filter((a) => a.status === 'Ghosted').length;
  const followUpsNeeded = mockFollowUpRecommendations.filter(
    (r) => r.recommendedAction === 'Send first follow-up' || r.recommendedAction === 'Send final follow-up'
  ).length;

  const scored = applications.filter((a) => typeof a.matchScore === 'number');
  const avgMatchScore = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + (a.matchScore || 0), 0) / scored.length)
    : 0;

  return {
    total,
    active,
    withReferral,
    withoutReferral,
    referralResponseRate: withReferral ? Math.round((interviewedWithReferral / withReferral) * 100) : 0,
    interviewRateWithReferral: withReferral ? Math.round((interviewedWithReferral / withReferral) * 100) : 0,
    interviewRateWithoutReferral: withoutReferral
      ? Math.round((interviewedWithoutReferral / withoutReferral) * 100)
      : 0,
    interviews,
    offers,
    rejected,
    ghosted,
    followUpsNeeded,
    avgMatchScore,
  };
}

export const weeklyApplicationActivity = [
  { week: 'Jun 29', applications: 3 },
  { week: 'Jul 6', applications: 5 },
  { week: 'Jul 13', applications: 4 },
  { week: 'Jul 20', applications: 7 },
  { week: 'Jul 27', applications: 2 },
];

export const missingSkillsFrequency = [
  { skill: 'Kubernetes', count: 7 },
  { skill: 'Kafka', count: 6 },
  { skill: 'AWS ECS', count: 5 },
  { skill: 'GraphQL', count: 3 },
  { skill: 'Terraform', count: 2 },
];

export const sourceConversion = [
  { source: 'Referral', responseRate: 68 },
  { source: 'Company Website', responseRate: 41 },
  { source: 'LinkedIn', responseRate: 33 },
  { source: 'Handshake', responseRate: 24 },
  { source: 'Indeed', responseRate: 18 },
];
