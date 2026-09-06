/**
 * App-wide React context providers.
 *
 * Wraps the entire app (in app/layout.tsx) so every page can access
 * shared state like authentication via useAuth().
 */
"use client";

import { AuthProvider } from "@/lib/auth/auth-context";

/** Root provider component — add more providers here as the app grows. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
