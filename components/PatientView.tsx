"use client";

import { useState, useEffect } from "react";
import { C, s, tag, avatar } from "@/lib/design";
import { age, fmtDate } from "@/lib/helpers";
import { createClient } from "@/lib/supabase-client";
import Icon from "./Icon";

interface Profile {
  id: string;
  role: string;
  nom: string;
  prenom: string;
}

interface Patient {
  id: string;
  nss: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  groupe_sanguin: string | null;
  score_continuite: number;
  antecedents: { libelle: string; type: string }[];
  traitements: { medicament: string; dosage: string; frequence: string; depuis: string; actif: boolean }[];
  alertes: { type: string; msg: string }[];
}

interface Consultation {
  id: string;
  date_consultation: string;
  motif: string;
  type_consultation: string | null;
  signature_hash: string | null;
  medecin_nom?: string;
}

export default function PatientView({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [documents, setDocuments] = useState<{ id: string; nom: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: pat } = await supabase
      .from("patients")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (pat) {
      setPatient(pat);
      const [consultRes, docRes] = await Promise.all([
        supabase
          .from("consultations")
          .select("*, profiles:medecin_id(nom, prenom)")
          .eq("patient_id", pat.id)
          .order("date_consultation", { ascending: false }),
        supabase.from("documents").select("*").eq("patient_id", pat.id),
      ]);
      if (consultRes.data) {
        setConsultations(
          consultRes.data.map((c: Record<string, unknown>) => ({
            ...c,
            medecin_nom: (c.profiles as { nom?: string; prenom?: string } | null)
              ? `Dr. ${(c.profiles as { prenom: string }).prenom} ${(c.profiles as { nom: string }).nom}`
              : "Médecin",
          })) as Consultation[]
        );
      }
      if (docRes.data) setDocuments(docRes.data);
    }
  };

  if (!patient) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
        Chargement de votre dossier…
      </div>
    );
  }

  return (
    <div style={s.col}>
      <div
        style={{
          ...s.card,
          display: "flex",
          gap: 20,
          alignItems: "center",
          background: C.blueDim,
          borderColor: `${C.blue}33`,
        }}
      >
        <div style={avatar(64)}>
          {patient.prenom[0]}
          {patient.nom[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            Bonjour, {patient.prenom}
          </div>
          <div style={s.muted}>Dossier médical numérique · NSS {patient.nss}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            {patient.alertes?.map((a, i) => (
              <div
                key={i}
                style={{
                  ...s.row,
                  fontSize: 12,
                  color: a.type === "warning" ? C.amberLight : C.blueLight,
                  background: a.type === "warning" ? C.amberDim : C.blueDim,
                  padding: "5px 10px",
                  borderRadius: 7,
                  border: `1px solid ${a.type === "warning" ? C.amber + "33" : C.blue + "33"}`,
                }}
              >
                <Icon name="alert" size={12} />
                {a.msg}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {(
            [
              ["Consultations", consultations.length],
              ["Documents", documents.length],
              ["Traitements", patient.traitements?.length || 0],
            ] as [string, number][]
          ).map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={s.label}>{l}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.blueLight }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={s.card}>
          <div style={s.h3}>Traitements en cours</div>
          {patient.traitements?.map((t, i) => (
            <div key={i} style={{ ...s.row, marginBottom: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: C.blueDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.blueLight,
                  flexShrink: 0,
                }}
              >
                <Icon name="pill" size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {t.medicament} <span style={{ color: C.blueLight }}>{t.dosage}</span>
                </div>
                <div style={s.muted}>{t.frequence}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={s.h3}>Score de continuité de soin</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg width={80} height={80} viewBox="0 0 80 80">
                <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
                <circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke={C.green}
                  strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 34 * patient.score_continuite / 100} ${2 * Math.PI * 34}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.greenLight,
                }}
              >
                {patient.score_continuite}%
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
              Votre suivi médical est{" "}
              <strong style={{ color: C.greenLight }}>
                {patient.score_continuite >= 80 ? "excellent" : "à améliorer"}
              </strong>
              .<br />
              {patient.score_continuite >= 80
                ? "Toutes vos consultations sont à jour."
                : "Pensez à prendre vos rendez-vous de suivi."}
            </div>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.h3}>Mes dernières consultations</div>
        {consultations.slice(0, 4).map((c, i) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              background: i === 0 ? C.blueDim : C.surface,
              borderRadius: 10,
              marginBottom: 8,
              border: `1px solid ${i === 0 ? C.blue + "33" : C.border}`,
            }}
          >
            <div style={s.row}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: i === 0 ? C.blueDim : C.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.blueLight,
                }}
              >
                <Icon name="activity" size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.motif}</div>
                <div style={s.muted}>
                  {c.medecin_nom} · {fmtDate(c.date_consultation)}
                </div>
              </div>
            </div>
            <div style={s.row}>
              {c.signature_hash && <span style={tag("green")}>✓ Signé</span>}
              <span style={tag("blue")}>{c.type_consultation}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={s.h3}>Mes antécédents & allergies</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {patient.antecedents?.map((a, i) => (
            <span
              key={i}
              style={tag(a.type === "allergie" ? "red" : a.type === "maladie_chronique" ? "amber" : "gray")}
            >
              {a.libelle}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
