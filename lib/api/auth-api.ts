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
      //nothing to do here
    }
  }

  setSession(null);
}
export async function changePassword(oldPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>("/api/auth/changePassword", {
    method: "POST",
    auth: true,
    body: { oldPassword, newPassword },
  });
}
export async function forgotPassword(email: string) {
  return apiRequest<{ message: string; token?: string }>("/api/auth/forgotPassword", {
    method: "POST",
    auth: false,
    body: { email },
  });
}
export async function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ message: string }>("/api/auth/resetPassword", {
    method: "POST",
    auth: false,
    body: { token, newPassword },
  });
}