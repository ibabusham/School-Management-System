"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath, useAuth } from "@/lib/auth/auth-context";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      router.replace(getRoleHomePath(user.role));
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}
