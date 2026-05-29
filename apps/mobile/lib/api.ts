import { supabase } from './supabase.js';
import { useUIStore } from '../stores/uiStore.js';

const API_BASE = process.env['EXPO_PUBLIC_API_URL'] ?? '';

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!response.ok) {
    let error: ApiError;
    try {
      error = (await response.json()) as ApiError;
    } catch {
      error = { error: 'request_failed', message: `HTTP ${response.status}` };
    }
    if (response.status === 429) {
      useUIStore.getState().openUpgradeSheet();
    }
    throw Object.assign(new Error(error.message), { apiError: error });
  }
  return response.json() as Promise<T>;
}

// Generate a chapter (returns an async iterator of SSE events)
export async function* generateChapter(
  body: {
    arcId: string;
    chapterNumber: number;
    spiceLevelOverride?: number;
    userCreativeDirection?: string;
  },
  signal?: AbortSignal,
): AsyncGenerator<
  | { type: 'token'; content: string }
  | { type: 'complete'; chapterId: string; title: string }
  | { type: 'error'; message: string }
> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) {
    const error = (await response.json()) as ApiError;
    throw Object.assign(new Error(error.message), { apiError: error });
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as
            | { type: 'token'; content: string }
            | { type: 'complete'; chapterId: string; title: string }
            | { type: 'error'; message: string };
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}

export async function getArcs() {
  return apiFetch<{ id: string; title: string | null; creature_type: string }[]>('/api/arcs');
}

export async function createArc(body: Record<string, unknown>) {
  return apiFetch('/api/arcs', { method: 'POST', body: JSON.stringify(body) });
}

export async function getChapters(arcId: string) {
  return apiFetch<unknown[]>(`/api/arcs/${arcId}/chapters`);
}
