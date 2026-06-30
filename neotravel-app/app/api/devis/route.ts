import { NextResponse } from "next/server";

export type CodeDateDemande =
  | "DD_PRIORITAIRE"
  | "DD_URGENT"
  | "DD_NORMAL"
  | "DD_3MOISETPLUS";

export interface CalculerDevisInput {
  prixBase: number;
  distanceKm?: number;
  dateDepart: Date | string;
  codeDateDemande: CodeDateDemande;
  nombrePassagers: number;
  nombreJoursGuide?: number;
  nombreNuitsChauffeur?: number;
  forfaitPeages?: number;
}

export interface CalculDevisDetail {
  prixBase: number;
  coefficientSaisonnalite: number;
  coefficientDateDemande: number;
  coefficientCapacite: number;
  totalCoefficients: number;
  montantAjuste: number;
  supplements: number;
  sousTotalHt: number;
  margeCommerciale: number;
  totalApresMargeHt: number;
  tva: number;
  prixFinalTtc: number;
}

interface DevisPayload {
  demandeLiee?: string;
  prixHt: number;
  tva10: number;
  prixTtc: number;
  detailCalcul: string;
  statut: string;
  dateEnvoi: string;
  prochaineRelance: string;
  pdfUrl?: string;
  pdfFileName?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DevisPayload;

    if (
      !Number.isFinite(payload.prixHt) ||
      !Number.isFinite(payload.tva10) ||
      !Number.isFinite(payload.prixTtc)
    ) {
      return NextResponse.json(
        { error: "Montants devis invalides" },
        { status: 400 },
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_DEVIS_TABLE_NAME ?? "Devis";

    if (!apiKey || !baseId) {
      return NextResponse.json(
        {
          error:
            "Configuration Airtable manquante (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)",
        },
        { status: 500 },
      );
    }

    const fields: Record<string, unknown> = {
      demandeLiee: payload.demandeLiee ?? "",
      prixHt: payload.prixHt,
      tva10: payload.tva10,
      prixTtc: payload.prixTtc,
      detailCalcul: payload.detailCalcul,
      statut: payload.statut,
      dateEnvoi: payload.dateEnvoi,
      prochaineRelance: payload.prochaineRelance,
      pdfUrl: payload.pdfUrl,
      pdfFileName: payload.pdfFileName,
    };

    const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const airtableResponse = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ records: [{ fields }] }),
    });

    if (!airtableResponse.ok) {
      const details = (await airtableResponse.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      return NextResponse.json(
        { error: details?.error?.message ?? "Erreur Airtable (table Devis)" },
        { status: airtableResponse.status },
      );
    }

    const body = (await airtableResponse.json()) as {
      records?: Array<{ id: string }>;
    };

    return NextResponse.json({ id: body.records?.[0]?.id ?? null });
  } catch {
    return NextResponse.json(
      { error: "Corps de requete invalide" },
      { status: 400 },
    );
  }
}
