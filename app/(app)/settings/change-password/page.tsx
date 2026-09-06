/**
 * Change password — nested under Settings (/settings/change-password).
 *
 * Validates: new password min 8 chars, differs from old, matches confirm.
 * On success: logs the user out so they re-authenticate.
 */
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { FormField } from "@/components/admin/form-field";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePasswordPage() {
  useRequireAuth(["ADMIN", "TEACHER", "STUDENT"]);
  const { logout } = useAuth();
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      setError("New password must be different from old password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(oldPassword, newPassword);
      setSuccess(result.message);
      setTimeout(() => {
        void logout().then(() => router.replace("/login"));
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to change password."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Change Password"
        description="Update your account password."
      />

      {error ? <Alert>{error}</Alert> : null}
      {success ? <Alert variant="info">{success}</Alert> : null}

      <DashboardSection
        title="New password"
        description="Choose a new password, then sign in again."
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-md flex-col items-center space-y-4 text-center font-extrabold text-white [&_label]:text-center [&_label]:font-extrabold [&_label]:text-white"
        >
          <FormField
            label="Old password"
            htmlFor="oldPassword"
            className="w-full"
          >
            <Input
              id="oldPassword"
              type="password"
              required
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              className="text-center font-bold text-white"
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="newPassword"
            className="w-full"
          >
            <Input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="text-center font-bold text-white"
            />
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="confirmPassword"
            className="w-full"
          >
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="text-center font-bold text-white"
            />
          </FormField>

          <div className="flex w-full justify-center pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Changing..." : "Change password"}
            </Button>
          </div>
        </form>
      </DashboardSection>
    </div>
  );
}
