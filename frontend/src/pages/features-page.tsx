import {
  ListChecks,
  Target,
  MessagesSquare,
  BellRing,
  Ghost,
  FileStack,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/app/status-badge';
import type { ApplicationStatus } from '@/types';

interface FeatureDetail {
  icon: LucideIcon;
  title: string;
  summary: string;
  points: string[];
}

const CORE_FEATURES: FeatureDetail[] = [
  {
    icon: ListChecks,
    title: 'Application Tracking',
    summary:
      'Every job you apply to, tracked in one place instead of a scattered spreadsheet — company, role, referral, recruiter, and every detail in between.',
    points: [
      'Log company, job title, location, job posting URL, source (LinkedIn, referral, company site, career fair, etc.), and the exact date applied.',
      'Two views: a sortable, searchable table, or a kanban board grouped by pipeline stage.',
      'Filter by status or search by company/role instantly.',
      "Track referrals in detail — referrer name, relationship, contact info, referral date, and notes — so you can see exactly how much referrals move the needle.",
      'Log recruiter name and contact info per application.',
      'Set a priority level (Low, Medium, High) on every application so you know where to focus.',
      'Edit, change status, or delete any application at any time — every change saves to your account.',
      'Attach a full job description and free-form notes for later reference, e.g. before an interview.',
    ],
  },
  {
    icon: FileStack,
    title: 'Resume Vault',
    summary:
      'Keep every version of your resume organized and ready to attach to any application.',
    points: [
      'Upload as many resume versions as you want — general, role-specific, or tailored per industry.',
      'Supports PDF, DOC, and DOCX, up to 5MB per file.',
      'Mark exactly one resume "active" at a time — that version is used across the rest of ApplyIQ.',
      'Download any uploaded resume back at any time, from any device.',
      'Delete an old version safely — if it was active, ApplyIQ automatically promotes your next most recent resume so you\'re never left without one.',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & Analytics',
    summary:
      'A single dashboard that turns your raw application history into a clear picture of how your search is actually going.',
    points: [
      'Total and active application counts, plus a breakdown of applications with vs. without a referral.',
      'Referral response rate and interview rate, calculated separately for referred vs. non-referred applications.',
      'Counts for interviews, offers, rejections, and applications that have gone quiet (ghosted).',
      'A follow-ups-needed heuristic that flags applications likely due for a nudge.',
      'Visual status breakdown across your whole pipeline.',
      'Weekly application activity trend, so you can see if your search is speeding up or slowing down.',
      'A dedicated analytics view adds response-rate-by-source breakdowns, so you know whether LinkedIn, referrals, or job boards are actually converting for you.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    summary: 'Your job search is personal — ApplyIQ keeps it private.',
    points: [
      'Every account is protected by JWT-based authentication and bcrypt-hashed passwords — your password is never stored in plain text.',
      'Data is fully isolated per account: there is no way for one user to view, edit, or even discover another user\'s applications or resumes.',
      'Sessions are stateless and short-lived by design, limiting the impact if a token were ever compromised.',
    ],
  },
];

const AI_FEATURES: FeatureDetail[] = [
  {
    icon: Target,
    title: 'Resume Match Score',
    summary: 'Know how well your resume fits a role before you spend time applying.',
    points: [
      'Paste in any job description and ApplyIQ compares it against your active resume.',
      'Get back a numeric match score plus the skills you already have that match the role.',
      'See the skills the posting asks for that your resume is missing.',
      'Surfaces experience gaps worth addressing before you apply or interview.',
      'Suggests specific resume bullet points tailored to the role, so you can tighten your resume before submitting.',
    ],
  },
  {
    icon: MessagesSquare,
    title: 'Interview Prep',
    summary: 'Walk into every interview knowing what to expect.',
    points: [
      'Generates a tailored set of likely technical and behavioral questions based on the specific role and your resume.',
      'Provides key talking points worth bringing up in the interview.',
      'Lists the skills worth reviewing beforehand, so your prep time goes to what actually matters for that interview.',
    ],
  },
  {
    icon: BellRing,
    title: 'Follow-Up Recommendations',
    summary: 'Never wonder whether it\'s time to check in on an application again.',
    points: [
      'Continuously watches every open application — days since you applied, days since your last contact, and current pipeline stage.',
      'Recommends a specific next action: send a first follow-up, send a final follow-up, keep waiting, or archive.',
      'Explains its reasoning in plain language every time, so you understand exactly why it\'s suggesting that action.',
    ],
  },
  {
    icon: Ghost,
    title: 'Ghosting Risk Prediction',
    summary: 'Stop spending energy chasing dead leads.',
    points: [
      'Every application is scored on how likely it is to have gone quiet for good.',
      'Helps you triage your job search and refocus your time on applications that are still genuinely active.',
    ],
  },
];

const PIPELINE_STAGES: { status: ApplicationStatus; description: string }[] = [
  { status: 'Saved', description: "A job you've found and want to apply to later." },
  { status: 'Applied', description: "You've submitted your application." },
  { status: 'Online Assessment', description: "You're completing an OA or technical screen." },
  { status: 'Interviewing', description: "You're in the interview process." },
  { status: 'Final Round', description: "You've reached the last round of interviews." },
  { status: 'Offer', description: "You've received an offer." },
  { status: 'Rejected', description: 'The company passed.' },
  { status: 'Ghosted', description: 'No response for an extended period.' },
  { status: 'Withdrawn', description: 'You pulled your application.' },
];

function FeatureDetailBlock({ feature }: { feature: FeatureDetail }) {
  return (
    <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <feature.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-1 text-sm text-white/60">{feature.summary}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {feature.points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function FeaturesPage() {
  return (
    <div className="min-h-svh bg-black">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            Features
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Everything ApplyIQ does, in detail
          </h1>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            A full breakdown of every feature ApplyIQ offers — what it does, how it works, and
            exactly what you get.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-16">
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-white/40 uppercase">
              Core tracking
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {CORE_FEATURES.map((feature) => (
                <FeatureDetailBlock key={feature.title} feature={feature} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-widest text-white/40 uppercase">
              AI-powered
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {AI_FEATURES.map((feature) => (
                <FeatureDetailBlock key={feature.title} feature={feature} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-widest text-white/40 uppercase">
              The pipeline, stage by stage
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Every application moves through one of nine stages, so you always know exactly
              where things stand.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.status}
                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="sm:w-44 sm:shrink-0">
                    <StatusBadge status={stage.status} />
                  </div>
                  <p className="text-sm text-white/60">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
