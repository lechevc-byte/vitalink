"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

function useInView(threshold = 0.2) {
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

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const { ref, visible } = useInView(0.5);
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

function Section({
  id, children, className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView(0.1);
  return (
    <section
      id={id}
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </section>
  );
}

/* ============================================================
   CABO VERDE MAP (from EtatView)
   ============================================================ */

function CaboVerdeMap() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <svg viewBox="0 0 600 420" className="w-full h-auto">
        <defs>
          <radialGradient id="glow-landing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="420" fill="#0A1120" rx="16" />
        <circle cx="300" cy="210" r="180" fill="url(#glow-landing)" />

        {/* Grid */}
        {[100, 200, 300, 400, 500].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={420} stroke="rgba(255,255,255,0.03)" />
        ))}
        {[100, 200, 300, 400].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={600} y2={y} stroke="rgba(255,255,255,0.03)" />
        ))}

        {/* Islands */}
        {ILHAS.map((ilha) => {
          const radius = ilha.consultas > 0 ? Math.max(8, Math.min(40, Math.sqrt(ilha.consultas) / 8)) : 6;
          const isHovered = hover === ilha.nome;
          return (
            <g
              key={ilha.nome}
              onMouseEnter={() => setHover(ilha.nome)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {ilha.consultas > 0 && (
                <circle
                  cx={ilha.x} cy={ilha.y} r={radius + 4}
                  fill="none" stroke={ilha.cor} strokeWidth="1"
                  opacity={isHovered ? 0.6 : 0.2}
                  style={{ transition: "all 0.3s" }}
                />
              )}
              <circle
                cx={ilha.x} cy={ilha.y}
                r={isHovered ? radius + 3 : radius}
                fill={ilha.cor}
                opacity={isHovered ? 0.9 : 0.7}
                style={{ transition: "all 0.3s" }}
              />
              <text
                x={ilha.x} y={ilha.y - radius - 8}
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

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-4">
        {[
          { color: "#3B82F6", label: "Boa cobertura" },
          { color: "#F59E0B", label: "Cobertura média" },
          { color: "#EF4444", label: "Cobertura crítica" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SOLUTION DIAGRAM SVG
   ============================================================ */

function SolutionDiagram() {
  const nodes = [
    { label: "Médicos", emoji: "\uD83E\uDE7A", x: 250, y: 40, color: "#3B82F6", desc: ["Processo clínico digital", "Resumos IA pós-consulta"] },
    { label: "Pacientes", emoji: "\uD83D\uDC64", x: 460, y: 150, color: "#10B981", desc: ["Acesso ao seu dossier", "Histórico completo"] },
    { label: "Estado / MSSS", emoji: "\uD83C\uDFDB\uFE0F", x: 250, y: 280, color: "#8B5CF6", desc: ["Dashboards em tempo real", "Epidemiologia nacional"] },
    { label: "Seguradoras", emoji: "\uD83D\uDD12", x: 40, y: 150, color: "#F59E0B", desc: ["Validação consultas", "Interoperabilidade"] },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <svg viewBox="0 0 500 320" className="w-full h-auto">
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dashed lines to center */}
        {nodes.map((n) => (
          <line
            key={n.label}
            x1={250} y1={160} x2={n.x} y2={n.y}
            stroke={n.color} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"
          />
        ))}

        {/* Center circle */}
        <circle cx="250" cy="160" r="50" fill="url(#center-glow)" stroke="#3B82F6" strokeWidth="2" opacity="0.6" />
        <circle cx="250" cy="160" r="36" fill="#0D1628" stroke="#3B82F6" strokeWidth="1.5" />
        <text x="250" y="155" textAnchor="middle" fill="#60A5FA" fontSize="11" fontWeight="700">Vita</text>
        <text x="250" y="170" textAnchor="middle" fill="#06B6D4" fontSize="11" fontWeight="700">Link</text>

        {/* Node circles */}
        {nodes.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="22" fill={`${n.color}20`} stroke={n.color} strokeWidth="1.5" />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="16">{n.emoji}</text>
          </g>
        ))}
      </svg>

      {/* Labels below */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {nodes.map((n) => (
          <div key={n.label} className="text-center">
            <div className="text-sm font-semibold mb-1" style={{ color: n.color }}>{n.label}</div>
            {n.desc.map((d) => (
              <div key={d} className="text-xs text-slate-400">{d}</div>
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
  const [mobileMenu, setMobileMenu] = useState(false);

  const scrollTo = useCallback((href: string) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0D1628", color: "#F1F5F9" }}>

      {/* ─── NAVBAR ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(13,22,40,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="text-lg font-bold">
              Vita<span style={{ color: "#60A5FA" }}>Link</span>
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="text-sm text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                {l.label}
              </button>
            ))}
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2 rounded-lg text-white no-underline"
              style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}
            >
              Demo
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden bg-transparent border-none text-white cursor-pointer p-2"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenu ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3" style={{ background: "rgba(13,22,40,0.98)" }}>
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="text-sm text-slate-300 text-left py-2 bg-transparent border-none cursor-pointer"
              >
                {l.label}
              </button>
            ))}
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white text-center no-underline"
              style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}
            >
              Demo
            </Link>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34D399" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          MVP ao vivo — Março 2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Processo Clínico Digital{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
            Soberano
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          A plataforma de saúde digital que unifica médicos, pacientes e Estado — concebida para Cabo Verde.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl text-white font-semibold text-base no-underline"
            style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 8px 32px rgba(59,130,246,0.3)" }}
          >
            Ver Demo
          </Link>
          <button
            onClick={() => scrollTo("#problema")}
            className="px-8 py-3.5 rounded-xl font-semibold text-base cursor-pointer bg-transparent"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#CBD5E1" }}
          >
            Saber Mais
          </button>
        </div>
      </section>

      {/* ─── O PROBLEMA ─── */}
      <Section id="problema" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            O sistema de saúde cabo-verdiano{" "}
            <span style={{ color: "#EF4444" }}>fragmentado</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              emoji: "\uD83C\uDFDD\uFE0F",
              stat: "10 ilhas",
              color: "#3B82F6",
              desc: "Um paciente do Fogo não consegue partilhar o seu processo com um médico em Praia",
            },
            {
              emoji: "\uD83D\uDCCB",
              stat: "80%",
              suffix: " dossiers papier",
              color: "#F59E0B",
              desc: "Processos clínicos ainda em papel — perdidos, ilegíveis, inacessíveis",
            },
            {
              emoji: "\u23F1\uFE0F",
              stat: "2h/dia",
              color: "#EF4444",
              desc: "Tempo perdido por médico em tarefas administrativas em vez de cuidar doentes",
            },
          ].map((item) => (
            <div
              key={item.stat}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-4xl mb-4">{item.emoji}</div>
              <div className="text-3xl font-extrabold mb-3" style={{ color: item.color }}>
                {item.stat}{item.suffix && <span className="text-lg font-semibold text-slate-400">{item.suffix}</span>}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── A SOLUÇÃO ─── */}
      <Section id="solucao" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            VitaLink{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              unifica tudo
            </span>
          </h2>
        </div>
        <SolutionDiagram />
      </Section>

      {/* ─── FUNCIONALIDADES ─── */}
      <Section id="funcionalidades" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo o que o sistema precisa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              emoji: "\uD83E\uDD16",
              title: "IA Clínica",
              color: "#8B5CF6",
              desc: "Resumos automáticos pós-consulta. O médico valida, a IA sugere.",
            },
            {
              emoji: "\uD83C\uDFDD\uFE0F",
              title: "Cobertura Nacional",
              color: "#3B82F6",
              desc: "Dashboard em tempo real par île. Alertas automáticos de sub-cobertura.",
            },
            {
              emoji: "\uD83D\uDD12",
              title: "Soberania dos Dados",
              color: "#10B981",
              desc: "100% dados alojados em Cabo Verde. RGPD by design.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-8 group"
              style={{
                background: `${f.color}08`,
                border: `1px solid ${f.color}20`,
                transition: "border-color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${f.color}50`;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${f.color}20`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── CARTE DES ÎLES ─── */}
      <Section id="mapa" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Cabo Verde em tempo real</h2>
          <p className="text-slate-400">Cada ilha monitorizada. Cada estabelecimento avaliado.</p>
        </div>
        <CaboVerdeMap />
      </Section>

      {/* ─── CHIFFRES CLÉS ─── */}
      <section className="py-20 px-6" style={{ background: "#131E35" }}>
        <div className="max-w-5xl mx-auto">
          <Section className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 100, suffix: "", label: "médicos piloto" },
              { value: 100000, suffix: "", label: "pacientes" },
              { value: 10, suffix: "", label: "ilhas cobertas" },
              { value: 3, prefix: "< ", suffix: "s", label: "resumo IA gerado" },
            ].map((k) => (
              <div key={k.label}>
                <div className="text-4xl sm:text-5xl font-extrabold mb-2" style={{ color: "#60A5FA" }}>
                  <Counter value={k.value} suffix={k.suffix} prefix={k.prefix || ""} />
                </div>
                <div className="text-sm text-slate-400">{k.label}</div>
              </div>
            ))}
          </Section>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <Section id="roadmap" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Roadmap</h2>
        </div>

        <div className="relative">
          {/* Horizontal line */}
          <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5" style={{ background: "rgba(255,255,255,0.08)" }} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "\u2705", quarter: "Q2 2026", label: "MVP lancé", sub: "Praia + Mindelo", color: "#10B981", active: true },
              { icon: "\uD83D\uDD35", quarter: "Q3 2026", label: "Extensão archipel", sub: "Todas as ilhas", color: "#3B82F6", active: false },
              { icon: "\u26AA", quarter: "Q4 2026", label: "Epidemiologia IA", sub: "Modelos preditivos", color: "#64748B", active: false },
              { icon: "\u26AA", quarter: "Q2 2027", label: "Soberania digital", sub: "Infraestrutura completa", color: "#64748B", active: false },
            ].map((step) => (
              <div key={step.quarter} className="text-center md:text-left">
                {/* Dot */}
                <div className="flex justify-center md:justify-start mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg relative z-10"
                    style={{
                      background: step.active ? `${step.color}20` : "rgba(255,255,255,0.04)",
                      border: `2px solid ${step.color}`,
                    }}
                  >
                    {step.icon}
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: step.color }}>
                  {step.quarter}
                </div>
                <div className="text-sm font-bold text-white mb-1">{step.label}</div>
                <div className="text-xs text-slate-400">{step.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg,#1E40AF,#3B82F6)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para transformar a saúde de Cabo Verde?
          </h2>
          <p className="text-lg text-blue-100 mb-10 opacity-80">
            Solicite uma demonstração ao Ministério da Saúde e Segurança Social
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-xl font-bold text-base no-underline"
            style={{ background: "#fff", color: "#1E40AF" }}
          >
            Solicitar Demo
          </Link>
          <div className="mt-6 text-sm text-blue-200 opacity-60">
            contacto@vitalink.cv
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-sm font-bold">
            Vita<span style={{ color: "#60A5FA" }}>Link</span>
          </span>
        </div>
        <div className="text-xs text-slate-500">
          © 2026 VitaLink · Cabo Verde
        </div>
      </footer>
    </div>
  );
}
