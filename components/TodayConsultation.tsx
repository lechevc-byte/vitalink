"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { C, s, btn, tag } from "@/lib/design";
import { signConsultation } from "@/lib/helpers";
import { createClient } from "@/lib/supabase-client";
import Icon from "./Icon";

/* ============================================================
   FAKE AI STREAMING
   ============================================================ */

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

/* ============================================================
   TYPES
   ============================================================ */

interface Props {
  patientId: string;
  patientNom: string;
  medecinId: string;
  rpps?: string | null;
  onConsultationSaved: () => void;
}

type Step = "idle" | "recording" | "editing" | "notes_saved" | "ai_streaming" | "ai_done" | "signed";

/* ============================================================
   COMPONENT
   ============================================================ */

export default function TodayConsultation({ patientId, patientNom, medecinId, rpps, onConsultationSaved }: Props) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("idle");
  const [consultId, setConsultId] = useState<string | null>(null);

  // Voice
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // AI
  const [streamText, setStreamText] = useState("");
  const [resumeIA, setResumeIA] = useState("");

  // Signature
  const [sigHash, setSigHash] = useState("");
  const [sigPar, setSigPar] = useState("");
  const [sigDate, setSigDate] = useState("");
  const [loadingSig, setLoadingSig] = useState(false);

  // Motif
  const [motif, setMotif] = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const rest = sec % 60;
    return `${m}:${rest.toString().padStart(2, "0")}`;
  };

  /* ---- VOICE ---- */

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "pt-PT";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = transcript; // append if resuming

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + result[0].transcript;
          setTranscript(finalTranscript.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setStep("editing");
      setInterimText("");
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      // Auto-transition to editing when speech stops
      setInterimText("");
      if (timerRef.current) clearInterval(timerRef.current);
      setStep("editing");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStep("recording");
    setInterimText("");
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  }, [transcript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setInterimText("");
    if (timerRef.current) clearInterval(timerRef.current);
    setEditedNotes(transcript);
    setStep("editing");
  }, [transcript]);

  /* ---- SAVE NOTES ---- */

  const saveNotes = async () => {
    // Create consultation in DB
    const { data } = await supabase
      .from("consultations")
      .insert({
        patient_id: patientId,
        medecin_id: medecinId,
        date_consultation: new Date().toISOString(),
        motif: motif || "Consulta do dia",
        type_consultation: "Generalista",
        notes_cliniques: editedNotes,
      })
      .select("id")
      .single();

    if (data) setConsultId(data.id);
    setStep("notes_saved");
  };

  /* ---- AI ---- */

  const generateAI = async () => {
    setStep("ai_streaming");
    setStreamText("");
    await fakeStream(RESUMO_DEFAULT, setStreamText);
    setResumeIA(RESUMO_DEFAULT);

    // Save to DB
    if (consultId) {
      await supabase.from("consultations").update({ resume_ia: RESUMO_DEFAULT }).eq("id", consultId);
    }
    setStep("ai_done");
  };

  /* ---- SIGN ---- */

  const handleSign = async () => {
    if (!consultId) return;
    setLoadingSig(true);
    const sig = await signConsultation(consultId, editedNotes, rpps || "");
    await supabase
      .from("consultations")
      .update({
        signature_hash: sig.hash,
        signature_par: sig.signe_par,
        signe_le: sig.signe_le,
      })
      .eq("id", consultId);
    setSigHash(sig.hash);
    setSigPar(sig.signe_par);
    setSigDate(sig.signe_le);
    setLoadingSig(false);
    setStep("signed");
    onConsultationSaved();
  };

  /* ---- RESET ---- */

  const reset = () => {
    setStep("idle");
    setConsultId(null);
    setTranscript("");
    setInterimText("");
    setEditedNotes("");
    setStreamText("");
    setResumeIA("");
    setSigHash("");
    setSigPar("");
    setSigDate("");
    setMotif("");
    setRecordingDuration(0);
  };

  /* ============================================================
     RENDER — IDLE STATE (big CTA)
     ============================================================ */

  if (step === "idle") {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08))",
          border: `2px dashed rgba(59,130,246,0.3)`,
          borderRadius: 16,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onClick={() => {
          if (voiceSupported) {
            startRecording();
          } else {
            setStep("editing");
          }
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.6)";
          (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(6,182,212,0.12))";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
          (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08))";
        }}
      >
        {/* Big mic icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(59,130,246,0.3)",
          }}
        >
          <Icon name="mic" size={32} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Iniciar consulta de hoje
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {voiceSupported
              ? "Clique para começar o ditado vocal — a IA transcreve e resume automaticamente"
              : "Clique para escrever as notas da consulta"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
          {[
            { icon: "mic", label: "Ditado vocal" },
            { icon: "sparkle", label: "Resumo IA" },
            { icon: "lock", label: "Assinatura" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
              <Icon name={s.icon} size={13} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER — ACTIVE CONSULTATION
     ============================================================ */

  return (
    <div
      style={{
        background: "#0B1222",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(59,130,246,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: step === "signed" ? C.green : step === "recording" ? C.red : C.blue,
              animation: step === "recording" ? "blink 1s step-end infinite" : "pulse 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Consulta de hoje — {patientNom}
          </span>
          {step === "signed" && <span style={tag("green")}>Concluída</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
          {new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ---- STEP: RECORDING ---- */}
        {step === "recording" && (
          <div
            style={{
              ...s.card,
              background: `${C.red}08`,
              borderColor: `${C.red}33`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Recording bar */}
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

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: C.red,
                  animation: "blink 1s step-end infinite",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.redLight }}>
                A gravar — fale naturalmente
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.redLight,
                  fontFamily: "monospace",
                }}
              >
                {fmtDuration(recordingDuration)}
              </span>
            </div>

            {/* Live transcript */}
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.9,
                color: C.text,
                minHeight: 60,
                padding: "12px 0",
              }}
            >
              {transcript && <span>{transcript} </span>}
              {interimText && (
                <span style={{ color: C.textMuted, fontStyle: "italic" }}>{interimText}</span>
              )}
              {!transcript && !interimText && (
                <span style={{ color: C.textMuted, fontStyle: "italic", fontSize: 14 }}>
                  A aguardar a sua voz...
                </span>
              )}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 16,
                  background: C.redLight,
                  marginLeft: 3,
                  animation: "blink 1s step-end infinite",
                  verticalAlign: "text-bottom",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button
                onClick={stopRecording}
                style={{
                  ...btn("danger"),
                  padding: "12px 32px",
                  fontSize: 14,
                  borderRadius: 30,
                }}
              >
                <Icon name="square" size={16} />
                Parar gravação
              </button>
            </div>
          </div>
        )}

        {/* ---- STEP: EDITING ---- */}
        {step === "editing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Motif */}
            <div>
              <div style={{ ...s.label, marginBottom: 6 }}>Motivo da consulta</div>
              <input
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Renovação de prescrição, controlo de rotina..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: C.text,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Notes textarea */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={s.label}>Notas clínicas (transcrição)</div>
                {voiceSupported && (
                  <button
                    onClick={startRecording}
                    style={{
                      ...btn("outline"),
                      borderRadius: 20,
                      padding: "5px 12px",
                      fontSize: 11,
                      gap: 5,
                    }}
                  >
                    <Icon name="mic" size={12} />
                    Continuar ditado
                  </button>
                )}
              </div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Escreva ou dite as notas clínicas..."
                style={{
                  width: "100%",
                  minHeight: 140,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.blue}33`,
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
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={reset} style={btn("ghost")}>
                Cancelar
              </button>
              <button
                onClick={saveNotes}
                disabled={!editedNotes.trim()}
                style={{
                  ...btn("primary"),
                  opacity: editedNotes.trim() ? 1 : 0.4,
                  padding: "10px 24px",
                }}
              >
                <Icon name="check" size={14} />
                Validar notas
              </button>
            </div>
          </div>
        )}

        {/* ---- STEP: NOTES SAVED → show AI button ---- */}
        {step === "notes_saved" && (
          <>
            {/* Saved notes (read-only) */}
            <div>
              <div style={{ ...s.label, marginBottom: 6 }}>Notas clínicas validadas</div>
              <div style={{ ...s.card, fontSize: 14, lineHeight: 1.8, color: C.textMid, background: `${C.green}08`, borderColor: `${C.green}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Icon name="check" size={14} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.greenLight }}>Notas guardadas</span>
                </div>
                {editedNotes}
              </div>
            </div>

            {/* AI CTA */}
            <div
              onClick={generateAI}
              style={{
                ...s.card,
                background: C.blueDim,
                borderColor: `${C.blue}33`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 24,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${C.blue}66`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${C.blue}33`; }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="sparkle" size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.blueLight }}>
                  Gerar resumo IA
                </div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  Claude analisa as notas e gera um resumo clínico estruturado
                </div>
              </div>
            </div>
          </>
        )}

        {/* ---- STEP: AI STREAMING ---- */}
        {step === "ai_streaming" && (
          <>
            <div>
              <div style={{ ...s.label, marginBottom: 6 }}>Notas clínicas</div>
              <div style={{ ...s.card, fontSize: 13, lineHeight: 1.8, color: C.textMuted }}>{editedNotes}</div>
            </div>

            <div style={{ ...s.card, background: C.blueDim, borderColor: `${C.blue}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
                <span style={{ fontSize: 13, fontWeight: 600, color: C.blueLight }}>
                  Claude a analizar as notas...
                </span>
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                {streamText}
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 15,
                    background: C.blueLight,
                    marginLeft: 2,
                    animation: "blink 1s step-end infinite",
                    verticalAlign: "text-bottom",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ---- STEP: AI DONE → sign ---- */}
        {step === "ai_done" && (
          <>
            <div>
              <div style={{ ...s.label, marginBottom: 6 }}>Notas clínicas</div>
              <div style={{ ...s.card, fontSize: 13, lineHeight: 1.8, color: C.textMuted }}>{editedNotes}</div>
            </div>

            <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="sparkle" size={16} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.greenLight }}>Resumo IA gerado</span>
              </div>
              <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-line" }}>
                {resumeIA}
              </div>
            </div>

            {/* Sign CTA */}
            <button
              onClick={handleSign}
              disabled={loadingSig}
              style={{
                ...btn("success"),
                padding: "14px 28px",
                fontSize: 15,
                borderRadius: 12,
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Icon name="lock" size={16} />
              {loadingSig ? "A assinar..." : "Assinar e concluir consulta"}
            </button>
          </>
        )}

        {/* ---- STEP: SIGNED ---- */}
        {step === "signed" && (
          <>
            <div>
              <div style={{ ...s.label, marginBottom: 6 }}>Notas clínicas</div>
              <div style={{ ...s.card, fontSize: 13, lineHeight: 1.8, color: C.textMuted }}>{editedNotes}</div>
            </div>

            <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="sparkle" size={16} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.greenLight }}>Resumo IA</span>
              </div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.9, whiteSpace: "pre-line" }}>{resumeIA}</div>
            </div>

            <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Icon name="lock" size={16} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.greenLight }}>Consulta assinada digitalmente</span>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, display: "flex", flexDirection: "column", gap: 3 }}>
                <span><strong style={{ color: C.textMid }}>{sigPar}</strong></span>
                <span>{new Date(sigDate).toLocaleString("pt-PT")}</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    marginTop: 4,
                    background: "rgba(0,0,0,0.2)",
                    padding: "5px 10px",
                    borderRadius: 6,
                    display: "inline-block",
                  }}
                >
                  {sigHash}
                </span>
              </div>
            </div>

            <button onClick={reset} style={{ ...btn("outline"), justifyContent: "center" }}>
              Nova consulta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
