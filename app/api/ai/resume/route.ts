import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

export async function POST(request: NextRequest) {
  try {
    const { consultationId, patientId } = await request.json();

    if (!consultationId || !patientId) {
      return NextResponse.json(
        { error: "consultationId et patientId requis" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch consultation and patient data
    const [consultRes, patientRes] = await Promise.all([
      supabase.from("consultations").select("*").eq("id", consultationId).single(),
      supabase.from("patients").select("*").eq("id", patientId).single(),
    ]);

    if (consultRes.error || patientRes.error) {
      return NextResponse.json(
        { error: "Consultation ou patient introuvable" },
        { status: 404 }
      );
    }

    const consultation = consultRes.data;
    const patient = patientRes.data;

    const constantes = consultation.constantes || {};
    const prescriptions = (consultation.prescriptions || []).join(", ");
    const antecedents = (patient.antecedents || [])
      .map((a: { libelle: string }) => a.libelle)
      .join(", ");

    // Simulate AI processing delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate simulated AI summary based on real patient data
    const resume = `**Motif :** ${consultation.motif}
**Bilan clinique :** ${constantes.ta ? `TA ${constantes.ta}` : ""}${constantes.fc ? `, FC ${constantes.fc} bpm` : ""}${constantes.spo2 ? `, SpO2 ${constantes.spo2}` : ""}${constantes.temp ? `, T° ${constantes.temp}` : ""}. ${consultation.notes_cliniques || "Examen sans particularité"}. Antécédents notables : ${antecedents || "aucun"}.
**Décision :** ${prescriptions || "Pas de prescription spécifique"}. Poursuite du suivi habituel.
**Suivi :** Réévaluation recommandée dans 3 à 6 mois. Consultation anticipée si aggravation des symptômes.`;

    // Store resume in consultation
    await supabase
      .from("consultations")
      .update({ resume_ia: resume })
      .eq("id", consultationId);

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("AI resume error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du résumé" },
      { status: 500 }
    );
  }
}
