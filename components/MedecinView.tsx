"use client";

import { useState, useEffect } from "react";
import { C, s, btn, tag, avatar } from "@/lib/design";
import { age, fmtDate, exportDMP } from "@/lib/helpers";
import { createClient } from "@/lib/supabase-client";
import Icon from "./Icon";
import ConsultationModal from "./ConsultationModal";
import TodayConsultation from "./TodayConsultation";

interface Profile {
  id: string;
  role: string;
  nom: string;
  prenom: string;
  numero_rpps?: string | null;
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
  notes_cliniques: string | null;
  resume_ia: string | null;
  constantes: Record<string, string> | null;
  prescriptions: string[] | null;
  signature_hash: string | null;
  signature_par: string | null;
  signe_le: string | null;
  medecin_nom?: string;
}

interface Document {
  id: string;
  nom: string;
  type_document: string | null;
  date_document: string | null;
  statut: string | null;
}

export default function MedecinView({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeConsult, setActiveConsult] = useState<Consultation | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("timeline");
  const [showPatientList, setShowPatientList] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("medecin_referent_id", profile.id);
    if (data) {
      setPatients(data);
      if (data.length > 0) {
        setSelected(data[0]);
        loadPatientDetails(data[0].id);
      }
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    const [consultRes, docRes] = await Promise.all([
      supabase
        .from("consultations")
        .select("*, profiles:medecin_id(nom, prenom)")
        .eq("patient_id", patientId)
        .order("date_consultation", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_document", { ascending: false }),
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
  };

  const selectPatient = (p: Patient) => {
    setSelected(p);
    setTab("timeline");
    setShowPatientList(false); // on mobile, switch to dossier view
    loadPatientDetails(p.id);
  };

  const filtered = patients.filter(
    (p) =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      p.nss.includes(search)
  );

  const scoreColor = (sc: number) => (sc >= 90 ? C.green : sc >= 70 ? C.amber : C.red);

  return (
    <div className="medecin-layout">
      {/* Patient list */}
      <div className={`medecin-sidebar${!showPatientList && selected ? " hidden-mobile" : ""}`} style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={s.h2}>Patients</span>
          <span style={{ ...tag("blue"), fontSize: 12 }}>{patients.length}</span>
        </div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, NSS…"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 12px 8px 34px",
              color: C.text,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>
            <Icon name="search" size={14} />
          </div>
        </div>
        <div style={s.col}>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => selectPatient(p)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                background: selected?.id === p.id ? "rgba(59,130,246,0.1)" : "transparent",
                border: `1px solid ${selected?.id === p.id ? "rgba(59,130,246,0.3)" : C.border}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ ...s.row, gap: 10 }}>
                <div style={avatar(34)}>
                  {p.prenom[0]}
                  {p.nom[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {p.prenom} {p.nom}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                    {age(p.date_naissance)} ans
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${p.score_continuite}%`,
                          background: scoreColor(p.score_continuite),
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span style={{ color: scoreColor(p.score_continuite) }}>{p.score_continuite}%</span>
                  </div>
                </div>
                {p.alertes && p.alertes.length > 0 && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, flexShrink: 0 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dossier */}
      {selected && (
        <div className={`medecin-dossier${showPatientList ? " hidden-mobile" : ""}`}>
          {/* Back button (mobile only) */}
          <button
            className="medecin-back-btn"
            onClick={() => setShowPatientList(true)}
            style={{
              ...btn("ghost"),
              padding: "8px 12px",
              fontSize: 13,
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>&larr;</span> Voltar à lista
          </button>

          {/* Header patient */}
          <div className="patient-header" style={s.card}>
            <div style={avatar(58)}>
              {selected.prenom[0]}
              {selected.nom[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>
                  {selected.prenom} {selected.nom}
                </h2>
                <span style={tag("blue")}>{selected.groupe_sanguin}</span>
                <span style={{ ...tag("green"), borderRadius: 5 }}>
                  {selected.score_continuite}%
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={s.muted}>
                  {age(selected.date_naissance)} ans · {fmtDate(selected.date_naissance)}
                </span>
                <span style={{ ...s.muted, fontFamily: "monospace", fontSize: 12 }}>NSS {selected.nss}</span>
              </div>
              {selected.alertes && selected.alertes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {selected.alertes.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        ...s.row,
                        fontSize: 12,
                        color: a.type === "warning" ? C.amberLight : C.blueLight,
                        background: a.type === "warning" ? C.amberDim : C.blueDim,
                        padding: "6px 10px",
                        borderRadius: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <Icon name="alert" size={13} />
                      {a.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="patient-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() =>
                  exportDMP({
                    ...selected,
                    consultations,
                    documents,
                  })
                }
                style={btn("outline")}
              >
                <Icon name="download" size={14} /> Export DMP
              </button>
            </div>
          </div>

          {/* TODAY CONSULTATION — main CTA */}
          <TodayConsultation
            patientId={selected.id}
            patientNom={`${selected.prenom} ${selected.nom}`}
            medecinId={profile.id}
            rpps={profile.numero_rpps}
            onConsultationSaved={() => loadPatientDetails(selected.id)}
          />

          {/* Tabs — historique */}
          <div
            className="medecin-tabs"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 4,
            }}
          >
            {(
              [
                ["timeline", "Historique", "activity"],
                ["traitements", "Traitements", "pill"],
                ["antecedents", "Antécédents", "shield"],
                ["documents", "Documents", "file"],
              ] as [string, string, string][]
            ).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  background: tab === id ? "rgba(59,130,246,0.15)" : "transparent",
                  color: tab === id ? C.blueLight : C.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <Icon name={icon} size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          {tab === "timeline" && (
            <div style={s.card}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "rgba(59,130,246,0.15)",
                  }}
                />
                {consultations.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveConsult(c)}
                    style={{ display: "flex", gap: 14, marginBottom: 14, cursor: "pointer" }}
                  >
                    <div style={{ zIndex: 1, flexShrink: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background:
                            i === 0 ? "linear-gradient(135deg,#3B82F6,#06B6D4)" : C.surface,
                          border: "2px solid rgba(59,130,246,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: i === 0 ? "#fff" : C.blueLight,
                        }}
                      >
                        <Icon name="activity" size={14} />
                      </div>
                    </div>
                    <div style={{ ...s.card, flex: 1, padding: 14, transition: "all 0.15s" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 4,
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.motif}</span>
                          <span style={tag("blue")}>{c.type_consultation}</span>
                          {c.signature_hash && <span style={tag("green")}>✓ Signé</span>}
                          {c.resume_ia && <span style={tag("purple")}>✦ IA</span>}
                        </div>
                        <span style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>
                          {fmtDate(c.date_consultation)}
                        </span>
                      </div>
                      <div style={s.muted}>{c.medecin_nom}</div>
                    </div>
                  </div>
                ))}
                {consultations.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                    Aucune consultation
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Traitements */}
          {tab === "traitements" && (
            <div style={s.card}>
              {!selected.traitements || selected.traitements.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                  Aucun traitement en cours
                </div>
              ) : (
                selected.traitements.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: C.surface,
                      borderRadius: 9,
                      marginBottom: 8,
                    }}
                  >
                    <div style={s.row}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: C.blueDim,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.blueLight,
                        }}
                      >
                        <Icon name="pill" size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {t.medicament} <span style={{ color: C.blueLight }}>{t.dosage}</span>
                        </div>
                        <div style={s.muted}>
                          {t.frequence} — depuis {t.depuis}
                        </div>
                      </div>
                    </div>
                    <span style={tag(t.actif ? "green" : "gray")}>{t.actif ? "Actif" : "Arrêté"}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Antécédents */}
          {tab === "antecedents" && (
            <div style={s.card}>
              {(!selected.antecedents || selected.antecedents.length === 0) ? (
                <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                  Aucun antécédent
                </div>
              ) : (
                selected.antecedents.map((a, i) => (
                  <div
                    key={i}
                    style={{ ...s.row, padding: "10px 12px", background: C.surface, borderRadius: 8, marginBottom: 6 }}
                  >
                    <Icon name="shield" size={14} />
                    <span style={{ fontSize: 13, color: C.textMid }}>{a.libelle}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        ...tag(
                          a.type === "allergie" ? "red" : a.type === "maladie_chronique" ? "amber" : "gray"
                        ),
                      }}
                    >
                      {a.type?.replace("_", " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Documents */}
          {tab === "documents" && (
            <div style={s.card}>
              {documents.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                  Aucun document
                </div>
              ) : (
                documents.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: C.surface,
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ ...s.row, gap: 10, color: C.textMid, fontSize: 13 }}>
                      <Icon name="file" size={16} />
                      <div>
                        <div style={{ fontWeight: 600, color: C.text }}>{d.nom}</div>
                        <div style={s.muted}>
                          {d.type_document} · {d.date_document && fmtDate(d.date_document)}
                        </div>
                      </div>
                    </div>
                    <div style={s.row}>
                      <span style={tag(d.statut === "Normal" ? "green" : "blue")}>{d.statut}</span>
                      <button style={btn("ghost")}>
                        <Icon name="eye" size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeConsult && (
        <ConsultationModal
          consult={activeConsult}
          onClose={() => setActiveConsult(null)}
        />
      )}
    </div>
  );
}
