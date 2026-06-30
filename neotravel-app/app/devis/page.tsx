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
    const doc = new jsPDF();
    let y = 16;

    const addLine = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 8;
    };

    doc.setFontSize(16);
    doc.text("Devis NeoTravel", 14, y);
    y += 10;

    doc.setFontSize(11);
    addLine("Date depart", String(input.dateDepart));
    addLine("Code date demande", input.codeDateDemande);
    addLine("Nombre passagers", String(input.nombrePassagers));
    addLine("Prix base", `${detail.prixBase.toFixed(2)} EUR`);
    addLine(
      "Coeff saisonnalite",
      `${(detail.coefficientSaisonnalite * 100).toFixed(0)}%`,
    );
    addLine(
      "Coeff date demande",
      `${(detail.coefficientDateDemande * 100).toFixed(0)}%`,
    );
    addLine(
      "Coeff capacite",
      `${(detail.coefficientCapacite * 100).toFixed(0)}%`,
    );
    addLine(
      "Total coefficients",
      `${(detail.totalCoefficients * 100).toFixed(0)}%`,
    );
    addLine("Montant ajuste", `${detail.montantAjuste.toFixed(2)} EUR`);
    addLine("Supplements", `${detail.supplements.toFixed(2)} EUR`);
    addLine("Sous-total HT", `${detail.sousTotalHt.toFixed(2)} EUR`);
    addLine("Marge commerciale", `${detail.margeCommerciale.toFixed(2)} EUR`);
    addLine(
      "Total apres marge HT",
      `${detail.totalApresMargeHt.toFixed(2)} EUR`,
    );
    addLine("TVA", `${detail.tva.toFixed(2)} EUR`);

    y += 4;
    doc.setFontSize(14);
    doc.text(`PRIX FINAL TTC: ${detail.prixFinalTtc.toFixed(2)} EUR`, 14, y);

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

        {devisRows.length > 0 && (
          <section className="mt-6 rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold">Table des devis (telechargeables)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-2 py-2">ID devis</th>
                    <th className="px-2 py-2">Demande liee</th>
                    <th className="px-2 py-2">Prix HT</th>
                    <th className="px-2 py-2">TVA (10%)</th>
                    <th className="px-2 py-2">Prix TTC</th>
                    <th className="px-2 py-2">Detail calcul</th>
                    <th className="px-2 py-2">PDF</th>
                    <th className="px-2 py-2">Statut</th>
                    <th className="px-2 py-2">Date envoi</th>
                    <th className="px-2 py-2">Prochaine relance</th>
                  </tr>
                </thead>
                <tbody>
                  {devisRows.map((row) => (
                    <tr key={row.idDevis} className="border-b border-zinc-100 align-top">
                      <td className="px-2 py-2">{row.idDevis}</td>
                      <td className="px-2 py-2">{row.demandeLiee || "-"}</td>
                      <td className="px-2 py-2">{row.prixHt.toFixed(2)} EUR</td>
                      <td className="px-2 py-2">{row.tva.toFixed(2)} EUR</td>
                      <td className="px-2 py-2">{row.prixTtc.toFixed(2)} EUR</td>
                      <td className="max-w-56 truncate px-2 py-2" title={row.detailCalcul}>
                        {row.detailCalcul}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => downloadBlobPdf(row.pdfUrl, row.pdfFileName)}
                          className="rounded bg-emerald-700 px-2 py-1 text-white hover:bg-emerald-600"
                        >
                          Telecharger
                        </button>
                      </td>
                      <td className="px-2 py-2">{row.statut}</td>
                      <td className="px-2 py-2">{row.dateEnvoi}</td>
                      <td className="px-2 py-2">{row.prochaineRelance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-zinc-200 p-4">
          <h2 className="text-lg font-semibold">Table des relances</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Devis lie</span>
              <select
                value={relanceDevisLie}
                onChange={(e) => setRelanceDevisLie(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              >
                <option value="">Selectionner un devis</option>
                {devisRows.map((row) => (
                  <option key={row.idDevis} value={row.idDevis}>
                    {row.idDevis}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Date planifiee</span>
              <input
                type="date"
                value={relanceDatePlanifiee}
                onChange={(e) => setRelanceDatePlanifiee(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Statut</span>
              <select
                value={relanceStatut}
                onChange={(e) => setRelanceStatut(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              >
                <option value="A planifier">A planifier</option>
                <option value="Planifiee">Planifiee</option>
                <option value="Envoyee">Envoyee</option>
                <option value="Repondu">Repondu</option>
                <option value="Sans reponse">Sans reponse</option>
              </select>
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-sm font-medium">Reponse prospect</span>
              <textarea
                value={relanceReponseProspect}
                onChange={(e) => setRelanceReponseProspect(e.target.value)}
                className="min-h-20 rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Compte-rendu de l'appel ou de l'email..."
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={onCreateRelance}
                className="rounded-lg bg-blue-700 px-4 py-2 text-white transition hover:bg-blue-600"
              >
                Ajouter une relance
              </button>
            </div>
          </div>

          {relancesRows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-2 py-2">Devis lie</th>
                    <th className="px-2 py-2">Numero relance</th>
                    <th className="px-2 py-2">Date planifiee</th>
                    <th className="px-2 py-2">Statut</th>
                    <th className="px-2 py-2">Reponse prospect</th>
                  </tr>
                </thead>
                <tbody>
                  {relancesRows.map((row) => (
                    <tr key={row.idRelance} className="border-b border-zinc-100 align-top">
                      <td className="px-2 py-2">{row.devisLie}</td>
                      <td className="px-2 py-2">{row.numeroRelance}</td>
                      <td className="px-2 py-2">{row.datePlanifiee}</td>
                      <td className="px-2 py-2">{row.statut}</td>
                      <td className="max-w-72 truncate px-2 py-2" title={row.reponseProspect}>
                        {row.reponseProspect || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
