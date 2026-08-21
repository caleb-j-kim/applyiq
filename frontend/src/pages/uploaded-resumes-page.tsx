import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch, downloadResume, uploadResume } from '@/lib/api-client';
import { mapResumeResponse, type ResumeResponseDto } from '@/lib/mappers';
import type { Resume } from '@/types';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function UploadedResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const data = await apiFetch<ResumeResponseDto[]>('/resumes');
      setResumes(data.map(mapResumeResponse));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File exceeds the maximum allowed size of 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadResume(file);
      toast.success('Resume uploaded');
      await fetchResumes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const setActive = async (id: string) => {
    try {
      await apiFetch(`/resumes/${id}/active`, { method: 'PATCH' });
      await fetchResumes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set active resume');
    }
  };

  const remove = async (resume: Resume) => {
    if (!window.confirm(`Delete ${resume.fileName}? This can't be undone.`)) return;
    try {
      await apiFetch(`/resumes/${resume.id}`, { method: 'DELETE' });
      toast.success('Resume deleted');
      await fetchResumes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete resume');
    }
  };

  const download = async (resume: Resume) => {
    try {
      await downloadResume(resume.id, resume.fileName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed');
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Uploaded Resumes"
        description="Manage the resumes ApplyIQ uses for match scoring and interview prep."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              className="gap-2 bg-sky-500 text-white hover:bg-sky-400"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload resume'}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        {isLoading && (
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
            <CardContent className="py-12 text-center text-sm text-white/40">Loading resumes...</CardContent>
          </Card>
        )}
        {!isLoading &&
          resumes.map((resume) => (
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
                    className="text-white/50 hover:bg-white/10 hover:text-white"
                    onClick={() => download(resume)}
                    aria-label={`Download ${resume.fileName}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
                    onClick={() => remove(resume)}
                    aria-label={`Delete ${resume.fileName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        {!isLoading && resumes.length === 0 && (
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
