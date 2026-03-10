"use client";

import { useState, useEffect } from "react";
import { C, s, tag } from "@/lib/design";
import { createClient } from "@/lib/supabase-client";
import Icon from "./Icon";

// Données mockées (volontairement, comme prévu dans le brief)
const MOCK_REGIONS = [
  { nom: "Santiago", patients: 1820, consultations: 4200 },
  { nom: "Santo Antão", patients: 1102, consultations: 2800 },
  { nom: "São Vicente", patients: 890, consultations: 2100 },
  { nom: "Fogo", patients: 650, consultations: 1600 },
  { nom: "Sal", patients: 359, consultations: 1640 },
];

const MOCK_EVOLUTION = [
  { mois: "Juil", v: 9800 },
  { mois: "Août", v: 7200 },
  { mois: "Sept", v: 11200 },
  { mois: "Oct", v: 12800 },
  { mois: "Nov", v: 11900 },
  { mois: "Déc", v: 12340 },
];

export default function EtatView() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    patients_actifs: 0,
    consultations_total: 0,
    resumes_ia_generes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data } = await supabase.rpc("get_stats_etat").single();
    if (data) {
      setStats(data as { patients_actifs: number; consultations_total: number; resumes_ia_generes: number });
    }
  };

  const maxV = Math.max(...MOCK_EVOLUTION.map((e) => e.v));
  const maxR = Math.max(...MOCK_REGIONS.map((r) => r.consultations));

  return (
    <div style={s.col}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          Tableau de bord national — Cabo Verde
        </h1>
        <p style={s.muted}>
          Vue agrégée anonymisée · Ministério da Saúde — Cabo Verde · Mise à jour aujourd&apos;hui
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Patients actifs", value: stats.patients_actifs.toLocaleString(), icon: "user", color: "blue" },
          { label: "Consultations totales", value: stats.consultations_total.toLocaleString(), icon: "activity", color: "green" },
          { label: "Résumés IA générés", value: stats.resumes_ia_generes.toLocaleString(), icon: "sparkle", color: "purple" },
          { label: "Taux suivi chronique", value: "73%", icon: "heart", color: "amber" },
        ].map(({ label, value, icon, color }) => {
          const cm: Record<string, [string, string, string]> = {
            blue: [C.blueDim, C.blueLight, `${C.blue}33`],
            green: [C.greenDim, C.greenLight, `${C.green}33`],
            purple: [C.purpleDim, C.purpleLight, `${C.purple}33`],
            amber: [C.amberDim, C.amberLight, `${C.amber}33`],
          };
          const [bg, tc, bc] = cm[color];
          return (
            <div key={label} style={{ ...s.card, background: bg, borderColor: bc }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={s.label}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: tc, marginTop: 6 }}>{value}</div>
                </div>
                <div style={{ color: tc }}>
                  <Icon name={icon} size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Alertes */}
        <div style={s.card}>
          <div style={{ ...s.h2, marginBottom: 14 }}>Alertes système</div>
          <div
            style={{
              ...s.row,
              padding: "12px 14px",
              background: C.redDim,
              border: `1px solid ${C.red}33`,
              borderRadius: 9,
              marginBottom: 10,
            }}
          >
            <div style={{ color: C.redLight }}>
              <Icon name="alert" size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.redLight }}>
                14 alertes interactions médicamenteuses
              </div>
              <div style={s.muted}>Dossiers nécessitant révision urgente</div>
            </div>
          </div>
          <div
            style={{
              ...s.row,
              padding: "12px 14px",
              background: C.amberDim,
              border: `1px solid ${C.amber}33`,
              borderRadius: 9,
            }}
          >
            <div style={{ color: C.amberLight }}>
              <Icon name="alert" size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.amberLight }}>
                287 dossiers incomplets
              </div>
              <div style={s.muted}>Informations manquantes à compléter</div>
            </div>
          </div>
        </div>

        {/* Évolution */}
        <div style={s.card}>
          <div style={{ ...s.h2, marginBottom: 16 }}>Évolution mensuelle</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
            {MOCK_EVOLUTION.map((m, i) => {
              const isLast = i === MOCK_EVOLUTION.length - 1;
              const h = (m.v / maxV) * 100;
              return (
                <div
                  key={m.mois}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                >
                  <div
                    title={m.v.toLocaleString()}
                    style={{
                      width: "100%",
                      height: `${h}%`,
                      minHeight: 4,
                      background: isLast
                        ? "linear-gradient(180deg,#3B82F6,#2563EB)"
                        : "rgba(59,130,246,0.2)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.5s ease",
                    }}
                  />
                  <div style={{ fontSize: 11, color: C.textMuted }}>{m.mois}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Régions */}
      <div style={s.card}>
        <div style={{ ...s.h2, marginBottom: 16 }}>Répartition régionale</div>
        {MOCK_REGIONS.map((r) => (
          <div key={r.nom} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500 }}>{r.nom}</div>
            <div
              style={{
                flex: 1,
                height: 6,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(r.consultations / maxR) * 100}%`,
                  background: `linear-gradient(90deg,${C.blue},${C.cyan})`,
                  borderRadius: 3,
                  transition: "width 1s ease",
                }}
              />
            </div>
            <div style={{ width: 55, fontSize: 13, color: C.blueLight, textAlign: "right", fontWeight: 600 }}>
              {r.consultations.toLocaleString()}
            </div>
            <div style={{ width: 60, fontSize: 12, color: C.textMuted, textAlign: "right" }}>
              {r.patients.toLocaleString()} pts
            </div>
          </div>
        ))}
      </div>

      {/* Modules roadmap */}
      <div style={s.card}>
        <div style={{ ...s.h2, marginBottom: 14 }}>Modules en cours de déploiement</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            {
              icon: "credit",
              label: "Accès mutuelles",
              desc: "API partenaires tiers sécurisée — autorisé par patient",
              color: "amber",
              q: "Q3 2026",
            },
            {
              icon: "bar",
              label: "Épidémiologie IA",
              desc: "Détection précoce de clusters pathologiques anonymisés",
              color: "purple",
              q: "Q4 2026",
            },
            {
              icon: "trend",
              label: "Score de soin national",
              desc: "Indicateur de continuité thérapeutique par territoire",
              color: "green",
              q: "Q2 2026",
            },
          ].map((m) => {
            const cm: Record<string, [string, string]> = {
              amber: [C.amberDim, C.amberLight],
              purple: [C.purpleDim, C.purpleLight],
              green: [C.greenDim, C.greenLight],
            };
            const [, tc] = cm[m.color];
            return (
              <div key={m.label} style={{ ...s.card, opacity: 0.75, borderStyle: "dashed" }}>
                <div style={{ color: tc, marginBottom: 8 }}>
                  <Icon name={m.icon} size={20} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
                  {m.desc}
                </div>
                <span style={tag(m.color)}>Roadmap {m.q}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
