import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-form";

function ResetFallback() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[58%] shrink-0 bg-charcoal lg:block" />
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-border" />
            <div className="h-8 w-40 animate-pulse rounded-lg bg-border" />
            <div className="h-4 w-64 animate-pulse rounded bg-border" />
          </div>
          <div className="space-y-4">
            <div className="h-10 animate-pulse rounded-lg bg-border" />
            <div className="h-10 animate-pulse rounded-lg bg-border" />
            <div className="h-11 animate-pulse rounded-lg bg-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
