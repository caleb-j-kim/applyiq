import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, uploadResume } from '@/lib/api-client';
import type { ResumeResponseDto } from '@/lib/mappers';

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

const resumeLabel = (r: ResumeResponseDto) => `${r.fileName}${r.active ? ' (Active)' : ''}`;

// The "Resume" card shared by Resume Match and Interview Prep: pick a resume or upload one.
export function useResumePicker(description: string) {
  const [resumes, setResumes] = useState<ResumeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const data = await apiFetch<ResumeResponseDto[]>('/resumes');
      setResumes(data);
      setSelectedId((prev) => (prev && data.some((r) => r.id === prev) ? prev : data.find((r) => r.active)?.id ?? data[0]?.id ?? ''));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_RESUME_TYPES.has(file.type)) {
      toast.error('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      toast.error('File exceeds the maximum allowed size of 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadResume<ResumeResponseDto>(file);
      toast.success('Resume uploaded');
      await fetchResumes();
      // Uploading here means "use this one," not just "add this to my library."
      setSelectedId(uploaded.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const picker = (
    <Card>
      <CardHeader className="items-center text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Resume</h2>
        <p className="text-sm text-slate-500 dark:text-white/50">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Select
          value={selectedId}
          onValueChange={(v) => setSelectedId(v ?? '')}
          disabled={loading || resumes.length === 0}
          items={resumes.map((r) => ({ value: r.id, label: resumeLabel(r) }))}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder={loading ? 'Loading resumes...' : 'Select a resume'} />
          </SelectTrigger>
          <SelectContent>
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {resumeLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!loading && resumes.length === 0 && (
          <p className="text-center text-sm text-slate-400 dark:text-white/40">
            No resumes uploaded yet — upload one below to get started.
          </p>
        )}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelected} />
        <Button
          variant="outline"
          className="w-fit gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </Button>
      </CardContent>
    </Card>
  );

  return { selectedResume: resumes.find((r) => r.id === selectedId), picker };
}
