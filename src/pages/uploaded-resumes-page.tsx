import { useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mockResumes } from '@/data/mock-data';
import type { Resume } from '@/types';

export function UploadedResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);

  const setActive = (id: string) => {
    setResumes((prev) => prev.map((r) => ({ ...r, isActive: r.id === id })));
  };

  const remove = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Uploaded Resumes"
        description="Manage the resumes ApplyIQ uses for match scoring and interview prep."
        actions={
          <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400">
            <Upload className="h-4 w-4" />
            Upload resume
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        {resumes.map((resume) => (
          <Card key={resume.id} className="border-white/10 bg-white/[0.03] backdrop-blur">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{resume.fileName}</span>
                    {resume.isActive && <Badge className="bg-sky-500/10 text-sky-300">Active</Badge>}
                  </div>
                  <div className="text-xs text-white/40">
                    Uploaded {resume.uploadedAt} · {resume.sizeKb} KB
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!resume.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white/70 hover:bg-white/10"
                    onClick={() => setActive(resume.id)}
                  >
                    Set active
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => remove(resume.id)}
                  aria-label={`Delete ${resume.fileName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {resumes.length === 0 && (
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
            <CardContent className="py-12 text-center text-sm text-white/40">
              No resumes uploaded yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
