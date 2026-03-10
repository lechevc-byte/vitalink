"use client";

import { C, s, tag } from "@/lib/design";
import { fmtDate } from "@/lib/helpers";
import Icon from "./Icon";

const REMBOURSEMENTS = [
  { patient: "Lefebvre Sophie", date: "2025-11-12", acte: "Consultation généraliste", montant: 25.00, taux: "70%", rembourse: 17.50, statut: "Validé" },
  { patient: "Okonkwo James", date: "2025-10-05", acte: "Consultation + bilan", montant: 25.00, taux: "70%", rembourse: 17.50, statut: "Validé" },
  { patient: "Charpentier Marc", date: "2025-12-01", acte: "Visite prévention", montant: 25.00, taux: "70%", rembourse: 17.50, statut: "En attente" },
];

export default function MutuelleView() {
  return (
    <div style={s.col}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          Gestion des remboursements
        </h1>
        <p style={s.muted}>
          Mutuelle Cabo Verde · Accès lecture seule, autorisé par les assurés · Données anonymisées hors accord
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <div style={{ ...s.card, background: C.greenDim, borderColor: `${C.green}33` }}>
          <div style={s.label}>Remboursements validés</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.greenLight, marginTop: 6 }}>2</div>
          <div style={{ ...s.muted, marginTop: 2 }}>Ce mois-ci</div>
        </div>
        <div style={{ ...s.card, background: C.amberDim, borderColor: `${C.amber}33` }}>
          <div style={s.label}>En attente</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.amberLight, marginTop: 6 }}>1</div>
          <div style={{ ...s.muted, marginTop: 2 }}>Validation requise</div>
        </div>
        <div style={{ ...s.card, background: C.blueDim, borderColor: `${C.blue}33` }}>
          <div style={s.label}>Montant remboursé</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.blueLight, marginTop: 6 }}>35,00 €</div>
          <div style={{ ...s.muted, marginTop: 2 }}>Sur 75,00 € d&apos;actes</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ ...s.h2, marginBottom: 14 }}>Actes & remboursements</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Patient", "Date", "Acte", "Montant", "Taux", "Remboursé", "Statut"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REMBOURSEMENTS.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px", fontSize: 13, color: C.text, fontWeight: 600 }}>{r.patient}</td>
                <td style={{ padding: "12px", fontSize: 13, color: C.textMid }}>{fmtDate(r.date)}</td>
                <td style={{ padding: "12px", fontSize: 13, color: C.textMid }}>{r.acte}</td>
                <td style={{ padding: "12px", fontSize: 13, color: C.text, fontWeight: 600 }}>{r.montant.toFixed(2)} €</td>
                <td style={{ padding: "12px" }}><span style={tag("blue")}>{r.taux}</span></td>
                <td style={{ padding: "12px", fontSize: 13, color: C.greenLight, fontWeight: 600 }}>{r.rembourse.toFixed(2)} €</td>
                <td style={{ padding: "12px" }}><span style={tag(r.statut === "Validé" ? "green" : "amber")}>{r.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          ...s.card,
          background: C.amberDim,
          borderColor: `${C.amber}33`,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ color: C.amberLight, flexShrink: 0 }}>
          <Icon name="lock" size={18} />
        </div>
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.amberLight }}>Accès RGPD restreint.</strong> Les données
          médicales détaillées (notes cliniques, résumés IA) ne sont pas accessibles aux
          mutuelles. Seuls les actes facturés et montants remboursables sont partagés, sur
          autorisation explicite de l&apos;assuré.
        </div>
      </div>
    </div>
  );
}
