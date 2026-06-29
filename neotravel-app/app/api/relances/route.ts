import { NextResponse } from "next/server";

interface RelancePayload {
  devisLie: string;
  numeroRelance: number;
  datePlanifiee: string;
  statut: string;
  reponseProspect?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RelancePayload;

    if (!payload.devisLie) {
      return NextResponse.json(
        { error: "Le devis lie est obligatoire" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(payload.numeroRelance) || payload.numeroRelance <= 0) {
      return NextResponse.json(
        { error: "Numero de relance invalide" },
        { status: 400 },
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_RELANCES_TABLE_NAME ?? "Relances";

    if (!apiKey || !baseId) {
      return NextResponse.json(
        {
          error:
            "Configuration Airtable manquante (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)",
        },
        { status: 500 },
      );
    }

    const fields = {
      devisLie: [payload.devisLie],
      numeroRelance: payload.numeroRelance,
      datePlanifiee: payload.datePlanifiee,
      statut: payload.statut,
      reponseProspect: payload.reponseProspect ?? "",
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
        { error: details?.error?.message ?? "Erreur Airtable (table Relances)" },
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
