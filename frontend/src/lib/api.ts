/**
 * Lightweight authenticated API client.
 * All requests go through the NestJS backend — the frontend never
 * touches the Supabase database directly.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'school_portal_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Example fetch setup in src/api/api.ts
export const fetchHomeroomAssignments = async (academicYearId?: string) => {
  const timestamp = Date.now();
  const token = getToken();
  const response = await fetch(`${BASE_URL}/teacher-assignments/homeroom?academicYearId=${academicYearId || ''}&_t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  });
  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return response.json();
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const isFormData = body instanceof FormData;
  
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new ApiError(res.status, msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
