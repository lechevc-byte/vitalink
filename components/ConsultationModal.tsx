"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

const RESUMO_DEFAULT = `**Motivo:** Renovação de prescrição + avaliação anual

**Avaliação clínica:** TA 130/80 estável. SpO2 98%. Sem sinais de descompensação cardíaca ou respiratória. Peso estável 68kg. Auscultação pulmonar sem alterações. Sem edemas periféricos.

**Decisão:** Renovação Ramipril 5mg por 90 dias. Prescrição de perfil lipídico de controlo. Manter Salbutamol 100µg em SOS.

**Seguimento:** Espirometria a agendar nos próximos 3 meses. Reavaliação da TA em consulta dentro de 3 meses. Resultados do perfil lipídico a avaliar em 2 semanas.`;

const fakeStream = async (text: string, setter: (v: string) => void) => {
  for (let i = 0; i <= text.length; i++) {
    setter(text.slice(0, i));
    await new Promise((r) => setTimeout(r, 22));
  }
};

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
  const [streamText, setStreamText] = useState("");
  const [loadingSig, setLoadingSig] = useState(false);
  const [c, setC] = useState(consult);
  const supabase = createClient();

  // Voice dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(c.notes_cliniques || "");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "pt-PT";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          setTranscript(finalTranscript.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setInterimText("");
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
    if (timerRef.current) clearInterval(timerRef.current);
    // Move to editing mode with the transcript
    if (transcript) {
      setEditedNotes(transcript);
      setEditingNotes(true);
    }
  }, [transcript]);

  const validateNotes = async () => {
    const updated = { ...c, notes_cliniques: editedNotes };
    setC(updated);
    onUpdate(updated);
    // Save to DB
    await supabase.from("consultations").update({ notes_cliniques: editedNotes }).eq("id", c.id);
    setEditingNotes(false);
    setTranscript("");
  };

  const canSign = isMedecin && !c.signature_hash;
  const canAI = isMedecin;

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAI = async () => {
    setLoadingAI(true);
    setStreamText("");
    await fakeStream(RESUMO_DEFAULT, setStreamText);
    const updated = { ...c, resume_ia: RESUMO_DEFAULT };
    setC(updated);
    onUpdate(updated);
    setLoadingAI(false);
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

          {/* Notes cliniques + Voice */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={s.h3}>Notas clínicas</div>
              {isMedecin && voiceSupported && !editingNotes && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    ...btn(isRecording ? "danger" : "primary"),
                    padding: "7px 14px",
                    fontSize: 12,
                    borderRadius: 20,
                    gap: 6,
                  }}
                >
                  <Icon name={isRecording ? "square" : "mic"} size={14} />
                  {isRecording ? `Parar (${fmtDuration(recordingDuration)})` : "Ditar notas"}
                </button>
              )}
            </div>

            {/* Recording state */}
            {isRecording && (
              <div
                style={{
                  ...s.card,
                  background: `${C.red}10`,
                  borderColor: `${C.red}33`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Animated recording bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${C.red}, ${C.amber}, ${C.red})`,
                    backgroundSize: "200% 100%",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: C.red,
                      animation: "blink 1s step-end infinite",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.redLight }}>
                    A gravar — fale naturalmente
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>
                    {fmtDuration(recordingDuration)}
                  </span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: C.textMid, minHeight: 40 }}>
                  {transcript && <span>{transcript} </span>}
                  {interimText && (
                    <span style={{ color: C.textMuted, fontStyle: "italic" }}>{interimText}</span>
                  )}
                  {!transcript && !interimText && (
                    <span style={{ color: C.textMuted, fontStyle: "italic" }}>A aguardar voz...</span>
                  )}
                </div>
              </div>
            )}

            {/* Editing/validation state */}
            {editingNotes && !isRecording && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 120,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.blue}44`,
                    borderRadius: 10,
                    padding: 14,
                    color: C.text,
                    fontSize: 14,
                    lineHeight: 1.8,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setTranscript("");
                    }}
                    style={btn("ghost")}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => startRecording()}
                    style={{ ...btn("outline"), borderRadius: 20, padding: "7px 14px", fontSize: 12 }}
                  >
                    <Icon name="mic" size={13} /> Continuar ditado
                  </button>
                  <button onClick={validateNotes} style={btn("success")}>
                    <Icon name="check" size={14} /> Validar notas
                  </button>
                </div>
              </div>
            )}

            {/* Display notes (read-only) */}
            {!isRecording && !editingNotes && (
              <div style={{ ...s.card, fontSize: 14, lineHeight: 1.8, color: C.textMid }}>
                {c.notes_cliniques || (
                  <span style={{ color: C.textMuted, fontStyle: "italic" }}>Nenhuma nota — use o ditado vocal</span>
                )}
              </div>
            )}
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
              {canAI && !c.resume_ia && !loadingAI && (
                <button onClick={handleAI} style={btn("primary")}>
                  Gerar Resumo IA
                </button>
              )}
              {loadingAI && (
                <div style={{ ...s.row, color: C.blueLight, fontSize: 12, gap: 6 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: `2px solid ${C.blue}`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Claude a analizar…
                </div>
              )}
            </div>
            {(loadingAI && streamText) && (
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                {streamText}
                <span style={{ display: "inline-block", width: 2, height: 14, background: C.blueLight, marginLeft: 2, animation: "blink 1s step-end infinite" }} />
              </div>
            )}
            {c.resume_ia && !loadingAI && (
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
