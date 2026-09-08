/**
 * App-wide React context providers.
 *
 * Wraps the entire app (in app/layout.tsx) so every page can access
 * shared state like authentication via useAuth().
 */
"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

/** Root provider component — add more providers here as the app grows. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConfirmProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "font-bold",
            },
          }}
        />
      </ConfirmProvider>
    </AuthProvider>
  );
}
