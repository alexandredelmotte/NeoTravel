import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { mailDevis, mailRelance1, mailRelance2 } from "./templates";


export async function POST(request) {
  try {
    const body = await request.json();

    let { to, subject, html } = body;

    // --- Si un "type" est fourni, on construit le mail à partir du modèle ---
    if (body.type) {
      const donnees = body.donnees;
      let modele;

      if (body.type === "devis") {
        modele = mailDevis(donnees);
      } else if (body.type === "relance1") {
        modele = mailRelance1(donnees);
      } else if (body.type === "relance2") {
        modele = mailRelance2(donnees);
      } else {
        return NextResponse.json(
          { success: false, error: "Type inconnu" },
          { status: 400 }
        );
      }

      subject = modele.subject;
      html = modele.html;
    }

    // Vérification des champs obligatoires
    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs manquants (to, subject, html)"
        },
        { status: 400 }
      );
    }

    // Connexion SMTP Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Envoi de l'email
    await transporter.sendMail({
      from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}