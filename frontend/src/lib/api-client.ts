const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080/api';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ApiEnvelope<unknown>>;
    if (body?.message) return body.message;
  } catch {
    // response body wasn't JSON (e.g. Spring Security's default 401/403 page) — fall through
  }
  return `Request failed with status ${response.status}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!envelope.success) {
    throw new Error(envelope.message ?? 'Request failed');
  }
  return envelope.data;
}

export async function uploadResume(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}/resumes`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const envelope = (await response.json()) as ApiEnvelope<unknown>;
  if (!envelope.success) {
    throw new Error(envelope.message ?? 'Upload failed');
  }
  return envelope.data;
}

export async function downloadResume(id: string, fallbackFileName: string): Promise<void> {
  const headers = new Headers();
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}/resumes/${id}/download`, { headers });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const fileName = match?.[1] ?? fallbackFileName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
