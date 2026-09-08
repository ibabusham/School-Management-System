/**
 * Forgot password page (public) — same two-panel layout as login.
 *
 * Submits email to POST /api/auth/forgotPassword.
 * Always shows the generic response message (never reveals if email exists).
 * In dev, the API may return a reset token — we surface it as a link.
 */
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/client";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setResetToken(null);
    setIsSubmitting(true);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      toast.success(result.message);
      if (result.token) {
        setResetToken(result.token);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to send reset link."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Account recovery"
      title="Forgot password"
      description="Enter your account email and we'll send a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            className="mt-1.5"
            placeholder="you@school.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert variant="info">{message}</Alert> : null}

        {resetToken ? (
          <Alert variant="info">
            Dev mode:{" "}
            <Link
              href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="font-medium underline"
            >
              Open reset link
            </Link>
          </Alert>
        ) : null}

        <Button
          type="submit"
          className="mt-2 h-11 w-full text-base shadow-sm shadow-primary/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
