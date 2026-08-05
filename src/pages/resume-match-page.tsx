import { useState, type FormEvent } from 'react';
import { CheckCircle2, Sparkles, TriangleAlert, Upload, XCircle } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockResumeMatchResult, mockResumes } from '@/data/mock-data';

export function ResumeMatchPage() {
  const [resumeId, setResumeId] = useState(mockResumes.find((r) => r.isActive)?.id ?? mockResumes[0]?.id);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof mockResumeMatchResult | null>(null);

  const handleAnalyze = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(mockResumeMatchResult);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resume Match Score"
        description="See how well your resume matches a job description before you apply."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur lg:col-span-2">
          <CardHeader>
            <h2 className="text-base font-semibold text-white">Compare resume to job</h2>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleAnalyze}>
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
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1 gap-2 border-white/15 bg-transparent text-white/70 hover:bg-white/10"
                >
                  <Upload className="h-4 w-4" />
                  Upload a new resume
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jobTitle">Job title (optional)</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="border-white/15 bg-black/30 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName">Company (optional)</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="border-white/15 bg-black/30 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jobDescription">Job description</Label>
                <Textarea
                  id="jobDescription"
                  required
                  rows={10}
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>

              <Button type="submit" disabled={loading} className="gap-2 bg-sky-500 text-white hover:bg-sky-400">
                <Sparkles className="h-4 w-4" />
                {loading ? 'Analyzing…' : 'Analyze match'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-3">
          {!result && !loading && (
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <Sparkles className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">
                  Paste a job description and analyze to see your match score.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <Sparkles className="h-8 w-8 animate-pulse text-sky-400" />
                <p className="text-sm text-white/50">Comparing your resume against the job description…</p>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/70">Overall match score</span>
                    <span className="text-3xl font-bold text-sky-400">{result.matchScore}%</span>
                  </div>
                  <Progress value={result.matchScore} className="mt-3">
                    <ProgressLabel className="sr-only">Match score</ProgressLabel>
                    <ProgressValue className="sr-only" />
                  </Progress>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Matched skills</h3>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {result.matchedSkills.map((skill) => (
                      <Badge key={skill} className="bg-emerald-500/10 text-emerald-300">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <h3 className="text-sm font-semibold text-white">Missing skills</h3>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <Badge key={skill} className="bg-rose-500/10 text-rose-300">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                <CardHeader className="flex flex-row items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Experience gaps</h3>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/60">
                    {result.experienceGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">Suggested resume bullets</h3>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-white/60">
                    {result.suggestedBullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
