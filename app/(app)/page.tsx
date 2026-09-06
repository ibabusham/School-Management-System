"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHomePath, useAuth } from "@/lib/auth/auth-context";

export default function AppHomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [user, isLoading, router]);

  return null;
}
