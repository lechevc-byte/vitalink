"use client";

import AuthLayout from "@/components/AuthLayout";
import PatientView from "@/components/PatientView";

export default function PatientPage() {
  return (
    <AuthLayout requiredRole="patient">
      {(profile) => <PatientView profile={profile} />}
    </AuthLayout>
  );
}
