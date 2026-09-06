/**
 * Reset password form (public) — same two-panel layout as login.
 *
 * Reads the reset token from the URL query (?token=...).
 * Submits new password to POST /api/auth/resetPassword.
 */
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/client";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Invalid reset link.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(token, newPassword);
      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Account recovery"
      title="Reset password"
      description="Choose a new password for your account."
    >
      {!token ? (
        <Alert>Invalid or missing reset token.</Alert>
      ) : success ? (
        <div className="space-y-5">
          <Alert variant="info">{success}</Alert>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-base font-medium text-white shadow-sm shadow-primary/20 hover:bg-primary-hover"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              required
              className="mt-1.5"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              className="mt-1.5"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <Button
            type="submit"
            className="mt-2 h-11 w-full text-base shadow-sm shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      )}

      {!success ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </AuthSplitLayout>
  );
}
