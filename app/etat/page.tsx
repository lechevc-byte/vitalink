"use client";

import AuthLayout from "@/components/AuthLayout";
import EtatView from "@/components/EtatView";

export default function EtatPage() {
  return (
    <AuthLayout requiredRole="operateur_etat">
      {() => <EtatView />}
    </AuthLayout>
  );
}
