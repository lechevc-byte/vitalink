"use client";

import { useState, useEffect, useRef } from "react";
import { C, s, tag } from "@/lib/design";
import Icon from "./Icon";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/* ============================================================
   MOCK DATA — all hardcoded, no DB calls
   ============================================================ */

const consultasMensais = [
  { mes: "Mar 25", total: 4200 },
  { mes: "Abr 25", total: 4800 },
  { mes: "Mai 25", total: 5100 },
  { mes: "Jun 25", total: 5400 },
  { mes: "Jul 25", total: 4900 },
  { mes: "Ago 25", total: 5800 },
  { mes: "Set 25", total: 6200 },
  { mes: "Out 25", total: 6800 },
  { mes: "Nov 25", total: 7100 },
  { mes: "Dez 25", total: 7400 },
  { mes: "Jan 26", total: 8200 },
  { mes: "Fev 26", total: 8900 },
];

const ILHAS = [
  { nome: "Santiago", x: 280, y: 300, consultas: 38400, medicos: 42, cor: "#3B82F6" },
  { nome: "São Vicente", x: 140, y: 120, consultas: 18200, medicos: 18, cor: "#3B82F6" },
  { nome: "Santo Antão", x: 80, y: 100, consultas: 9800, medicos: 8, cor: "#10B981" },
  { nome: "Fogo", x: 210, y: 340, consultas: 7200, medicos: 5, cor: "#10B981" },
  { nome: "Sal", x: 380, y: 140, consultas: 8900, medicos: 6, cor: "#10B981" },
  { nome: "Boavista", x: 460, y: 200, consultas: 5100, medicos: 3, cor: "#F59E0B" },
  { nome: "Maio", x: 370, y: 290, consultas: 2800, medicos: 2, cor: "#F59E0B" },
  { nome: "São Nicolau", x: 270, y: 150, consultas: 3200, medicos: 2, cor: "#F59E0B" },
  { nome: "Brava", x: 160, y: 360, consultas: 1800, medicos: 1, cor: "#EF4444" },
  { nome: "Santa Luzia", x: 190, y: 110, consultas: 0, medicos: 0, cor: "#64748B" },
];

const patologias = [
  { nome: "Hipertensão Arterial", casos: 12400, pct: 31 },
  { nome: "Diabetes Tipo 2", casos: 8900, pct: 22 },
  { nome: "Infeções Respiratórias", casos: 7200, pct: 18 },
  { nome: "Doenças Cardiovasculares", casos: 4800, pct: 12 },
  { nome: "Desnutrição", casos: 3100, pct: 8 },
  { nome: "Paludismo", casos: 1800, pct: 4 },
  { nome: "Outras", casos: 2000, pct: 5 },
];

const porIdade = [
  { faixa: "0-14", hta: 2, diabetes: 1, cardio: 1, respiratorio: 28 },
  { faixa: "15-29", hta: 8, diabetes: 4, cardio: 3, respiratorio: 22 },
  { faixa: "30-44", hta: 22, diabetes: 14, cardio: 8, respiratorio: 15 },
  { faixa: "45-59", hta: 38, diabetes: 28, cardio: 18, respiratorio: 12 },
  { faixa: "60-74", hta: 52, diabetes: 41, cardio: 32, respiratorio: 18 },
  { faixa: "75+", hta: 61, diabetes: 44, cardio: 48, respiratorio: 24 },
];

const estabelecimentos = [
  { nome: "Hospital Dr. Agostinho Neto", ilha: "Santiago", tipo: "Hospital Central", medicos: 42, consultas: 28400, taxa_completo: 89, score: 94 },
  { nome: "Hospital Baptista de Sousa", ilha: "São Vicente", tipo: "Hospital Regional", medicos: 18, consultas: 12800, taxa_completo: 82, score: 87 },
  { nome: "Hospital da Praia Norte", ilha: "Santiago", tipo: "Centro de Saúde", medicos: 8, consultas: 6200, taxa_completo: 76, score: 79 },
  { nome: "Centro de Saúde do Sal", ilha: "Sal", tipo: "Centro de Saúde", medicos: 6, consultas: 5100, taxa_completo: 71, score: 74 },
  { nome: "Centro de Saúde de São Filipe", ilha: "Fogo", tipo: "Centro de Saúde", medicos: 5, consultas: 4200, taxa_completo: 68, score: 71 },
  { nome: "Posto Sanitário da Brava", ilha: "Brava", tipo: "Posto Sanitário", medicos: 1, consultas: 980, taxa_completo: 41, score: 38 },
];

