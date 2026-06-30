import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(request: Request) {
  try {
    const { nom, depart, destination, date, passagers,
            typeVehicule, typeTrajet, prixBase, supplements,
            sousTotalHt, tva, prix, reference } = await request.json();

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("fr-FR");
    const validite = new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString("fr-FR");

    // En-tête
    doc.setFillColor(29, 53, 87);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(154, 200, 235);
    doc.setFontSize(20);
    doc.text("NeoTravel", 14, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Transport de groupe sur mesure · depuis 2010", 14, 25);

    // Badge devis
    doc.setFillColor(87, 132, 186);
    doc.rect(0, 30, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`DEVIS N° ${reference}`, 14, 38);
    doc.text(`Émis le ${today} · Valable jusqu'au ${validite}`, 210 - 14, 38, { align: "right" });

    // Infos client
    doc.setTextColor(29, 53, 87);
    doc.setFontSize(14);
    doc.text("Bonjour,", 14, 55);
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Voici votre devis pour ${nom}.`, 14, 63);

    // Section prestation
    doc.setFontSize(11);
    doc.setTextColor(29, 53, 87);
    doc.setFont("helvetica", "bold");
    doc.text("PRESTATION", 14, 78);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);

    const prestations = [
      ["Trajet", `${depart} → ${destination}`],
      ["Date de départ", date],
      ["Passagers", String(passagers)],
      ...(typeVehicule ? [["Véhicule", typeVehicule]] : []),
      ...(typeTrajet ? [["Type de trajet", typeTrajet]] : []),
    ];

    let y = 85;
    prestations.forEach(([label, valeur]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(label, 14, y);
      doc.setTextColor(29, 53, 87);
      doc.text(valeur, 130, y);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 2, 196, y + 2);
      y += 10;
    });

    // Section prix
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(29, 53, 87);
    doc.text("DÉTAIL DU DEVIS", 14, y);
    doc.setFont("helvetica", "normal");
    y += 8;

    const lignesPrix = [
      ...(prixBase ? [["Prix de base", `${prixBase} €`]] : []),
      ...(supplements && supplements !== "0" ? [["Suppléments", `${supplements} €`]] : []),
      ...(sousTotalHt ? [["Sous-total HT", `${sousTotalHt} €`]] : []),
      ...(tva ? [["TVA (10 %)", `${tva} €`]] : []),
    ];

    lignesPrix.forEach(([label, valeur]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(label, 14, y);
      doc.setTextColor(29, 53, 87);
      doc.text(valeur, 196, y, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 2, 196, y + 2);
      y += 10;
    });

    // Total TTC
    y += 4;
    doc.setFillColor(87, 132, 186);
    doc.rect(14, y - 5, 182, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("TOTAL TTC", 20, y + 4);
    doc.text(`${prix} €`, 192, y + 4, { align: "right" });

    // Pied de page
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "NeoTravel SAS · 55 Rue Raspail, 92300 Levallois-Perret · Tél. 09 80 40 04 84 · RCS Nanterre 529 307 167",
      105, 285, { align: "center" }
    );

    // Retourner le PDF en base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return NextResponse.json({ success: true, pdf: pdfBase64 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}