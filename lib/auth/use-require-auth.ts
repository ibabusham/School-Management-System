"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath, useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/auth/types";

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [user, isLoading, allowedRoles, router]);

  return { user, isLoading };
}