const piramide = [
  { faixa: "75+", homens: 1200, mulheres: 1580 },
  { faixa: "60-74", homens: 3800, mulheres: 4200 },
  { faixa: "45-59", homens: 6200, mulheres: 6800 },
  { faixa: "30-44", homens: 8400, mulheres: 9100 },
  { faixa: "15-29", homens: 9800, mulheres: 10200 },
  { faixa: "0-14", homens: 11200, mulheres: 10800 },
];

const cobertura = [
  { ilha: "Santiago", pct: 91 },
  { ilha: "São Vicente", pct: 84 },
  { ilha: "Sal", pct: 76 },
  { ilha: "Fogo", pct: 68 },
  { ilha: "Santo Antão", pct: 62 },
  { ilha: "São Nicolau", pct: 54 },
  { ilha: "Boavista", pct: 48 },
  { ilha: "Maio", pct: 41 },
  { ilha: "Brava", pct: 28 },
  { ilha: "Santa Luzia", pct: 0 },
];

const estabEvolution: Record<string, number[]> = {
  "Hospital Dr. Agostinho Neto": [4200, 4500, 4800, 4900, 5100, 4900],
  "Hospital Baptista de Sousa": [1800, 2000, 2100, 2200, 2400, 2300],
  "Hospital da Praia Norte": [900, 950, 1000, 1050, 1100, 1100],
  "Centro de Saúde do Sal": [750, 800, 850, 880, 870, 850],
  "Centro de Saúde de São Filipe": [650, 680, 700, 710, 700, 760],
  "Posto Sanitário da Brava": [180, 160, 170, 155, 165, 150],
};

/* ============================================================
   SECTIONS
   ============================================================ */

type Section = "visao" | "epidemio" | "estab" | "demo";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "visao", label: "Visão Geral", icon: "globe" },
  { id: "epidemio", label: "Epidemiologia", icon: "activity" },
  { id: "estab", label: "Estabelecimentos", icon: "hospital" },
  { id: "demo", label: "Demografia", icon: "users" },
];

/* ============================================================
   ANIMATED NUMBER
   ============================================================ */

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value]);

  return (
    <span>
      {display.toLocaleString()}{suffix}
    </span>
  );
}

/* ============================================================
   MAP SVG
   ============================================================ */

