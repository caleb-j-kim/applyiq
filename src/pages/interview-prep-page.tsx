import { useState, type FormEvent } from 'react';
import { BookOpen, Lightbulb, MessagesSquare, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockApplications, mockInterviewPrepResult, mockResumes } from '@/data/mock-data';
import type { InterviewType } from '@/types';

const INTERVIEW_TYPES: InterviewType[] = ['Technical', 'Behavioral', 'System Design', 'Full-Stack', 'AI/ML'];

export function InterviewPrepPage() {
  const [applicationId, setApplicationId] = useState(mockApplications[0]?.id);
  const [resumeId, setResumeId] = useState(mockResumes.find((r) => r.isActive)?.id ?? mockResumes[0]?.id);
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof mockInterviewPrepResult | null>(null);

  const selectedApplication = mockApplications.find((a) => a.id === applicationId);

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(mockInterviewPrepResult);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Interview Prep"
        description="Generate personalized prep material for an upcoming interview."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur lg:col-span-2">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Prep settings</h2>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleGenerate}>
              <div className="flex flex-col gap-1.5">
                <Label>Job application</Label>
                <Select value={applicationId} onValueChange={(v) => v && setApplicationId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => {
                        const app = mockApplications.find((a) => a.id === value);
                        return app ? `${app.jobTitle} · ${app.companyName}` : 'Select an application';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mockApplications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.jobTitle} · {app.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Resume</Label>
                <Select value={resumeId} onValueChange={(v) => v && setResumeId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => mockResumes.find((r) => r.id === value)?.fileName ?? 'Select a resume'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {mockResumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Interview type</Label>
                <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedApplication && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/50">
                  Prepping for <span className="text-white/80">{selectedApplication.jobTitle}</span> at{' '}
                  <span className="text-white/80">{selectedApplication.companyName}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="gap-2 bg-sky-500 text-white hover:bg-sky-400">
                <Sparkles className="h-4 w-4" />
                {loading ? 'Generating…' : 'Generate prep material'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-3">
          {!result && !loading && (
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <MessagesSquare className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">
                  Pick a job application and generate to see prep material.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Sparkles className="h-8 w-8 animate-pulse text-sky-400" />
                <p className="text-sm text-white/50">Building your prep material…</p>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                <CardHeader className="flex flex-row items-center gap-2">
                  <MessagesSquare className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">Technical questions</h3>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-white/60">
                    {result.technicalQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                <CardHeader className="flex flex-row items-center gap-2">
                  <MessagesSquare className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">Behavioral questions</h3>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-white/60">
                    {result.behavioralQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Skills to review</h3>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {result.skillsToReview.map((skill) => (
                      <Badge key={skill} className="bg-amber-500/10 text-amber-300">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">Project talking points</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/60">
                      {result.talkingPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
