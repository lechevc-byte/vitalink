"use client";

import AuthLayout from "@/components/AuthLayout";
import MedecinView from "@/components/MedecinView";

export default function MedecinPage() {
  return (
    <AuthLayout requiredRole="medecin">
      {(profile) => <MedecinView profile={profile} />}
    </AuthLayout>
  );
}