function CaboVerdeMap() {
  const [hover, setHover] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; ilha: typeof ILHAS[0] } | null>(null);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 600 420" style={{ width: "100%", height: "auto" }}>
        {/* Ocean background */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="420" fill="#0A1120" rx="12" />
        <circle cx="300" cy="210" r="180" fill="url(#glow)" />

        {/* Grid lines */}
        {[100, 200, 300, 400, 500].map((x) => (
          <line key={`vg${x}`} x1={x} y1={0} x2={x} y2={420} stroke="rgba(255,255,255,0.03)" />
        ))}
        {[100, 200, 300, 400].map((y) => (
          <line key={`hg${y}`} x1={0} y1={y} x2={600} y2={y} stroke="rgba(255,255,255,0.03)" />
        ))}

        {/* Islands */}
        {ILHAS.map((ilha) => {
          const radius = ilha.consultas > 0 ? Math.max(8, Math.min(40, Math.sqrt(ilha.consultas) / 8)) : 6;
          const isHovered = hover === ilha.nome;
          return (
            <g
              key={ilha.nome}
              onMouseEnter={(e) => {
                setHover(ilha.nome);
                setTooltip({ x: ilha.x, y: ilha.y, ilha });
              }}
              onMouseLeave={() => {
                setHover(null);
                setTooltip(null);
              }}
              style={{ cursor: "pointer" }}
            >
              {/* Pulse ring */}
              {ilha.consultas > 0 && (
                <circle
                  cx={ilha.x}
                  cy={ilha.y}
                  r={radius + 4}
                  fill="none"
                  stroke={ilha.cor}
                  strokeWidth="1"
                  opacity={isHovered ? 0.6 : 0.2}
                  style={{ transition: "all 0.3s" }}
                />
              )}
              {/* Main dot */}
              <circle
                cx={ilha.x}
                cy={ilha.y}
                r={isHovered ? radius + 3 : radius}
                fill={ilha.cor}
                opacity={isHovered ? 0.9 : 0.7}
                style={{ transition: "all 0.3s" }}
              />
              {/* Label */}
              <text
                x={ilha.x}
                y={ilha.y - radius - 8}
                textAnchor="middle"
                fill={isHovered ? "#F1F5F9" : "#94A3B8"}
                fontSize={isHovered ? 12 : 10}
                fontWeight={isHovered ? 700 : 500}
                style={{ transition: "all 0.3s" }}
              >
                {ilha.nome}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: `${(tooltip.x / 600) * 100}%`,
            top: `${(tooltip.y / 420) * 100}%`,
            transform: "translate(-50%, -120%)",
            background: "rgba(13,22,40,0.95)",
            border: `1px solid ${tooltip.ilha.cor}44`,
            borderRadius: 10,
            padding: "10px 14px",
            pointerEvents: "none",
            zIndex: 10,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>
            {tooltip.ilha.nome}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", display: "flex", flexDirection: "column", gap: 2 }}>
            <span>{tooltip.ilha.consultas.toLocaleString()} consultas</span>
            <span>{tooltip.ilha.medicos} médicos</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
        {[
          { color: "#3B82F6", label: "Boa cobertura" },
          { color: "#10B981", label: "Correto" },
          { color: "#F59E0B", label: "Fraca" },
          { color: "#EF4444", label: "Crítica" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SECTION COMPONENTS
   ============================================================ */

function VisaoGeral() {
  const kpis = [
    { label: "Consultas totais", value: 98432, icon: "activity", color: "#3B82F6" },
    { label: "Médicos ativos", value: 100, icon: "stethoscope", color: "#10B981" },
    { label: "Ilhas cobertas", value: 9, suffix: " / 10", icon: "map", color: "#8B5CF6" },
    { label: "Dossiers completos", value: 73, suffix: "%", icon: "clipboard", color: "#F59E0B" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            style={{
              background: `${kpi.color}10`,
              border: `1px solid ${kpi.color}22`,
              borderRadius: 14,
              padding: 20,
              animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...s.label, marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, animation: "countUp 0.8s ease both" }}>
                  <AnimatedNumber value={kpi.value} suffix={kpi.suffix || ""} />
                </div>
              </div>
              <div style={{ color: kpi.color, opacity: 0.6 }}>
                <Icon name={kpi.icon} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Map */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Line Chart */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 20 }}>Evolução mensal</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={consultasMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="mes" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0D1628",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F1F5F9",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ fill: "#3B82F6", r: 3 }}
                activeDot={{ r: 6, fill: "#60A5FA" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Map */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 16 }}>Mapa — Cabo Verde</div>
          <CaboVerdeMap />
        </div>
      </div>
    </div>
  );
}

function Epidemiologia() {
  const maxCasos = Math.max(...patologias.map((p) => p.casos));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Alerts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { level: "red", emoji: "\uD83D\uDD34", label: "ALERTA", msg: "Pico de infeções respiratórias em São Vicente (+34% vs mês anterior)" },
          { level: "amber", emoji: "\uD83D\uDFE0", label: "ATENÇÃO", msg: "Cobertura de diabetes crítica na ilha da Brava (apenas 1 médico)" },
          { level: "amber", emoji: "\uD83D\uDFE1", label: "INFO", msg: "Taxa de HTA em 45-59 anos acima da média regional CEDEAO" },
        ].map((a, i) => {
          const colors: Record<string, [string, string, string]> = {
            red: [C.redDim, `${C.red}33`, C.redLight],
            amber: [C.amberDim, `${C.amber}33`, C.amberLight],
          };
          const [bg, bc, tc] = colors[a.level];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: bg,
                border: `1px solid ${bc}`,
                borderRadius: 10,
                animation: `fadeInUp 0.4s ease ${i * 0.1}s both`,
              }}
            >
              <span style={{ fontSize: 16 }}>{a.emoji}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tc }}>{a.label}</span>
                <span style={{ fontSize: 13, color: C.textMid }}> — {a.msg}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top pathologies - horizontal bars */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 20 }}>Top patologias</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patologias.map((p) => (
              <div key={p.nome} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 180, fontSize: 12, color: C.textMid, flexShrink: 0 }}>{p.nome}</div>
                <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(p.casos / maxCasos) * 100}%`,
                      background: "linear-gradient(90deg, #3B82F6, #06B6D4)",
                      borderRadius: 4,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
                <div style={{ width: 50, fontSize: 12, color: C.blueLight, textAlign: "right", fontWeight: 600 }}>
                  {p.casos.toLocaleString()}
                </div>
                <div style={{ width: 35, fontSize: 11, color: C.textMuted, textAlign: "right" }}>
                  {p.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diseases by age - grouped bars */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 20 }}>Patologias por faixa etária (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porIdade}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="faixa" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0D1628",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F1F5F9",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
              <Bar dataKey="hta" name="HTA" fill="#EF4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="diabetes" name="Diabetes" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cardio" name="Cardiovasc." fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="respiratorio" name="Respiratório" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Estabelecimentos() {
  type SortKey = "nome" | "medicos" | "consultas" | "taxa_completo" | "score";
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const sorted = [...estabelecimentos].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const scoreColor = (sc: number) => (sc > 80 ? C.green : sc >= 60 ? C.amber : C.red);
  const scoreBg = (sc: number) => (sc > 80 ? C.greenDim : sc >= 60 ? C.amberDim : C.redDim);

  const headers: { key: SortKey; label: string; width?: number }[] = [
    { key: "nome", label: "Estabelecimento" },
    { key: "medicos", label: "Médicos", width: 80 },
    { key: "consultas", label: "Consultas", width: 100 },
    { key: "taxa_completo", label: "Completos %", width: 100 },
    { key: "score", label: "Score", width: 80 },
  ];

  const meses = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];

  return (
    <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={s.h2}>Performance dos estabelecimentos</div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 100px 100px 80px",
          padding: "10px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {headers.map((h) => (
          <div
            key={h.key}
            onClick={() => toggleSort(h.key)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: sortBy === h.key ? C.blueLight : C.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              userSelect: "none",
            }}
          >
            {h.label}
            {sortBy === h.key && <span style={{ fontSize: 10 }}>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((est) => (
        <div key={est.nome}>
          <div
            onClick={() => setExpanded(expanded === est.nome ? null : est.nome)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 100px 100px 80px",
              padding: "14px 20px",
              borderBottom: `1px solid ${C.border}`,
              cursor: "pointer",
              transition: "background 0.15s",
              background: expanded === est.nome ? "rgba(59,130,246,0.05)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (expanded !== est.nome) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              if (expanded !== est.nome) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{est.nome}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {est.ilha} · {est.tipo}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.textMid, display: "flex", alignItems: "center" }}>{est.medicos}</div>
            <div style={{ fontSize: 13, color: C.blueLight, fontWeight: 600, display: "flex", alignItems: "center" }}>
              {est.consultas.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: C.textMid, display: "flex", alignItems: "center" }}>{est.taxa_completo}%</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  background: scoreBg(est.score),
                  color: scoreColor(est.score),
                }}
              >
                {est.score}
              </span>
            </div>
          </div>

          {/* Expanded detail */}
          {expanded === est.nome && (
            <div style={{ padding: "16px 20px", background: "rgba(59,130,246,0.03)", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Evolução consultas (6 meses)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                {(estabEvolution[est.nome] || []).map((v, i) => {
                  const max = Math.max(...(estabEvolution[est.nome] || [1]));
                  const h = (v / max) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 600 }}>{v.toLocaleString()}</div>
                      <div
                        style={{
                          width: "100%",
                          height: `${h}%`,
                          minHeight: 4,
                          background: i === 5 ? "linear-gradient(180deg,#3B82F6,#2563EB)" : "rgba(59,130,246,0.25)",
                          borderRadius: "4px 4px 0 0",
                        }}
                      />
                      <div style={{ fontSize: 10, color: C.textMuted }}>{meses[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Demografia() {
  const maxPop = Math.max(...piramide.flatMap((p) => [p.homens, p.mulheres]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Age Pyramid */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 20 }}>Pirâmide etária</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {piramide.map((row) => (
              <div key={row.faixa} style={{ display: "flex", alignItems: "center", gap: 4, height: 28 }}>
                {/* Men bar - right-aligned */}
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      height: 20,
                      width: `${(row.homens / maxPop) * 100}%`,
                      background: "linear-gradient(270deg, #3B82F6, #2563EB)",
                      borderRadius: "4px 0 0 4px",
                      transition: "width 0.8s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      paddingLeft: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {row.homens.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Age label */}
                <div
                  style={{
                    width: 50,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMid,
                    flexShrink: 0,
                  }}
                >
                  {row.faixa}
                </div>
                {/* Women bar - left-aligned */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 20,
                      width: `${(row.mulheres / maxPop) * 100}%`,
                      background: "linear-gradient(90deg, #EC4899, #F472B6)",
                      borderRadius: "0 4px 4px 0",
                      transition: "width 0.8s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {row.mulheres.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8" }}>
              <div style={{ width: 12, height: 4, borderRadius: 2, background: "#3B82F6" }} />
              Homens
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94A3B8" }}>
              <div style={{ width: 12, height: 4, borderRadius: 2, background: "#EC4899" }} />
              Mulheres
            </div>
          </div>
        </div>

        {/* Coverage by island */}
        <div style={{ ...s.card, padding: 20 }}>
          <div style={{ ...s.h2, marginBottom: 20 }}>Taxa de cobertura por ilha</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cobertura.map((c) => {
              const color = c.pct > 70 ? "#10B981" : c.pct >= 40 ? "#F59E0B" : "#EF4444";
              return (
                <div key={c.ilha} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: C.textMid, flexShrink: 0 }}>{c.ilha}</div>
                  <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${c.pct}%`,
                        background: color,
                        borderRadius: 4,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                  <div style={{ width: 40, fontSize: 12, color, textAlign: "right", fontWeight: 600 }}>
                    {c.pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function EtatView() {
  const [section, setSection] = useState<Section>("visao");

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)", background: "#0D1628" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          background: "rgba(0,0,0,0.3)",
          borderRight: `1px solid ${C.border}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 12px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Navegação
          </div>
        </div>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setSection(sec.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: section === sec.id ? 600 : 500,
              background: section === sec.id ? "rgba(59,130,246,0.12)" : "transparent",
              color: section === sec.id ? C.blueLight : C.textMuted,
              transition: "all 0.15s",
              width: "100%",
              textAlign: "left",
            }}
          >
            <Icon name={sec.icon} size={16} />
            {sec.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
              Dashboard Nacional — Cabo Verde
            </h1>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
              Ministério da Saúde · {new Date().toLocaleDateString("pt-CV", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 20,
              background: `${C.green}15`,
              border: `1px solid ${C.green}33`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.green,
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.greenLight }}>Dados em tempo real</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {section === "visao" && <VisaoGeral />}
          {section === "epidemio" && <Epidemiologia />}
          {section === "estab" && <Estabelecimentos />}
          {section === "demo" && <Demografia />}
        </div>
      </div>
    </div>
  );
}
