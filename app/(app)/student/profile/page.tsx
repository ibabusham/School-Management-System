/**
 * Student profile — personal, account, and enrollment details for the signed-in student.
 */
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { fetchStudent, type StudentDetail } from "@/lib/api/students";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { FieldCard } from "@/components/dashboard/field-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";

function formatGender(gender: StudentDetail["gender"]) {
  return gender === "MALE" ? "Male" : "Female";
}

function formatPhone(phone: string | null) {
  const trimmed = phone?.trim();
  return trimmed ? trimmed : "—";
}

export default function StudentProfilePage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const { data: profile, error } = useQuery({
    queryKey: ["student", user?.id],
    queryFn: () => fetchStudent(user!.id),
    enabled: !!user,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Student Portal"
        title="My Profile"
        description="Your student account and enrollment details."
        breadcrumbs={[
          { label: "Dashboard", href: "/student" },
          { label: "My Profile" },
        ]}
      />

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load profile."}
        </Alert>
      ) : null}

      <Card className="p-8">
        {profile ? (
          <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                Username
              </dt>
              <dd className="mt-2 text-sm text-white">
                {profile.user?.username ?? "—"}
              </dd>
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
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Gender
              </dt>
              <dd className="mt-2 text-sm text-white">
                {formatGender(profile.gender)}
              </dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Date of birth
              </dt>
              <dd className="mt-2 text-sm text-white">
                {formatDate(profile.dateOfBirth)}
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
                Phone
              </dt>
              <dd className="mt-2 text-sm text-white">
                {formatPhone(profile.phoneNumber)}
              </dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Class
              </dt>
              <dd className="mt-2 text-sm text-white">
                {profile.class?.className ?? "Unassigned"}
              </dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Enrollment date
              </dt>
              <dd className="mt-2 text-sm text-white">
                {formatDate(profile.enrollmentDate)}
              </dd>
            </FieldCard>
            <FieldCard>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Account status
              </dt>
              <dd className="mt-2 text-sm text-white">
                {profile.accountStatus ? "Active" : "Inactive"}
              </dd>
            </FieldCard>
          </dl>
        ) : (
          <p className="text-sm text-sidebar-muted">Loading profile...</p>
        )}
      </Card>

      <div className="flex justify-center">
        <Link
          href="/student/learning-progress"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          View learning progress
        </Link>
      </div>
    </div>
  );
}
