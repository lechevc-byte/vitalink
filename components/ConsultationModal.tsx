"use client";

import { useState } from "react";
import { C, s, btn, tag } from "@/lib/design";
import { fmtDate, fmtDateTime, signConsultation } from "@/lib/helpers";
import { createClient } from "@/lib/supabase-client";
import Icon from "./Icon";

interface Consultation {
  id: string;
  date_consultation: string;
  motif: string;
  type_consultation: string | null;
  notes_cliniques: string | null;
  resume_ia: string | null;
  constantes: Record<string, string> | null;
  prescriptions: string[] | null;
  signature_hash: string | null;
  signature_par: string | null;
  signe_le: string | null;
  medecin_nom?: string;
}

interface Props {
  consult: Consultation;
  patientNom: string;
  isMedecin: boolean;
  rpps?: string | null;
  patientId: string;
  onClose: () => void;
  onUpdate: (c: Consultation) => void;
}

export default function ConsultationModal({
  consult,
  patientNom,
  isMedecin,
  rpps,
  patientId,
  onClose,
  onUpdate,
}: Props) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSig, setLoadingSig] = useState(false);
  const [c, setC] = useState(consult);
  const supabase = createClient();

  const canSign = isMedecin && !c.signature_hash;
  const canAI = isMedecin;

  const handleAI = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationId: c.id, patientId }),
      });
      const data = await res.json();
      if (data.resume) {
        const updated = { ...c, resume_ia: data.resume };
        setC(updated);
        onUpdate(updated);
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSign = async () => {
    setLoadingSig(true);
    try {
      const sig = await signConsultation(c.id, c.notes_cliniques || "", rpps || "");
      await supabase
        .from("consultations")
        .update({
          signature_hash: sig.hash,
          signature_par: sig.signe_par,
          signe_le: sig.signe_le,
        })
        .eq("id", c.id);
      const updated = {
        ...c,
        signature_hash: sig.hash,
        signature_par: sig.signe_par,
        signe_le: sig.signe_le,
      };
      setC(updated);
      onUpdate(updated);
    } finally {
      setLoadingSig(false);
    }
  };

  const constantes = c.constantes || {};
  const prescriptions = c.prescriptions || [];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#0D1628",
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 740,
          maxHeight: "88vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{c.motif}</div>
            <div style={s.muted}>
              {fmtDate(c.date_consultation)} · {c.medecin_nom || "Médecin"} ·{" "}
              <span style={tag("blue")}>{c.type_consultation}</span>
            </div>
          </div>
          <button onClick={onClose} style={btn("ghost")}>
            <Icon name="x" />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Constantes */}
          <div>
            <div style={s.h3}>Constantes vitales</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(constantes).map(([k, v]) => (
                <div
                  key={k}
                  style={{ ...s.card, padding: "10px 16px", textAlign: "center", flex: "1 1 80px" }}
                >
                  <div style={s.label}>{k.toUpperCase()}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.blueLight, marginTop: 4 }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={s.h3}>Notes cliniques</div>
            <div style={{ ...s.card, fontSize: 14, lineHeight: 1.8, color: C.textMid }}>
              {c.notes_cliniques}
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div style={s.h3}>Prescriptions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prescriptions.map((p, i) => (
                <div
                  key={i}
                  style={{
                    ...s.row,
                    fontSize: 13,
                    color: C.textMid,
                    padding: "8px 12px",
                    background: C.surface,
                    borderRadius: 8,
                  }}
                >
                  <Icon name="pill" size={14} />
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div
            style={{
              ...s.card,
              background: c.resume_ia ? C.greenDim : C.blueDim,
              borderColor: c.resume_ia ? `${C.green}33` : `${C.blue}33`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: c.resume_ia ? 12 : 0,
              }}
            >
              <div
                style={{
                  ...s.row,
                  color: c.resume_ia ? C.greenLight : C.blueLight,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Icon name="sparkle" size={16} /> Résumé IA (Claude)
              </div>
              {canAI && !c.resume_ia && (
                <button onClick={handleAI} disabled={loadingAI} style={btn("primary")}>
                  {loadingAI ? "Génération…" : "Générer le résumé"}
                </button>
              )}
            </div>
            {loadingAI && (
              <div style={{ ...s.row, color: C.blueLight, fontSize: 13 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${C.blue}`,
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Analyse IA en cours…
              </div>
            )}
            {c.resume_ia && (
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                {c.resume_ia}
              </div>
            )}
          </div>

          {/* Signature */}
          <div
            style={{
              ...s.card,
              background: c.signature_hash ? C.greenDim : C.surface,
              borderColor: c.signature_hash ? `${C.green}33` : C.border,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...s.row,
                  color: c.signature_hash ? C.greenLight : C.textMuted,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Icon name="lock" size={16} />
                {c.signature_hash
                  ? "Consultation signée numériquement"
                  : "Signature numérique requise"}
              </div>
              {canSign && (
                <button onClick={handleSign} disabled={loadingSig} style={btn("success")}>
                  {loadingSig ? "Signature…" : "Signer"}
                </button>
              )}
            </div>
            {c.signature_hash && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: C.textMuted,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div>
                  <strong style={{ color: C.textMid }}>{c.signature_par}</strong>
                </div>
                <div>{c.signe_le && fmtDateTime(c.signe_le)}</div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: C.textMuted,
                    marginTop: 4,
                    background: "rgba(0,0,0,0.2)",
                    padding: "6px 10px",
                    borderRadius: 6,
                  }}
                >
                  {c.signature_hash}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
