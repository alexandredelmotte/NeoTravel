import { NextResponse } from "next/server";
import type { CalculDevisDetail, CalculerDevisInput } from "@/app/lib/devis-types";

interface TarificationRow {
  typeCoefficient: string;
  nom: string;
  valeur: string;
  condition: string;
  km: number | null;
}

function arrondir2(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseValeur(valeur: string): number {
  const match = valeur.match(/[-+]?\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  const number = Number(match[0].replace(",", "."));
  return valeur.includes("%") ? number / 100 : number;
}

function monthFromDate(dateDepart: Date | string): number {
  const date = dateDepart instanceof Date ? dateDepart : new Date(dateDepart);
  if (Number.isNaN(date.getTime())) throw new Error("dateDepart invalide");
  return date.getMonth() + 1;
}

function monthMatches(condition: string, month: number): boolean {
  const c = normalize(condition);
  const map: Record<string, number> = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
  };
  return Object.entries(map).some(([name, num]) => c.includes(name) && num === month);
}

function capaciteMatches(condition: string, passagers: number): boolean {
  const normalized = normalize(condition)
    .replace(/a et/g, "et")
    .replace(/à et/g, "et");

  const parts = normalized.split("et").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return false;

  return parts.every((part) => {
    const le = part.match(/<=\s*(\d+)/);
    if (le) return passagers <= Number(le[1]);

    const ge = part.match(/>=\s*(\d+)/);
    if (ge) return passagers >= Number(ge[1]);

    const lt = part.match(/<\s*(\d+)/);
    if (lt) return passagers < Number(lt[1]);

    const gt = part.match(/>\s*(\d+)/);
    if (gt) return passagers > Number(gt[1]);

    const eq = part.match(/^=?\s*(\d+)$/);
    if (eq) return passagers === Number(eq[1]);

    return false;
  });
}

function findCoefficientSaisonnalite(rules: TarificationRow[], mois: number): number {
  const row = rules.find(
    (rule) => normalize(rule.typeCoefficient).includes("saisonn") && monthMatches(rule.condition, mois),
  );
  return row ? parseValeur(row.valeur) : 0;
}

function findCoefficientDateDemande(rules: TarificationRow[], codeDateDemande: string): number {
  const code = normalize(codeDateDemande);
  const row = rules.find((rule) => {
    if (!normalize(rule.typeCoefficient).includes("date")) return false;
    return normalize(rule.condition).includes(code) || normalize(rule.nom).includes(code);
  });
  return row ? parseValeur(row.valeur) : 0;
}

function findCoefficientCapacite(rules: TarificationRow[], nombrePassagers: number): number {
  const row = rules.find(
    (rule) => normalize(rule.typeCoefficient).includes("capac") && capaciteMatches(rule.condition, nombrePassagers),
  );
  return row ? parseValeur(row.valeur) : 0;
}

function findSupplementValue(rules: TarificationRow[], keyword: string): number {
  const row = rules.find((rule) => {
    const t = normalize(rule.typeCoefficient);
    const n = normalize(rule.nom);
    return (t.includes("supp") || t.includes("option")) && n.includes(normalize(keyword));
  });
  return row ? parseValeur(row.valeur) : 0;
}

function findRateValue(rules: TarificationRow[], keyword: string): number {
  const row = rules.find((rule) => normalize(rule.nom).includes(normalize(keyword)));
  return row ? parseValeur(row.valeur) : 0;
}

function parseKm(condition: string, nom: string): number | null {
  const raw = `${condition} ${nom}`;
  const match = raw.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function findPrixBaseByKm(rules: TarificationRow[], distanceKm: number, fallback: number): number {
  const kmRules = rules
    .filter((rule) => normalize(rule.typeCoefficient).includes("forfaitkm"))
    .map((rule) => {
      const km = rule.km ?? parseKm(rule.condition, rule.nom);
      return { ...rule, parsedKm: km };
    })
    .filter((rule) => rule.parsedKm !== null)
    .sort((a, b) => Number(a.parsedKm) - Number(b.parsedKm));

  if (distanceKm <= 0 || kmRules.length === 0) return fallback;

  const maxKm = Number(kmRules[kmRules.length - 1].parsedKm);
  if (distanceKm <= maxKm) {
    const band = kmRules.find((rule) => distanceKm <= Number(rule.parsedKm));
    return band ? parseValeur(band.valeur) : fallback;
  }

  const depassement = rules.find(
    (rule) => normalize(rule.typeCoefficient).includes("forfaitkmdepassement"),
  );
  const prixParKm = depassement ? parseValeur(depassement.valeur) : 2.5;

  // Regle fournie: au-dela de 180km => (KM x 2) x 2,5 EUR
  return distanceKm * 2 * prixParKm;
}

async function fetchTarificationRules(
  apiKey: string,
  baseId: string,
  tableName: string,
): Promise<TarificationRow[]> {
  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const response = await fetch(`${endpoint}?maxRecords=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const details = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(details?.error?.message ?? "Erreur Airtable (table Tarification)");
  }

  const body = (await response.json()) as {
    records?: Array<{
      fields: Record<string, unknown>;
    }>;
  };

  return (body.records ?? []).map((record) => {
    const fields = record.fields;
    return {
      typeCoefficient: String(fields["Type coefficient"] ?? fields.typeCoefficient ?? ""),
      nom: String(fields.Nom ?? fields.nom ?? ""),
      valeur: String(fields.Valeur ?? fields.valeur ?? ""),
      condition: String(fields.Condition ?? fields.condition ?? ""),
      km:
        typeof fields.km === "number"
          ? fields.km
          : typeof fields.KM === "number"
            ? fields.KM
            : null,
    };
  });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CalculerDevisInput;

    if (input.prixBase < 0 || input.nombrePassagers <= 0) {
      return NextResponse.json({ error: "Entrees de calcul invalides" }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TARIFICATION_TABLE_NAME ?? "Tarification";

    if (!apiKey || !baseId) {
      return NextResponse.json(
        { error: "Configuration Airtable manquante (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)" },
        { status: 500 },
      );
    }

    const rules = await fetchTarificationRules(apiKey, baseId, tableName);

    const mois = monthFromDate(input.dateDepart);
    const coefficientSaisonnalite = findCoefficientSaisonnalite(rules, mois);
    const coefficientDateDemande = findCoefficientDateDemande(rules, input.codeDateDemande);
    const coefficientCapacite = findCoefficientCapacite(rules, input.nombrePassagers);

    const totalCoefficients =
      coefficientSaisonnalite + coefficientDateDemande + coefficientCapacite;

    const prixBaseTarif = findPrixBaseByKm(
      rules,
      input.distanceKm ?? 0,
      input.prixBase,
    );

    const montantAjuste = prixBaseTarif * (1 + totalCoefficients);

    const tarifGuideParJour = findSupplementValue(rules, "guide");
    const tarifNuitChauffeur = findSupplementValue(rules, "nuit chauffeur");
    const tauxMarge = findRateValue(rules, "marge");
    const tauxTva = findRateValue(rules, "tva");

    const supplements =
      (input.nombreJoursGuide ?? 0) * tarifGuideParJour +
      (input.nombreNuitsChauffeur ?? 0) * tarifNuitChauffeur +
      (input.forfaitPeages ?? 0);

    const sousTotalHt = montantAjuste + supplements;
    const margeCommerciale = sousTotalHt * tauxMarge;
    const totalApresMargeHt = sousTotalHt + margeCommerciale;
    const tva = totalApresMargeHt * tauxTva;
    const prixFinalTtc = totalApresMargeHt + tva;

    const detail: CalculDevisDetail = {
      prixBase: arrondir2(prixBaseTarif),
      coefficientSaisonnalite,
      coefficientDateDemande,
      coefficientCapacite,
      totalCoefficients,
      montantAjuste: arrondir2(montantAjuste),
      supplements: arrondir2(supplements),
      sousTotalHt: arrondir2(sousTotalHt),
      margeCommerciale: arrondir2(margeCommerciale),
      totalApresMargeHt: arrondir2(totalApresMargeHt),
      tva: arrondir2(tva),
      prixFinalTtc: arrondir2(prixFinalTtc),
    };

    return NextResponse.json({ detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de calcul";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
