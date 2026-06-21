import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";

// Le middleware ne gate PAS /api/admin/* (il rafraîchit juste la session) :
// cette route DOIT vérifier l'admin elle-même, sinon fuite des contacts.
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminServiceClient();
  const { data, error } = await db
    .from("pro_survey_responses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return new NextResponse("Erreur lors de l'export", { status: 500 });
  }

  const cols = [
    "created_at", "metier", "taille", "departement", "taches_chrono",
    "heures_admin", "corvee_libre", "outils_actuels", "outils_detail",
    "outils_essayes", "prenom", "contact", "consent", "source",
  ];
  const headers = [
    "Date", "Métier", "Taille", "Département", "Tâches chronophages",
    "Heures admin", "Corvée à supprimer", "Outils actuels", "Outils (détail)",
    "Outils essayés", "Prénom", "Contact", "Consentement", "Source",
  ];

  const esc = (v: unknown): string => {
    let s: string;
    if (v == null) s = "";
    else if (typeof v === "boolean") s = v ? "oui" : "non";
    else if (Array.isArray(v)) s = v.join(" | ");
    else s = String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = (data || []).map((r: Record<string, unknown>) =>
    cols
      .map((c) => (c === "created_at" ? esc(new Date(r[c] as string).toLocaleString("fr-FR")) : esc(r[c])))
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv;charset=utf-8" },
  });
}
