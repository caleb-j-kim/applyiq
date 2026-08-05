import { Link } from 'react-router';
import {
  ListChecks,
  Target,
  MessagesSquare,
  BellRing,
  Ghost,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const FEATURES: Feature[] = [
  {
    icon: ListChecks,
    title: 'Application Tracking',
    description:
      'Log every job you apply to in one place — company, status, referral, recruiter contact, and notes — instead of a scattered spreadsheet.',
    href: '/applications',
  },
  {
    icon: Target,
    title: 'Resume Match Score',
    description:
      'Paste a job description and get a match score, matched and missing skills, and suggested resume bullets tailored to that role.',
    href: '/resume-match',
  },
  {
    icon: MessagesSquare,
    title: 'Interview Prep',
    description:
      'Get likely technical and behavioral questions, talking points, and skills to review, generated from the role and your resume.',
    href: '/interview-prep',
  },
  {
    icon: BellRing,
    title: 'Follow-Up Recommendations',
    description:
      'ApplyIQ watches days since applied and last contact, then tells you when to send a follow-up and what to say.',
    href: '/follow-ups',
  },
  {
    icon: Ghost,
    title: 'Ghosting Risk Prediction',
    description:
      'A model scores every application on how likely it is to go quiet, so you know when to move on and focus elsewhere.',
    href: '/follow-ups',
  },
];

export function Features() {
  return (
    <section id="features" className="relative bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            Why ApplyIQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to manage your job search
          </h2>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            ApplyIQ is an AI-powered dashboard for job seekers — track applications, score your
            resume against real postings, prep for interviews, and know when to follow up.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link key={feature.title} to={feature.href} className="block">
              <Card className="h-full border-white/10 bg-white/[0.03] backdrop-blur transition-colors hover:border-sky-400/40 hover:bg-white/[0.06]">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
