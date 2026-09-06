"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoleHomePath, useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
      {children}
    </span>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await login(username, password);
      const next = searchParams.get("next");
      router.replace(next ?? getRoleHomePath(session.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Welcome back"
      title="Sign in"
      description="Enter your school credentials to access your dashboard."
    >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-1.5">
                <FieldIcon>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 18a7 7 0 1 1 14 0H3Z" />
                  </svg>
                </FieldIcon>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="e.g. admin"
                  className="pl-10"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <FieldIcon>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 0 0-6 0V9h6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </FieldIcon>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pr-10 pl-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.5 1.5 0 0 0 0-1.39 10.028 10.028 0 0 0-3.3-4.38 1.5 1.5 0 0 0-1.39 0 10.028 10.028 0 0 0-3.2 4.38 1.5 1.5 0 0 0 0 1.39 10.028 10.028 0 0 0 3.3 4.38 1.5 1.5 0 0 0 1.39 0 10.028 10.028 0 0 0 3.2-4.38 1.5 1.5 0 0 0 0-1.39 10.028 10.028 0 0 0-3.3-4.38 1.5 1.5 0 0 0-1.39 0 10.028 10.028 0 0 0-3.2 4.38 1.5 1.5 0 0 0 0 1.39 10.028 10.028 0 0 0 3.3 4.38l-1.72-1.72ZM10 12.25a2.25 2.25 0 0 1-2.122-1.5H10a.75.75 0 0 0 0-1.5H7.878A2.25 2.25 0 0 1 10 7.75c.966 0 1.79.613 2.098 1.47a.75.75 0 0 0 1.444-.39A3.75 3.75 0 0 0 10 6.25 3.75 3.75 0 0 0 6.25 10c0 .966.368 1.845.97 2.5H4.5a.75.75 0 0 0 0 1.5h3.47A3.75 3.75 0 0 0 10 13.75c.966 0 1.845-.368 2.5-.97V15.5a.75.75 0 0 0 1.5 0v-3.47c.602-.655.97-1.534.97-2.5a3.75 3.75 0 0 0-3.75-3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M10 12.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5Z" />
                      <path
                        fillRule="evenodd"
                        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error ? <Alert>{error}</Alert> : null}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full text-base shadow-sm shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-10 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Development access
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Admin</dt>
                <dd className="font-mono text-foreground-secondary">admin</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Teacher</dt>
                <dd className="font-mono text-foreground-secondary">teacher1</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-mono text-foreground-secondary">student1</dd>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Password</dt>
                  <dd className="font-mono text-foreground-secondary">
                    Password123!
                  </dd>
                </div>
              </div>
            </dl>
          </div>
    </AuthSplitLayout>
  );
}
