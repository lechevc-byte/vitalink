export const age = (ddn: string) =>
  Math.floor((Date.now() - new Date(ddn).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const signConsultation = async (
  consultationId: string,
  notes: string,
  rpps: string
) => {
  const data = JSON.stringify({
    id: consultationId,
    notes,
    medecin: rpps,
    ts: new Date().toISOString(),
  });
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return {
    hash: `sha256:${hashHex.slice(0, 12)}...${hashHex.slice(-4)}`,
    signe_le: new Date().toISOString(),
    signe_par: `Dr. (RPPS: ${rpps})`,
  };
};

export const exportDMP = (patient: {
  nss: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  groupe_sanguin: string | null;
  antecedents: unknown[];
  traitements: unknown[];
  consultations: unknown[];
  documents: unknown[];
}) => {
  const dmp = {
    version: "DMP-2.0",
    export_date: new Date().toISOString(),
    patient: {
      nss: patient.nss,
      nom: patient.nom,
      prenom: patient.prenom,
      ddn: patient.date_naissance,
      groupe_sanguin: patient.groupe_sanguin,
    },
    antecedents: patient.antecedents,
    traitements_actifs: (patient.traitements as { actif?: boolean }[]).filter(
      (t) => t.actif
    ),
    consultations: patient.consultations,
    documents: patient.documents,
  };
  const blob = new Blob([JSON.stringify(dmp, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DMP_${patient.nom}_${patient.prenom}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
