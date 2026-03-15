"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import Link from "next/link";

/* ============================================================
   CONSTANTS
   ============================================================ */

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

const NAV_LINKS = [
  { label: "Solução", href: "#solucao" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Roadmap", href: "#roadmap" },
];

const BG = "#0D1628";
const TEXT = "#F1F5F9";
const TEXT_MID = "#CBD5E1";
const TEXT_MUTED = "#94A3B8";
const BLUE = "#3B82F6";
const BLUE_LIGHT = "#60A5FA";
const CYAN = "#06B6D4";
const GREEN = "#10B981";
const GREEN_LIGHT = "#34D399";
const PURPLE = "#8B5CF6";
const AMBER = "#F59E0B";
const RED = "#EF4444";

/* ============================================================
   HOOKS
   ============================================================ */

function useScrolledNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const { ref, visible } = useInView(0.4);
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [visible, value]);

  return (
    <span ref={ref}>
      {prefix}{visible ? display.toLocaleString() : "0"}{suffix}
    </span>
  );
}

/* ============================================================
   SECTION WRAPPER (fade-in on scroll)
   ============================================================ */

function FadeSection({
  id, children, style = {},
}: {
  id?: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  const { ref, visible } = useInView(0.08);
  return (
    <section
      id={id}
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/* ============================================================
   HEART ICON
   ============================================================ */

function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ============================================================
   CABO VERDE MAP
   ============================================================ */

function CaboVerdeMap() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 640, margin: "0 auto" }}>
      <svg viewBox="0 0 600 420" style={{ width: "100%", height: "auto" }}>
        <defs>
          <radialGradient id="glow-landing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.1" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="420" fill="#0A1120" rx="16" />
        <circle cx="300" cy="210" r="180" fill="url(#glow-landing)" />
        {[100, 200, 300, 400, 500].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={420} stroke="rgba(255,255,255,0.03)" />
        ))}
        {[100, 200, 300, 400].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={600} y2={y} stroke="rgba(255,255,255,0.03)" />
        ))}
        {ILHAS.map((ilha) => {
          const radius = ilha.consultas > 0 ? Math.max(8, Math.min(40, Math.sqrt(ilha.consultas) / 8)) : 6;
          const isHovered = hover === ilha.nome;
          return (
            <g key={ilha.nome} onMouseEnter={() => setHover(ilha.nome)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              {ilha.consultas > 0 && (
                <circle cx={ilha.x} cy={ilha.y} r={radius + 4} fill="none" stroke={ilha.cor} strokeWidth="1" opacity={isHovered ? 0.6 : 0.2} style={{ transition: "all 0.3s" }} />
              )}
              <circle cx={ilha.x} cy={ilha.y} r={isHovered ? radius + 3 : radius} fill={ilha.cor} opacity={isHovered ? 0.9 : 0.7} style={{ transition: "all 0.3s" }} />
              <text x={ilha.x} y={ilha.y - radius - 8} textAnchor="middle" fill={isHovered ? TEXT : TEXT_MUTED} fontSize={isHovered ? 12 : 10} fontWeight={isHovered ? 700 : 500} style={{ transition: "all 0.3s" }}>
                {ilha.nome}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
        {[
          { color: BLUE, label: "Boa cobertura" },
          { color: AMBER, label: "Cobertura média" },
          { color: RED, label: "Cobertura crítica" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_MUTED }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SOLUTION DIAGRAM
   ============================================================ */

function SolutionDiagram() {
  const isMobile = useIsMobile();
  const nodes = [
    { label: "Médicos", emoji: "\uD83E\uDE7A", x: 250, y: 40, color: BLUE, desc: ["Processo clínico digital", "Resumos IA pós-consulta"] },
    { label: "Pacientes", emoji: "\uD83D\uDC64", x: 460, y: 160, color: GREEN, desc: ["Acesso ao seu dossier", "Histórico completo"] },
    { label: "Estado / MSSS", emoji: "\uD83C\uDFDB\uFE0F", x: 250, y: 280, color: PURPLE, desc: ["Dashboards em tempo real", "Epidemiologia nacional"] },
    { label: "Seguradoras", emoji: "\uD83D\uDD12", x: 40, y: 160, color: AMBER, desc: ["Validação consultas", "Interoperabilidade"] },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 540, margin: "0 auto" }}>
      <svg viewBox="0 0 500 320" style={{ width: "100%", height: "auto" }}>
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.15" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </radialGradient>
        </defs>
        {nodes.map((n) => (
          <line key={n.label} x1={250} y1={160} x2={n.x} y2={n.y} stroke={n.color} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
        ))}
        <circle cx="250" cy="160" r="50" fill="url(#center-glow)" stroke={BLUE} strokeWidth="2" opacity="0.6" />
        <circle cx="250" cy="160" r="36" fill={BG} stroke={BLUE} strokeWidth="1.5" />
        <text x="250" y="155" textAnchor="middle" fill={BLUE_LIGHT} fontSize="12" fontWeight="700">Vita</text>
        <text x="250" y="172" textAnchor="middle" fill={CYAN} fontSize="12" fontWeight="700">Link</text>
        {nodes.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="24" fill={`${n.color}20`} stroke={n.color} strokeWidth="1.5" />
            <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="18">{n.emoji}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
        {nodes.map((n) => (
          <div key={n.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: n.color, marginBottom: 4 }}>{n.label}</div>
            {n.desc.map((d) => (
              <div key={d} style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5 }}>{d}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function HomePage() {
  const scrolled = useScrolledNav();
  const isMobile = useIsMobile();
  const [mobileMenu, setMobileMenu] = useState(false);

  const scrollTo = useCallback((href: string) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── shared styles ── */
  const container: CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" };
  const sectionPad: CSSProperties = { padding: isMobile ? "60px 0" : "100px 0" };
  const heading: CSSProperties = { fontSize: isMobile ? 28 : 40, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.2 };
  const subheading: CSSProperties = { fontSize: 15, color: TEXT_MUTED, marginTop: 8 };
  const gradientText: CSSProperties = { backgroundImage: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
  const btnPrimary: CSSProperties = { display: "inline-block", padding: "14px 32px", borderRadius: 12, background: `linear-gradient(135deg, ${BLUE}, #2563EB)`, color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(59,130,246,0.3)" };
  const btnOutline: CSSProperties = { display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "transparent", color: TEXT_MID, fontWeight: 600, fontSize: 15, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" };
  const card: CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: isMobile ? 24 : 32 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(13,22,40,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeartIcon size={18} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              Vita<span style={{ color: BLUE_LIGHT }}>Link</span>
            </span>
          </div>

          {/* Desktop */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {NAV_LINKS.map((l) => (
                <button key={l.href} onClick={() => scrollTo(l.href)} style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
                >
                  {l.label}
                </button>
              ))}
              <Link href="/login" style={{ padding: "8px 20px", borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, #2563EB)`, color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                Demo
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenu ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {mobileMenu && isMobile && (
          <div style={{ padding: "8px 20px 20px", background: "rgba(13,22,40,0.98)", display: "flex", flexDirection: "column", gap: 12 }}>
            {NAV_LINKS.map((l) => (
              <button key={l.href} onClick={() => scrollTo(l.href)} style={{ background: "none", border: "none", color: TEXT_MID, fontSize: 14, textAlign: "left", cursor: "pointer", padding: "8px 0", fontFamily: "inherit" }}>
                {l.label}
              </button>
            ))}
            <Link href="/login" style={{ padding: "10px 20px", borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, #2563EB)`, color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", textAlign: "center" }}>
              Demo
            </Link>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ ...sectionPad, paddingTop: isMobile ? 120 : 160, textAlign: "center" }}>
        <div style={container}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 50, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN_LIGHT, animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: GREEN_LIGHT }}>MVP ao vivo — Março 2026</span>
          </div>

          <h1 style={{ ...heading, fontSize: isMobile ? 32 : 56, marginBottom: 20, maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
            Processo Clínico Digital{" "}
            <span style={gradientText}>Soberano</span>
          </h1>

          <p style={{ fontSize: isMobile ? 16 : 20, color: TEXT_MUTED, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
            A plataforma de saúde digital que unifica médicos, pacientes e Estado — concebida para Cabo Verde.
          </p>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, justifyContent: "center", alignItems: "center" }}>
            <Link href="/login" style={btnPrimary}>Ver Demo</Link>
            <button onClick={() => scrollTo("#problema")} style={btnOutline}>Saber Mais</button>
          </div>
        </div>
      </section>

      {/* ─── O PROBLEMA ─── */}
      <FadeSection id="problema" style={sectionPad}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={heading}>
              O sistema de saúde cabo-verdiano{" "}
              <span style={{ color: RED }}>fragmentado</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
            {[
              { emoji: "\uD83C\uDFDD\uFE0F", stat: "10 ilhas", color: BLUE, desc: "Um paciente do Fogo não consegue partilhar o seu processo com um médico em Praia" },
              { emoji: "\uD83D\uDCCB", stat: "80%", suffix: " dossiers papier", color: AMBER, desc: "Processos clínicos ainda em papel — perdidos, ilegíveis, inacessíveis" },
              { emoji: "\u23F1\uFE0F", stat: "2h/dia", color: RED, desc: "Tempo perdido por médico em tarefas administrativas em vez de cuidar doentes" },
            ].map((item) => (
              <div key={item.stat} style={{ ...card, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.emoji}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: item.color, marginBottom: 12 }}>
                  {item.stat}
                  {item.suffix && <span style={{ fontSize: 16, fontWeight: 600, color: TEXT_MUTED }}>{item.suffix}</span>}
                </div>
                <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ─── A SOLUÇÃO ─── */}
      <FadeSection id="solucao" style={sectionPad}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={heading}>VitaLink <span style={gradientText}>unifica tudo</span></h2>
          </div>
          <SolutionDiagram />
        </div>
      </FadeSection>

      {/* ─── FUNCIONALIDADES ─── */}
      <FadeSection id="funcionalidades" style={sectionPad}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={heading}>Tudo o que o sistema precisa</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
            {[
              { emoji: "\uD83E\uDD16", title: "IA Clínica", color: PURPLE, desc: "Resumos automáticos pós-consulta. O médico valida, a IA sugere." },
              { emoji: "\uD83C\uDFDD\uFE0F", title: "Cobertura Nacional", color: BLUE, desc: "Dashboard em tempo real par île. Alertas automáticos de sub-cobertura." },
              { emoji: "\uD83D\uDD12", title: "Soberania dos Dados", color: GREEN, desc: "100% dados alojados em Cabo Verde. RGPD by design." },
            ].map((f) => (
              <div
                key={f.title}
                style={{ ...card, background: `${f.color}08`, borderColor: `${f.color}20`, transition: "border-color 0.3s, transform 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${f.color}50`; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${f.color}20`; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ─── CARTE DES ÎLES ─── */}
      <FadeSection id="mapa" style={sectionPad}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={heading}>Cabo Verde em tempo real</h2>
            <p style={subheading}>Cada ilha monitorizada. Cada estabelecimento avaliado.</p>
          </div>
          <CaboVerdeMap />
        </div>
      </FadeSection>

      {/* ─── CHIFFRES CLÉS ─── */}
      <section style={{ background: "#131E35", ...sectionPad }}>
        <div style={container}>
          <FadeSection style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 32 : 40, textAlign: "center" }}>
            {[
              { value: 100, suffix: "", prefix: "", label: "médicos piloto" },
              { value: 100000, suffix: "", prefix: "", label: "pacientes" },
              { value: 10, suffix: "", prefix: "", label: "ilhas cobertas" },
              { value: 3, prefix: "< ", suffix: "s", label: "resumo IA gerado" },
            ].map((k) => (
              <div key={k.label}>
                <div style={{ fontSize: isMobile ? 36 : 48, fontWeight: 800, color: BLUE_LIGHT, marginBottom: 8 }}>
                  <Counter value={k.value} suffix={k.suffix} prefix={k.prefix} />
                </div>
                <div style={{ fontSize: 14, color: TEXT_MUTED }}>{k.label}</div>
              </div>
            ))}
          </FadeSection>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <FadeSection id="roadmap" style={sectionPad}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={heading}>Roadmap</h2>
          </div>

          <div style={{ position: "relative" }}>
            {/* Horizontal line (desktop) */}
            {!isMobile && (
              <div style={{ position: "absolute", top: 24, left: 24, right: 24, height: 2, background: "rgba(255,255,255,0.06)", zIndex: 0 }} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: isMobile ? 24 : 32 }}>
              {[
                { icon: "\u2705", quarter: "Q2 2026", label: "MVP lancé", sub: "Praia + Mindelo", color: GREEN, active: true },
                { icon: "\uD83D\uDD35", quarter: "Q3 2026", label: "Extensão archipel", sub: "Todas as ilhas", color: BLUE, active: false },
                { icon: "\u26AA", quarter: "Q4 2026", label: "Epidemiologia IA", sub: "Modelos preditivos", color: "#64748B", active: false },
                { icon: "\u26AA", quarter: "Q2 2027", label: "Soberania digital", sub: "Infraestrutura completa", color: "#64748B", active: false },
              ].map((step) => (
                <div key={step.quarter} style={{ textAlign: isMobile ? "left" : "center", display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: step.active ? `${step.color}20` : "rgba(255,255,255,0.04)",
                    border: `2px solid ${step.color}`, position: "relative", zIndex: 1, flexShrink: 0,
                    marginBottom: isMobile ? 0 : 16,
                  }}>
                    {step.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: step.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {step.quarter}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: TEXT_MUTED }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ─── CTA FINAL ─── */}
      <section style={{ padding: isMobile ? "60px 0" : "100px 0", background: "linear-gradient(135deg, #1E40AF, #3B82F6)" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <h2 style={{ ...heading, fontSize: isMobile ? 26 : 38, marginBottom: 16, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Pronto para transformar a saúde de Cabo Verde?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 40, margin: "0 auto 40px", maxWidth: 500 }}>
            Solicite uma demonstração ao Ministério da Saúde e Segurança Social
          </p>
          <Link href="/login" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 12, background: "#fff", color: "#1E40AF", fontWeight: 800, fontSize: 16, textDecoration: "none" }}>
            Solicitar Demo
          </Link>
          <div style={{ marginTop: 24, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            contacto@vitalink.cv
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartIcon size={14} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800 }}>
            Vita<span style={{ color: BLUE_LIGHT }}>Link</span>
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#475569" }}>
          © 2026 VitaLink · Cabo Verde
        </div>
      </footer>
    </div>
  );
}
