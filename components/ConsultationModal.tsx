"use client";

import { useState } from "react";
import { C, s, btn, tag } from "@/lib/design";
import { fmtDate, fmtDateTime } from "@/lib/helpers";
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
  onClose: () => void;
}

export default function ConsultationModal({ consult: c, onClose }: Props) {
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
              {fmtDate(c.date_consultation)} · {c.medecin_nom || "Médico"} ·{" "}
              <span style={tag("blue")}>{c.type_consultation}</span>
            </div>
          </div>
          <button onClick={onClose} style={btn("ghost")}>
            <Icon name="x" />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Constantes */}
          {Object.keys(constantes).length > 0 && (
            <div>
              <div style={s.h3}>Constantes vitais</div>
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
          )}

          {/* Notes */}
          {c.notes_cliniques && (
            <div>
              <div style={s.h3}>Notas clínicas</div>
              <div style={{ ...s.card, fontSize: 14, lineHeight: 1.8, color: C.textMid }}>
                {c.notes_cliniques}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div>
              <div style={s.h3}>Prescrições</div>
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
          )}

          {/* AI Summary */}
          {c.resume_ia && (
            <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
              <div style={{ ...s.row, color: C.greenLight, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                <Icon name="sparkle" size={16} /> Resumo IA (Claude)
              </div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                {c.resume_ia}
              </div>
            </div>
          )}

          {/* Signature */}
          {c.signature_hash && (
            <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
              <div style={{ ...s.row, color: C.greenLight, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                <Icon name="lock" size={16} /> Consulta assinada digitalmente
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
                <div><strong style={{ color: C.textMid }}>{c.signature_par}</strong></div>
                <div>{c.signe_le && fmtDateTime(c.signe_le)}</div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    marginTop: 4,
                    background: "rgba(0,0,0,0.2)",
                    padding: "6px 10px",
                    borderRadius: 6,
                  }}
                >
                  {c.signature_hash}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
