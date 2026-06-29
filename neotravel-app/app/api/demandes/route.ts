import { NextResponse } from "next/server";

interface DemandePayload {
  nomSociete: string;
  email: string;
  telephone: string;
  villeDepart: string;
  villeDestination: string;
  distanceKm: number;
  dateDepart: string;
  dateRetour: string;
  dateDemande: string;
  nombrePassagers: number;
  typeVehicule: string;
  typeTrajet: string;
  options: string[];
  urgence: string;
  commentaire?: string;
  statut: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DemandePayload;

    if (!payload.nomSociete || !payload.email || !payload.telephone) {
      return NextResponse.json(
        { error: "Champs client obligatoires manquants" },
        { status: 400 },
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_DEMANDES_TABLE_NAME ?? "Demandes";

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
      nomSociete: payload.nomSociete,
      email: payload.email,
      telephone: payload.telephone,
      villeDepart: payload.villeDepart,
      villeDestination: payload.villeDestination,
      distanceKm: payload.distanceKm,
      dateDepart: payload.dateDepart,
      dateRetour: payload.dateRetour,
      dateDemande: payload.dateDemande,
      nombrePassagers: payload.nombrePassagers,
      typeVehicule: payload.typeVehicule,
      typeTrajet: payload.typeTrajet,
      options: payload.options,
      urgence: payload.urgence,
      commentaire: payload.commentaire ?? "",
      statut: payload.statut,
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
        { error: details?.error?.message ?? "Erreur Airtable" },
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
