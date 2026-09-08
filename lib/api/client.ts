import { clearSession, loadSession, saveSession } from "@/lib/auth/auth-storage";
import type { AuthSession } from "@/lib/auth/types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

let memorySession: AuthSession | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export function getSession(): AuthSession | null {
  if (memorySession) {
    return memorySession;
  }

  memorySession = loadSession();
  return memorySession;
}

export function setSession(session: AuthSession | null) {
  memorySession = session;

  if (session) {
    saveSession(session);
  } else {
    clearSession();
  }
}

async function refreshSession(): Promise<AuthSession | null> {
  const current = getSession();
  if (!current?.refreshToken) {
    return null;
  }

  const response = await fetch("/api/auth/refreshToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });

  if (!response.ok) {
    setSession(null);
    return null;
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const nextSession: AuthSession = {
    ...current,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };

  setSession(nextSession);
  return nextSession;
}

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers, ...init } = options;

  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const session = getSession();
    if (session?.accessToken) {
      requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  const execute = () =>
    fetch(path, {
      ...init,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await execute();

  if (auth && response.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshSession().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed?.accessToken) {
      requestHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await execute();
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
