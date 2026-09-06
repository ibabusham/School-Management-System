"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { FieldCard } from "@/components/dashboard/field-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type StudentProfile = {
  student: {
    id: string;
    studentId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function StudentProfilePage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [profile, setProfile] = useState<StudentProfile["student"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void apiRequest<StudentProfile>(`/api/students/${user.id}`)
      .then((data) => setProfile(data.student))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
      });
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student Portal"
        title="My Profile"
        description="Your student account details."
      />

      {error ? <Alert>{error}</Alert> : null}

      <Card className="p-6">
        {profile ? (
          <dl className="grid gap-6 sm:grid-cols-2">
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Student ID
              </dt>
              <dd className="mt-2 text-sm font-medium text-white">
                {profile.studentId}
              </dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Email
              </dt>
              <dd className="mt-2 text-sm text-white">{profile.email}</dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                First name
              </dt>
              <dd className="mt-2 text-sm text-white">{profile.firstName}</dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Last name
              </dt>
              <dd className="mt-2 text-sm text-white">{profile.lastName}</dd>
            </FieldCard>
          </dl>
        ) : (
          <p className="text-sm text-sidebar-muted">Loading profile...</p>
        )}
      </Card>
    </div>
  );
}
