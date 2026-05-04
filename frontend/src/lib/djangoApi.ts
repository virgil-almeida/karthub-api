import { DJANGO_API_URL } from "@/config/apiConfig";

// ─── Token storage ────────────────────────────────────────────────────────────
// Chaves distintas das do Supabase para não colidir

const ACCESS_KEY = "karthub_django_access";
const REFRESH_KEY = "karthub_django_refresh";

export interface DjangoTokenPair {
  access: string;
  refresh: string;
}

export function setDjangoTokens(tokens: DjangoTokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearDjangoTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getDjangoAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getDjangoRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

// ─── Erro tipado ──────────────────────────────────────────────────────────────

export class DjangoApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "DjangoApiError";
  }
}

// ─── Refresh automático ───────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Garante que múltiplas chamadas simultâneas só façam um refresh
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getDjangoRefreshToken();
    if (!refresh) throw new DjangoApiError(401, "Sessão expirada. Faça login novamente.");

    const res = await fetch(`${DJANGO_API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearDjangoTokens();
      throw new DjangoApiError(401, "Sessão expirada. Faça login novamente.");
    }

    const data = await res.json();
    setDjangoTokens({ access: data.access, refresh: data.refresh ?? refresh });
    return data.access as string;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─── Cliente principal ────────────────────────────────────────────────────────

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Quando true, envia body como FormData (multipart) sem Content-Type manual */
  multipart?: boolean;
};

export async function djangoFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, multipart, headers: extraHeaders, ...rest } = options;

  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (!multipart && body !== undefined && !(body instanceof FormData)) {
      h["Content-Type"] = "application/json";
    }
    return { ...h, ...(extraHeaders as Record<string, string> | undefined) };
  };

  const buildBody = (): BodyInit | undefined => {
    if (body === undefined) return undefined;
    if (body instanceof FormData) return body;
    if (multipart) return body as FormData;
    return JSON.stringify(body);
  };

  const doFetch = async (token: string | null): Promise<Response> =>
    fetch(`${DJANGO_API_URL}${path}`, {
      ...rest,
      headers: buildHeaders(token),
      body: buildBody(),
    });

  let token = getDjangoAccessToken();
  let res = await doFetch(token);

  // Tenta refresh automático em 401
  if (res.status === 401 && getDjangoRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      throw new DjangoApiError(401, "Sessão expirada. Faça login novamente.");
    }
  }

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { detail: res.statusText };
    }
    const message =
      typeof errorBody === "object" && errorBody !== null && "detail" in errorBody
        ? String((errorBody as { detail: unknown }).detail)
        : `Erro ${res.status}`;
    throw new DjangoApiError(res.status, message, errorBody);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Helpers por método HTTP ──────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string) => djangoFetch<T>(path, { method: "GET" }),

  post: <T = unknown>(path: string, body: unknown) =>
    djangoFetch<T>(path, { method: "POST", body }),

  patch: <T = unknown>(path: string, body: unknown) =>
    djangoFetch<T>(path, { method: "PATCH", body }),

  delete: (path: string) => djangoFetch(path, { method: "DELETE" }),

  upload: <T = unknown>(path: string, formData: FormData) =>
    djangoFetch<T>(path, { method: "POST", body: formData, multipart: true }),
};
