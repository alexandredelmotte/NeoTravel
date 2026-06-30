"use client";

import { FormEvent, useState } from "react";
import type { CalculDevisDetail, CalculerDevisInput } from "../lib/devis-types";

type CodeDateDemande =
  | "DD_PRIORITAIRE"
  | "DD_URGENT"
  | "DD_NORMAL"
  | "DD_3MOISETPLUS";

interface FormData {
  nomSociete: string;
  email: string;
  telephone: string;
  villeDepart: string;
  villeDestination: string;
  distanceKm: string;
  prixBase: string;
  dateDepart: string;
  dateRetour: string;
  dateDemande: string;
  codeDateDemande: CodeDateDemande;
  nombrePassagers: string;
  typeVehicule: string;
  typeTrajet: string;
  options: string[];
  nombreJoursGuide: string;
  nombreNuitsChauffeur: string;
  forfaitPeages: string;
  commentaire: string;
  statut: string;
}

interface DevisRow {
  idDevis: string;
  demandeLiee: string;
  prixHt: number;
  tva: number;
  prixTtc: number;
  detailCalcul: string;
  pdfUrl: string;
  pdfFileName: string;
  statut: string;
  dateEnvoi: string;
  prochaineRelance: string;
}

interface RelanceRow {
  idRelance: string;
  devisLie: string;
  numeroRelance: number;
  datePlanifiee: string;
  statut: string;
  reponseProspect: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_FORM: FormData = {
  nomSociete: "",
  email: "",
  telephone: "",
  villeDepart: "",
  villeDestination: "",
  distanceKm: "0",
  prixBase: "1000",
  dateDepart: TODAY,
  dateRetour: TODAY,
  dateDemande: TODAY,
  codeDateDemande: "DD_NORMAL",
  nombrePassagers: "40",
  typeVehicule: "Autocar",
  typeTrajet: "Aller-retour",
  options: [],
  nombreJoursGuide: "0",
  nombreNuitsChauffeur: "0",
  forfaitPeages: "0",
  commentaire: "",
  statut: "Nouveau",
};

export default function DevisPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [resultatTtc, setResultatTtc] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [demandeId, setDemandeId] = useState<string>("");
  const [devisRows, setDevisRows] = useState<DevisRow[]>([]);
  const [relancesRows, setRelancesRows] = useState<RelanceRow[]>([]);
  const [relanceDevisLie, setRelanceDevisLie] = useState<string>("");
  const [relanceDatePlanifiee, setRelanceDatePlanifiee] = useState<string>(TODAY);
  const [relanceStatut, setRelanceStatut] = useState<string>("A planifier");
  const [relanceReponseProspect, setRelanceReponseProspect] = useState<string>("");

