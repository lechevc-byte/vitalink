"use client";

import AuthLayout from "@/components/AuthLayout";
import MutuelleView from "@/components/MutuelleView";

export default function MutuellePage() {
  return (
    <AuthLayout requiredRole="mutuelle">
      {() => <MutuelleView />}
    </AuthLayout>
  );
}
