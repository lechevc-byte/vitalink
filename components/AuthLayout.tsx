"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import Topbar from "./Topbar";

interface Profile {
  id: string;
  role: string;
  nom: string;
  prenom: string;
  numero_rpps?: string | null;
}

export default function AuthLayout({
  children,
  requiredRole,
  fullWidth = false,
}: {
  children: (profile: Profile) => React.ReactNode;
  requiredRole: string;
  fullWidth?: boolean;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data || data.role !== requiredRole) {
        router.push("/login");
        return;
      }

      setProfile({ ...data, id: user.id });
      setLoading(false);
    };

    load();
  }, []);

  if (loading || !profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
        }}
      >
        Chargement…
      </div>
    );
  }

  return (
    <>
      <Topbar profile={profile} />
      <main style={fullWidth ? {} : { padding: "28px 32px", maxWidth: 1320, margin: "0 auto" }}>
        {children(profile)}
      </main>
    </>
  );
}