  function getInputFromForm(): CalculerDevisInput {
    return {
      prixBase: Number(form.prixBase),
      distanceKm: Number(form.distanceKm),
      dateDepart: form.dateDepart,
      codeDateDemande: form.codeDateDemande,
      nombrePassagers: Number(form.nombrePassagers),
      nombreJoursGuide: Number(form.nombreJoursGuide),
      nombreNuitsChauffeur: Number(form.nombreNuitsChauffeur),
      forfaitPeages: Number(form.forfaitPeages),
    };
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleOption(option: string) {
    setForm((prev) => {
      const has = prev.options.includes(option);
      return {
        ...prev,
        options: has
          ? prev.options.filter((item) => item !== option)
          : [...prev.options, option],
      };
    });
  }

  function getUrgence(code: CodeDateDemande): string {
    if (code === "DD_PRIORITAIRE") return "Prioritaire";
    if (code === "DD_URGENT") return "Urgent";
    if (code === "DD_NORMAL") return "Normale";
    return "Anticipee";
  }

  function getRelanceDate(dateIso: string): string {
    const base = new Date(dateIso);
    if (Number.isNaN(base.getTime())) return TODAY;
    base.setDate(base.getDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  function downloadBlobPdf(url: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function createAndStorePdf(
    detail: CalculDevisDetail,
    input: ReturnType<typeof getInputFromForm>,
  ) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const formatCurrency = (value: number) => `${value.toFixed(2)} EUR`;
    const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

    const drawHeader = () => {
      doc.setFillColor(17, 24, 39);
      doc.roundedRect(margin, y - 8, contentWidth, 24, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("DEVIS NEOTRAVEL", margin + 6, y + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Date: ${TODAY}`, margin + 6, y + 8);

      y += 24;
    };

    const drawSectionTitle = (title: string) => {
      y += 6;
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, margin, y);
      y += 2;

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.4);
      doc.line(margin, y + 1, margin + contentWidth, y + 1);
      y += 6;
    };

    const drawInfoGrid = (rows: Array<[string, string]>) => {
      const rowHeight = 8;
      const colGap = 4;
      const colWidth = (contentWidth - colGap) / 2;

      for (let i = 0; i < rows.length; i += 2) {
        const left = rows[i];
        const right = rows[i + 1];

        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, y - 5.5, colWidth, rowHeight, 1.5, 1.5, "F");
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(left[0], margin + 2, y - 0.4);
        doc.setFont("helvetica", "normal");
        doc.text(left[1], margin + colWidth - 2, y - 0.4, { align: "right" });

        if (right) {
          const rightX = margin + colWidth + colGap;
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(rightX, y - 5.5, colWidth, rowHeight, 1.5, 1.5, "F");
          doc.setFont("helvetica", "bold");
          doc.text(right[0], rightX + 2, y - 0.4);
          doc.setFont("helvetica", "normal");
          doc.text(right[1], rightX + colWidth - 2, y - 0.4, { align: "right" });
        }

        y += rowHeight + 1.2;
      }
    };

    const drawFinanceTable = (rows: Array<[string, string]>) => {
      const rowHeight = 7.5;
      const labelX = margin + 3;
      const valueX = margin + contentWidth - 3;

      rows.forEach(([label, value], index) => {
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y - 5.5, contentWidth, rowHeight, "F");
        }

        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(label, labelX, y - 0.4);
        doc.text(value, valueX, y - 0.4, { align: "right" });

        y += rowHeight;
      });
    };

    drawHeader();

    drawSectionTitle("Informations de trajet");
    drawInfoGrid([
      ["Date depart", String(input.dateDepart)],
      ["Code date demande", input.codeDateDemande],
      ["Nombre passagers", String(input.nombrePassagers)],
      ["Distance", `${Number(input.distanceKm ?? 0).toFixed(1)} km`],
    ]);

    drawSectionTitle("Coefficients de tarification");
    drawInfoGrid([
      ["Saisonnalite", formatPercent(detail.coefficientSaisonnalite)],
      ["Date demande", formatPercent(detail.coefficientDateDemande)],
      ["Capacite", formatPercent(detail.coefficientCapacite)],
      ["Total coeff.", formatPercent(detail.totalCoefficients)],
    ]);

    drawSectionTitle("Detail financier");
    drawFinanceTable([
      ["Prix base", formatCurrency(detail.prixBase)],
      ["Montant ajuste", formatCurrency(detail.montantAjuste)],
      ["Supplements", formatCurrency(detail.supplements)],
      ["Sous-total HT", formatCurrency(detail.sousTotalHt)],
      ["Marge commerciale", formatCurrency(detail.margeCommerciale)],
      ["Total apres marge HT", formatCurrency(detail.totalApresMargeHt)],
      ["TVA (10%)", formatCurrency(detail.tva)],
    ]);

    y += 4;
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(margin, y - 4.5, contentWidth, 13, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PRIX FINAL TTC", margin + 4, y + 3.2);
    doc.text(formatCurrency(detail.prixFinalTtc), margin + contentWidth - 4, y + 3.2, {
      align: "right",
    });

    const safeDate = String(input.dateDepart).replaceAll("/", "-");
    const pdfFileName = `devis-${safeDate}.pdf`;
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return { pdfUrl, pdfFileName };
  }

  async function calculerDepuisTarification(
    input: CalculerDevisInput,
  ): Promise<CalculDevisDetail> {
    const response = await fetch("/api/tarification/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const body = (await response.json().catch(() => null)) as
      | { error?: string; detail?: CalculDevisDetail }
      | null;

    if (!response.ok || !body?.detail) {
      throw new Error(body?.error ?? "Erreur lors du calcul via tarification");
    }

    return body.detail;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setConfirmation("");

    try {
      const inputCalcul = getInputFromForm();
      const detail = await calculerDepuisTarification(inputCalcul);
      setResultatTtc(detail.prixFinalTtc);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du calcul du devis";
      setErreur(message);
      setResultatTtc(null);
      return;
    }

    const payload = {
      nomSociete: form.nomSociete,
      email: form.email,
      telephone: form.telephone,
      villeDepart: form.villeDepart,
      villeDestination: form.villeDestination,
      distanceKm: Number(form.distanceKm),
      dateDepart: form.dateDepart,
      dateRetour: form.dateRetour,
      dateDemande: form.dateDemande,
      nombrePassagers: Number(form.nombrePassagers),
      typeVehicule: form.typeVehicule,
      typeTrajet: form.typeTrajet,
      options: form.options,
      urgence: getUrgence(form.codeDateDemande),
      commentaire: form.commentaire,
      statut: form.statut,
    };

    try {
      const response = await fetch("/api/demandes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; id?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Erreur Airtable");
      }

      if (body?.id) setDemandeId(body.id);
      setConfirmation(
        body?.id
          ? `Demande enregistree dans Airtable (ID: ${body.id}).`
          : "Demande enregistree dans Airtable.",
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement Airtable";
      setErreur(message);
    }
  }

  async function onDownloadPdf() {
    setErreur("");
    setConfirmation("");

    try {
      const input = getInputFromForm();
      const detail = await calculerDepuisTarification(input);
      const { pdfUrl, pdfFileName } = await createAndStorePdf(detail, input);

      downloadBlobPdf(pdfUrl, pdfFileName);
      setResultatTtc(detail.prixFinalTtc);

      const devisPayload = {
        demandeLiee: demandeId,
        prixHt: detail.totalApresMargeHt,
        tva10: detail.tva,
        prixTtc: detail.prixFinalTtc,
        detailCalcul: JSON.stringify(detail),
        statut: "Envoye",
        dateEnvoi: TODAY,
        prochaineRelance: getRelanceDate(TODAY),
      };

      const response = await fetch("/api/devis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(devisPayload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Erreur Airtable sur la table Devis");
      }

      const body = (await response.json()) as { id?: string };

      setDevisRows((prev) => [
        {
          idDevis: body.id ?? `local-${Date.now()}`,
          demandeLiee: demandeId || "",
          prixHt: detail.totalApresMargeHt,
          tva: detail.tva,
          prixTtc: detail.prixFinalTtc,
          detailCalcul: JSON.stringify(detail),
          pdfUrl,
          pdfFileName,
          statut: "Envoye",
          dateEnvoi: TODAY,
          prochaineRelance: getRelanceDate(TODAY),
        },
        ...prev,
      ]);

      if (body.id) {
        setRelanceDevisLie((current) => current || body.id || "");
      }

      setConfirmation(
        body.id
          ? `Devis enregistre dans Airtable (ID: ${body.id}) et telecharge.`
          : "Devis telecharge et ajoute au tableau.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la generation du PDF";
      setErreur(message);
    }
  }

  async function onCreateRelance() {
    setErreur("");
    setConfirmation("");

    if (!relanceDevisLie) {
      setErreur("Selectionne un devis lie pour creer une relance.");
      return;
    }

    const currentCount = relancesRows.filter(
      (relance) => relance.devisLie === relanceDevisLie,
    ).length;
    const numeroRelance = currentCount + 1;

    try {
      const payload = {
        devisLie: relanceDevisLie,
        numeroRelance,
        datePlanifiee: relanceDatePlanifiee,
        statut: relanceStatut,
        reponseProspect: relanceReponseProspect,
      };

      const response = await fetch("/api/relances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Erreur Airtable sur la table Relances");
      }

      const body = (await response.json()) as { id?: string };

      setRelancesRows((prev) => [
        {
          idRelance: body.id ?? `relance-local-${Date.now()}`,
          devisLie: relanceDevisLie,
          numeroRelance,
          datePlanifiee: relanceDatePlanifiee,
          statut: relanceStatut,
          reponseProspect: relanceReponseProspect,
        },
        ...prev,
      ]);

      setRelanceReponseProspect("");
      setConfirmation(
        body.id
          ? `Relance enregistree dans Airtable (ID: ${body.id}).`
          : "Relance ajoutee au tableau.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la creation de la relance";
      setErreur(message);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Calculateur de devis</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Le formulaire calcule le devis et enregistre la demande dans Airtable.
          Le detail du calcul est affiche dans la console navigateur.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Nom / Societe</span>
            <input
              type="text"
              value={form.nomSociete}
              onChange={(e) => updateField("nomSociete", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Telephone</span>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => updateField("telephone", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Ville depart</span>
            <input
              type="text"
              value={form.villeDepart}
              onChange={(e) => updateField("villeDepart", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Ville destination</span>
            <input
              type="text"
              value={form.villeDestination}
              onChange={(e) => updateField("villeDestination", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Distance (km)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.distanceKm}
              onChange={(e) => updateField("distanceKm", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Date de depart</span>
            <input
              type="date"
              value={form.dateDepart}
              onChange={(e) => updateField("dateDepart", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Date retour</span>
            <input
              type="date"
              value={form.dateRetour}
              onChange={(e) => updateField("dateRetour", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Date demande</span>
            <input
              type="date"
              value={form.dateDemande}
              onChange={(e) => updateField("dateDemande", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Code date demande</span>
            <select
              value={form.codeDateDemande}
              onChange={(e) =>
                updateField("codeDateDemande", e.target.value as CodeDateDemande)
              }
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="DD_PRIORITAIRE">DD_PRIORITAIRE</option>
              <option value="DD_URGENT">DD_URGENT</option>
              <option value="DD_NORMAL">DD_NORMAL</option>
              <option value="DD_3MOISETPLUS">DD_3MOISETPLUS</option>
            </select>
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Nombre de passagers</span>
            <input
              type="number"
              min={1}
              max={85}
              step="1"
              value={form.nombrePassagers}
              onChange={(e) => updateField("nombrePassagers", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Type vehicule</span>
            <select
              value={form.typeVehicule}
              onChange={(e) => updateField("typeVehicule", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="Minibus">Minibus</option>
              <option value="Autocar">Autocar</option>
              <option value="Bus VIP">Bus VIP</option>
            </select>
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Type trajet</span>
            <select
              value={form.typeTrajet}
              onChange={(e) => updateField("typeTrajet", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="Aller simple">Aller simple</option>
              <option value="Aller-retour">Aller-retour</option>
              <option value="Multietapes">Multietapes</option>
            </select>
          </label>

          <fieldset className="grid gap-2 sm:col-span-2">
            <legend className="text-sm font-medium">Options</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {["Guide", "Nuit chauffeur", "Peages inclus"].map((option) => (
                <label key={option} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.options.includes(option)}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Jours guide</span>
            <input
              type="number"
              min={0}
              step="1"
              value={form.nombreJoursGuide}
              onChange={(e) => updateField("nombreJoursGuide", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Nuits chauffeur</span>
            <input
              type="number"
              min={0}
              step="1"
              value={form.nombreNuitsChauffeur}
              onChange={(e) =>
                updateField("nombreNuitsChauffeur", e.target.value)
              }
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Forfait peages (€)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.forfaitPeages}
              onChange={(e) => updateField("forfaitPeages", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 sm:col-span-1">
            <span className="text-sm font-medium">Statut</span>
            <select
              value={form.statut}
              onChange={(e) => updateField("statut", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="Nouveau">Nouveau</option>
              <option value="En cours">En cours</option>
              <option value="Valide">Valide</option>
              <option value="Refuse">Refuse</option>
            </select>
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Commentaire</span>
            <textarea
              value={form.commentaire}
              onChange={(e) => updateField("commentaire", e.target.value)}
              className="min-h-24 rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="Informations complementaires..."
            />
          </label>

          <div className="mt-2 flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-700"
            >
              Calculer et enregistrer
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-white transition hover:bg-emerald-600"
            >
              Telecharger le PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(INITIAL_FORM);
                setResultatTtc(null);
                setErreur("");
                setConfirmation("");
                setDemandeId("");
                setRelancesRows([]);
                setRelanceDevisLie("");
                setRelanceDatePlanifiee(TODAY);
                setRelanceStatut("A planifier");
                setRelanceReponseProspect("");
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 transition hover:bg-zinc-100"
            >
              Reinitialiser
            </button>
          </div>
        </form>

        {erreur && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {erreur}
          </p>
        )}

        {confirmation && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {confirmation}
          </p>
        )}

        {resultatTtc !== null && (
          <section className="mt-6 rounded-xl bg-zinc-900 p-5 text-zinc-100">
            <h2 className="text-sm uppercase tracking-wide text-zinc-300">
              Prix final TTC
            </h2>
            <p className="mt-1 text-3xl font-bold">{resultatTtc.toFixed(2)} €</p>
          </section>
        )}

        
      </div>
    </main>
  );
}
