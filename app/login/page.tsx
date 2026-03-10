"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C, s, btn } from "@/lib/design";
import { createClient } from "@/lib/supabase-client";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Get role to redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const roleRoutes: Record<string, string> = {
      medecin: "/medecin",
      patient: "/patient",
      operateur_etat: "/etat",
      mutuelle: "/mutuelle",
    };

    router.push(roleRoutes[profile?.role] || "/");
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
            }}
          >
            <Icon name="heart" size={26} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
            Vita<span style={{ color: C.blueLight }}>Link</span>
          </h1>
          <p style={s.muted}>Dossier médical numérique souverain</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div style={{ ...s.card, marginBottom: 16 }}>
            <p style={{ ...s.h3, marginBottom: 20, textAlign: "center" }}>Connexion sécurisée</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ ...s.label, display: "block", marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: C.text,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ ...s.label, display: "block", marginBottom: 6 }}>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: C.text,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background: C.redDim,
                  borderRadius: 8,
                  fontSize: 13,
                  color: C.redLight,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btn("primary"),
              width: "100%",
              justifyContent: "center",
              padding: "13px",
              fontSize: 15,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            padding: "12px 16px",
            background: C.blueDim,
            borderRadius: 10,
            border: "1px solid rgba(59,130,246,0.2)",
            fontSize: 12,
            color: C.textMuted,
            textAlign: "center",
          }}
        >
          Connexion sécurisée · Données chiffrées AES-256 · Conforme RGPD & HDS
        </div>
      </div>
    </div>
  );
}
