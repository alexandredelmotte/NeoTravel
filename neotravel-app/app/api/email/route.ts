import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { mailDevis, mailRelance1, mailRelance2, DonneesMail } from "./templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { to, subject, html } = body as { to?: string; subject?: string; html?: string };

    // --- Si un "type" est fourni, on construit le mail à partir du modèle ---
    if (body.type) {
      const donnees: DonneesMail = body.donnees;
      let modele;
      if (body.type === "devis") modele = mailDevis(donnees);
      else if (body.type === "relance1") modele = mailRelance1(donnees);
      else if (body.type === "relance2") modele = mailRelance2(donnees);
      else return NextResponse.json({ success: false, error: "type inconnu" }, { status: 400 });

      subject = modele.subject;
      html = modele.html;
    }

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Champs manquants (to, subject, html)" },
        { status: 400 }
      );
    }

    // --- Génération du PDF (seulement pour un devis) ---
    let attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    if (body.type === "devis" && body.donnees) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        const pdfRes = await fetch(`${baseUrl}/api/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body.donnees),
        });
        const pdfData = await pdfRes.json();
        if (pdfData.success && pdfData.pdf) {
          attachments = [{
            filename: `Devis-NeoTravel-${body.donnees.reference || "DEV"}.pdf`,
            content: Buffer.from(pdfData.pdf, "base64"),
            contentType: "application/pdf",
          }];
        }
      } catch (e) {
        // Si le PDF plante, on envoie quand même le mail sans pièce jointe
        console.log("PDF non généré, envoi sans pièce jointe:", e);
      }
    }

    // --- Connexion SMTP Gmail ---
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // --- Envoi du mail (avec ou sans PDF) ---
    await transporter.sendMail({
      from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments, // ← vide si pas de PDF, rempli si PDF généré
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}