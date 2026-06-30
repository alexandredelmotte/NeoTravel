
// --- petits utilitaires de mise en forme ---

const COULEURS = {
  nuit: "#1D3557",
  bleu: "#5784BA",
  ciel: "#9AC8EB",
  fond: "#F6F8FB",
  texte: "#26302B",
  muted: "#6A7A90",
  ligne: "#E4E0D4"
};

function p(texte) {
  return `<p style="color:${COULEURS.texte};font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;margin:0 0 14px;">${texte}</p>`;
}

function bouton(texte, lien) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr><td style="border-radius:10px;background:${COULEURS.bleu};">
      <a href="${lien}" style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${texte}</a>
    </td></tr></table>`;
}

function recap(d) {
  const lignes = [
    ["Trajet", `${d.depart} → ${d.destination}`],
    ["Date", d.date],
    ["Passagers", String(d.passagers)]
  ];

  if (d.prix) {
    lignes.push(["Prix estimé", d.prix]);
  }

  const rows = lignes
    .map(([k, v]) => `
      <tr>
        <td style="padding:9px 0;color:${COULEURS.muted};font-size:13px;font-family:Arial,sans-serif;">${k}</td>
        <td style="padding:9px 0;color:${COULEURS.nuit};font-size:14px;font-weight:bold;font-family:Arial,sans-serif;text-align:right;">${v}</td>
      </tr>
    `)
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:18px 0;border-top:1px solid ${COULEURS.ligne};border-bottom:1px solid ${COULEURS.ligne};">${rows}</table>`;
}

// L'enveloppe commune à tous les mails
function shell(preheader, contenu) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:${COULEURS.fond};">

<span style="display:none;max-height:0;overflow:hidden;opacity:0;">
${preheader}
</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COULEURS.fond};padding:24px 12px;">
<tr>
<td align="center">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">

<tr>
<td style="background:${COULEURS.nuit};padding:20px 28px;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;">
<span style="color:${COULEURS.ciel};">✦ Neo</span><span style="color:#ffffff;">travel</span>
</td>
</tr>

<tr>
<td style="padding:30px 28px;">
${contenu}
</td>
</tr>

<tr>
<td style="padding:18px 28px;background:${COULEURS.fond};color:${COULEURS.muted};font-size:12px;line-height:1.6;font-family:Arial,sans-serif;">
NeoTravel SAS · Transport de groupe sur mesure, depuis 2010<br>
09 80 40 04 84 · reservation@neotravel.com
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
}

// ================== LES 3 MODÈLES ==================

// 1. Envoi du devis
export function mailDevis(d) {
  const lien = d.lienDevis || "#";

  const contenu =
    p(`Bonjour ${d.nom},`) +
    p(`Merci pour votre demande. Voici votre devis pour le transport de groupe suivant :`) +
    recap(d) +
    p(`Ce devis est gratuit et sans engagement. Pour le valider ou poser une question, c'est par ici :`) +
    bouton("Voir mon devis", lien) +
    p(`<span style="color:${COULEURS.muted};font-size:13px;">Référence : ${d.reference}</span>`);

  return {
    subject: `Votre devis NeoTravel — ${d.depart} → ${d.destination}`,
    html: shell(`Votre devis pour ${d.depart} → ${d.destination} est prêt.`, contenu)
  };
}

// 2. Première relance
export function mailRelance1(d) {
  const lien = d.lienDevis || "#";

  const contenu =
    p(`Bonjour ${d.nom},`) +
    p(`Nous revenons vers vous au sujet de votre projet de transport de groupe. Votre devis est toujours disponible :`) +
    recap(d) +
    bouton("Reprendre ma demande", lien) +
    p(`Une question ou un détail à ajuster ? Répondez simplement à cet email, un conseiller vous recontacte.`) +
    p(`<span style="color:${COULEURS.muted};font-size:13px;">Référence : ${d.reference}</span>`);

  return {
    subject: `Votre devis NeoTravel vous attend — ${d.depart} → ${d.destination}`,
    html: shell(`Votre devis est toujours disponible.`, contenu)
  };
}

// 3. Deuxième et dernière relance
export function mailRelance2(d) {
  const lien = d.lienDevis || "#";

  const contenu =
    p(`Bonjour ${d.nom},`) +
    p(`Sauf erreur de notre part, nous n'avons pas eu de retour concernant votre demande. Sans réponse de votre part, nous la clôturerons prochainement.`) +
    p(`Si votre projet est toujours d'actualité, il vous suffit d'un clic :`) +
    recap(d) +
    bouton("Finaliser ma demande", lien) +
    p(`Nous restons bien sûr à votre disposition.`) +
    p(`<span style="color:${COULEURS.muted};font-size:13px;">Référence : ${d.reference}</span>`);

  return {
    subject: `Dernière relance — votre devis NeoTravel (${d.reference})`,
    html: shell(`Dernière relance avant clôture de votre demande.`, contenu)
  };
}