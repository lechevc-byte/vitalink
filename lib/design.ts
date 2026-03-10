export const C = {
  bg: "#080D1A",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  blueDim: "rgba(59,130,246,0.12)",
  green: "#10B981",
  greenLight: "#34D399",
  greenDim: "rgba(16,185,129,0.1)",
  amber: "#F59E0B",
  amberLight: "#FCD34D",
  amberDim: "rgba(245,158,11,0.1)",
  red: "#EF4444",
  redLight: "#F87171",
  redDim: "rgba(239,68,68,0.1)",
  purple: "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDim: "rgba(139,92,246,0.1)",
  cyan: "#06B6D4",
  text: "#F1F5F9",
  textMid: "#CBD5E1",
  textMuted: "#64748B",
};

export const s = {
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 20,
  } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, color: C.text, margin: 0 } as React.CSSProperties,
  h3: { fontSize: 13, fontWeight: 600, color: C.textMid, marginBottom: 10 } as React.CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  } as React.CSSProperties,
  muted: { fontSize: 13, color: C.textMuted } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
  col: { display: "flex", flexDirection: "column" as const, gap: 12 } as React.CSSProperties,
};

export const tag = (color: string): React.CSSProperties => {
  const map: Record<string, [string, string]> = {
    blue: [C.blueDim, C.blueLight],
    green: [C.greenDim, C.greenLight],
    amber: [C.amberDim, C.amberLight],
    red: [C.redDim, C.redLight],
    purple: [C.purpleDim, C.purpleLight],
    gray: ["rgba(100,116,139,0.15)", "#94A3B8"],
  };
  const [bg, tc] = map[color] || map.gray;
  return {
    padding: "3px 8px",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    background: bg,
    color: tc,
    display: "inline-block",
  };
};

export const btn = (variant = "primary"): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: "9px 16px",
    borderRadius: 9,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  };
  if (variant === "primary")
    return { ...base, background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff" };
  if (variant === "ghost")
    return { ...base, background: "transparent", color: C.textMuted };
  if (variant === "outline")
    return { ...base, background: "transparent", border: `1px solid ${C.border}`, color: C.textMid };
  if (variant === "danger")
    return { ...base, background: C.redDim, color: C.redLight };
  if (variant === "success")
    return { ...base, background: C.greenDim, color: C.greenLight };
  return base;
};

export const avatar = (size: number): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: size / 2.8,
  fontWeight: 700,
  color: "#fff",
  flexShrink: 0,
});
