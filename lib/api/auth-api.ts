import { apiRequest, getSession, setSession } from "@/lib/api/client";
import type { AuthSession } from "@/lib/auth/types";

export async function loginRequest(username: string, password: string) {
  const session = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { username, password },
  });

  setSession(session);
  return session;
}

export async function logoutRequest() {
  const current = getSession();

  if (current?.refreshToken) {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        auth: false,
        body: { refreshToken: current.refreshToken },
      });
    } catch {
      // ignore logout errors locally
    }
  }

  setSession(null);
}
