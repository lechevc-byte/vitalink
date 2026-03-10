"use client";

import { useRouter } from "next/navigation";
import { C, s, btn } from "@/lib/design";
import Icon from "./Icon";
import { createClient } from "@/lib/supabase-client";

interface Profile {
  role: string;
  nom: string;
  prenom: string;
  numero_rpps?: string | null;
}

export default function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const roleColors: Record<string, [string, string]> = {
    medecin: [C.greenDim, C.green],
    patient: [C.blueDim, C.blue],
    operateur_etat: [C.purpleDim, C.purple],
    mutuelle: [C.amberDim, C.amber],
  };
  const [bg, ac] = roleColors[profile.role] || roleColors.medecin;
  const roleLabels: Record<string, string> = {
    medecin: "Médecin",
    patient: "Patient",
    operateur_etat: "Opérateur État",
    mutuelle: "Mutuelle",
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      style={{
        background: "rgba(8,13,26,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={s.row}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="heart" size={16} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
          Vita<span style={{ color: C.blueLight }}>Link</span>
        </span>
        <div style={{ width: 1, height: 20, background: C.border, margin: "0 8px" }} />
        <span style={{ ...s.muted, fontSize: 12 }}>v1.0 MVP</span>
      </div>
      <div style={s.row}>
        <div
          style={{
            ...s.row,
            gap: 8,
            padding: "5px 12px",
            borderRadius: 8,
            background: bg,
            border: `1px solid ${ac}33`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: ac }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: ac }}>
            {roleLabels[profile.role]}
          </span>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            — {profile.prenom} {profile.nom}
          </span>
        </div>
        {profile.numero_rpps && (
          <span
            className="topbar-rpps"
            style={{
              fontSize: 11,
              color: C.textMuted,
              background: C.surface,
              border: `1px solid ${C.border}`,
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            RPPS {profile.numero_rpps}
          </span>
        )}
        <button onClick={handleLogout} style={{ ...btn("ghost"), padding: "6px 10px" }}>
          <Icon name="logout" size={16} />
        </button>
      </div>
    </div>
  );
}
