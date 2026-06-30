import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { mailDevis, mailRelance1, mailRelance2, DonneesMail } from "./templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { to, subject, html } = body as { to?: string; subject?: string; html?: string };


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
      return NextResponse.json({ success: false, error: "Champs manquants (to, subject, html)" }, { status: 400 });
    }

    // Connexion au serveur d'envoi de Gmail (SMTP)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, 
      },
    });

    await transporter.sendMail({
      from: `"NeoTravel" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}