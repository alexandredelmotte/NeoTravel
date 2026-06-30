import Link from "next/link";
import {
  ArrowRight, MessagesSquare, Calculator, FileText, Bus,
  UserRound, ShieldCheck, Wallet,
} from "lucide-react";

export default function Accueil() {
  return (
    <div className="nh-root">
      <style>{CSS}</style>

      <header className="nh-header">
        <Link href="/" className="nh-logo">
          <span className="nh-logo-mark">✦</span> Neo<span className="nh-logo-bold">travel</span>
          <span className="nh-logo-since">depuis 2010</span>
        </Link>
        <nav className="nh-nav">
          <a href="#comment">Comment ça marche</a>
          <a href="#pourqui">Pour qui</a>
          <a href="/devis">Devis</a>
          <Link href="/chat" className="nh-nav-cta">Demander un devis</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="nh-hero">
        <div className="nh-hero-text">
          <p className="nh-eyebrow"><span className="nh-eyebrow-line" />Transport de groupe sur mesure</p>
          <h1 className="nh-title">Décrivez votre trajet,<br /><span className="nh-title-accent">on s'occupe du reste.</span></h1>
          <p className="nh-sub">
            Décrivez votre trajet en quelques mots. Notre assistant comprend votre besoin,
            prépare un devis fiable et mobilise le bon autocariste.
          </p>
          <div className="nh-hero-actions">
            <Link href="/chat" className="nh-cta-primary">Commencer ma demande <ArrowRight size={18} /></Link>
            <a href="#comment" className="nh-cta-ghost">Comment ça marche</a>
          </div>
        </div>

        {/* aperçu de conversation décoratif (rappelle le produit) */}
        <div className="nh-hero-preview" aria-hidden="true">
          <div className="nh-preview-card">
            <div className="nh-preview-head"><span className="nh-preview-dot" /> Conseiller NeoTravel</div>
            <div className="nh-bubble nh-bubble-agent">Bonjour ! Décrivez-moi votre projet de transport de groupe.</div>
            <div className="nh-bubble nh-bubble-client">Sortie scolaire, 45 collégiens, Paris → Lyon</div>
            <div className="nh-bubble nh-bubble-agent">Parfait. À quelle date souhaitez-vous partir ?</div>
          </div>
          <div className="nh-preview-chip">Devis en quelques minutes</div>
        </div>
      </section>

      {/* CE QU'EST NEOTRAVEL */}
      <section className="nh-values">
        <h2 className="nh-h2"> Qui sommes-nous ? </h2>
        <p className="nh-h2-sub">
          Neotravel est un spécialiste de la location d’autocar, de bus et de minibus avec chauffeur. 
          Notre métier : transporter vos groupes partout en France, et pour vos voyages en Europe, dans des conditions sûres et confortables. 
          Que vous prépariez une sortie scolaire, un séminaire d’entreprise, un voyage d’association ou un déplacement entre proches, nous nous occupons du véhicule et du conducteur. 
          Vous n’avez plus qu’à penser à votre programme.
        </p>
        <div className="nh-cards">
          <article className="nh-card">
            <span className="nh-card-ico"><UserRound size={22} /></span>
            <h3>Un interlocuteur unique</h3>
            <p>Un seul contact pour tout organiser, du devis jusqu'au jour du départ.</p>
          </article>
          <article className="nh-card">
            <span className="nh-card-ico"><ShieldCheck size={22} /></span>
            <h3>Des autocaristes vérifiés</h3>
            <p>Nous mobilisons le bon partenaire, disponible, fiable et adapté à votre groupe.</p>
          </article>
          <article className="nh-card">
            <span className="nh-card-ico"><Wallet size={22} /></span>
            <h3>Le juste prix, négocié</h3>
            <p>Un tarif clair et transparent, calculé selon le besion.</p>
          </article>
        </div>
      </section>
      {/* NOS VÉHICULES */}
      <section className="nh-fleet" id="flotte">
        <h2 className="nh-h2">Une flotte pour chaque groupe</h2>
        <p className="nh-h2-sub">Du minibus à l&apos;autocar double étage, nous sélectionnons le véhicule adapté à votre trajet et à votre niveau de confort.</p>
        <div className="nh-fleet-grid">
          {[
            { cap: "≤ 25", nom: "Minibus", usage: "Idéal pour les petits groupes, les navettes et les transferts gare ou aéroport.", equip: "Climatisation · Soutes" },
            { cap: "25–35", nom: "Minicar", usage: "Parfait pour les excursions, les sorties scolaires et les circuits courts.", equip: "Climatisation · Micro" },
            { cap: "49–63", nom: "Autocar", usage: "Pour les séminaires, les grands groupes et les longues distances en France et en Europe.", equip: "Vidéo · Soutes · WC selon modèle" },
            { cap: "≤ 93", nom: "Autocar 2 étage", usage: "Conçu pour les très grands groupes, les voyages scolaires et les grands événements.", equip: "Grande capacité · Confort tourisme" },
            { cap: "1–7", nom: "Berline VTC", usage: "Pour les dirigeants, l'accueil VIP et les transferts haut de gamme.", equip: "Accueil personnalisé · Bagages" },
          ].map((v) => (
            <article key={v.nom} className="nh-vehicle">
              <span className="nh-vehicle-cap">{v.cap}<small>places</small></span>
              <h3>{v.nom}</h3>
              <p>{v.usage}</p>
              <span className="nh-vehicle-equip">{v.equip}</span>
            </article>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="nh-steps" id="comment">
        <h2 className="nh-h2">Comment ça marche ?</h2>
        <p className="nh-h2-sub">Quatre étapes, et l'humain reprend la main dès que c'est nécessaire.</p>
        <div className="nh-steps-grid">
          <div className="nh-step">
            <span className="nh-step-num">1</span>
            <MessagesSquare className="nh-step-ico" size={26} />
            <h3>Décrivez votre besoin</h3>
            <p>Vous discutez naturellement avec l'assistant, qui complète les informations.</p>
          </div>
          <div className="nh-step">
            <span className="nh-step-num">2</span>
            <Calculator className="nh-step-ico" size={26} />
            <h3>On calcule votre devis</h3>
            <p>Un moteur de tarification fiable applique nos règles : distance, saison, capacité, options.</p>
          </div>
          <div className="nh-step">
            <span className="nh-step-num">3</span>
            <FileText className="nh-step-ico" size={26} />
            <h3>Vous recevez votre devis</h3>
            <p>Une proposition claire vous est envoyée en quelques minutes, avec le détail du prix.</p>
          </div>
          <div className="nh-step">
            <span className="nh-step-num">4</span>
            <Bus className="nh-step-ico" size={26} />
            <h3>On coordonne le trajet</h3>
            <p>Nous sécurisons la prestation avec l'autocariste. Les dossiers complexes sont transmis à un conseiller.</p>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="nh-pourqui" id="pourqui">
        <h2 className="nh-h2">Pensé pour tous les groupes</h2>
        <p className="nh-h2-sub">Chaque contexte a ses contraintes : nous adaptons le véhicule, les horaires et l&apos;accompagnement.</p>
        <div className="nh-cards">
          {[
            { t: "Entreprises", d: "Séminaires, conventions et déplacements d'équipe, avec une logistique gérée de bout en bout." },
            { t: "Comités d'entreprise", d: "Sorties, week-ends et excursions de groupe, en France comme en Europe." },
            { t: "BDE & associations", d: "Week-ends d'intégration, voyages étudiants et événements sportifs ou associatifs." },
            { t: "Sorties scolaires", d: "Le transport encadré de vos élèves, dans des conditions sûres et confortables." },
            { t: "Navettes de soirée", d: "Des allers-retours organisés et des retours de nuit sécurisés." },
            { t: "Particuliers", d: "Mariages, sorties familiales et événements privés entre proches." },
          ].map((s) => (
            <article key={s.t} className="nh-card">
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="nh-final">
        <div className="nh-final-card">
          <h2 className="nh-final-title">Prêt à planifier votre trajet ?</h2>
          <p className="nh-final-sub">Décrivez votre besoin, recevez un devis. C'est gratuit et sans engagement.</p>
          <Link href="/chat" className="nh-cta-primary nh-cta-big">Commencer ma demande <ArrowRight size={18} /></Link>
        </div>
      </section>

      <footer className="nh-footer">
        <span>✦ Neotravel</span>
        <span className="nh-footer-mini">Transport de groupe sur mesure, depuis 2010</span>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@500&display=swap');

.nh-root{
  --nuit:#1D3557; --bleu:#5784BA; --bleu-d:#446A9B; --ciel:#9AC8EB; --clair:#B6D8F2;
  --rose:#F4CFDF; --fond:#F6F8FB; --fond-2:#ECF2F8; --white:#fff; --line:#DDE5EE;
  --ink:#1D3557; --muted:#6A7A90;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink); min-height:100vh;
  background:
    radial-gradient(900px 460px at 88% -12%, rgba(154,200,235,.32), transparent 60%),
    radial-gradient(760px 440px at -8% 60%, rgba(244,207,223,.24), transparent 60%),
    var(--fond);
  box-sizing:border-box;
}
.nh-root *{ box-sizing:border-box; }
.nh-root a{ text-decoration:none; color:inherit; }

.nh-header{ background:var(--nuit); color:#EAF1F8; display:flex; align-items:center; justify-content:space-between; padding:16px 40px; }
.nh-logo{ display:flex; align-items:center; gap:9px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:20px; }
.nh-logo-mark{ color:var(--ciel); }
.nh-logo-bold{ color:#fff; margin-left:-4px; }
.nh-logo-since{ font-family:'Spline Sans Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:rgba(234,241,248,.5); border:1px solid rgba(234,241,248,.2); padding:3px 7px; border-radius:6px; margin-left:8px; }
.nh-nav{ display:flex; gap:26px; align-items:center; font-size:14px; color:rgba(234,241,248,.8); }
.nh-nav a{ cursor:pointer; transition:color .15s; }
.nh-nav a:hover{ color:#fff; }
.nh-nav-cta{ background:var(--ciel); color:var(--nuit) !important; font-weight:600; padding:9px 18px; border-radius:999px; }
.nh-nav-cta:hover{ background:var(--clair); }

.nh-hero{ max-width:1180px; margin:0 auto; padding:64px 40px 40px; display:grid; grid-template-columns:1.25fr 1fr; gap:48px; align-items:center; }
.nh-eyebrow{ display:flex; align-items:center; gap:10px; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--bleu-d); font-weight:600; margin:0 0 16px; }
.nh-eyebrow-line{ width:26px; height:2px; background:var(--bleu); display:inline-block; }
.nh-title{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; line-height:1.02; font-size:clamp(38px,5vw,64px); letter-spacing:-.02em; color:var(--nuit); margin:0 0 20px; }
.nh-title-accent{ color:var(--bleu); }
.nh-sub{ font-size:17px; line-height:1.6; color:var(--muted); max-width:520px; margin:0 0 30px; }
.nh-hero-actions{ display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.nh-cta-primary{ display:inline-flex; align-items:center; gap:9px; background:var(--bleu); color:#fff !important; font-weight:600; font-size:16px; padding:15px 26px; border-radius:14px; transition:background .15s; }
.nh-cta-primary:hover{ background:var(--bleu-d); }
.nh-cta-ghost{ font-weight:600; font-size:15px; color:var(--nuit); border-bottom:2px solid var(--ciel); padding-bottom:2px; }

.nh-hero-preview{ position:relative; }
.nh-preview-card{ background:var(--white); border:1px solid var(--line); border-radius:20px; padding:18px; box-shadow:0 30px 60px -30px rgba(29,53,87,.45); display:flex; flex-direction:column; gap:10px; }
.nh-preview-head{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:var(--nuit); padding-bottom:10px; border-bottom:1px solid var(--line); }
.nh-preview-dot{ width:8px; height:8px; border-radius:50%; background:#3FA37E; }
.nh-bubble{ padding:11px 14px; border-radius:14px; font-size:14px; line-height:1.45; max-width:88%; }
.nh-bubble-agent{ background:var(--fond-2); color:var(--ink); align-self:flex-start; border-bottom-left-radius:5px; }
.nh-bubble-client{ background:var(--nuit); color:#EAF1F8; align-self:flex-end; border-bottom-right-radius:5px; }
.nh-preview-chip{ position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); background:var(--rose); color:var(--nuit); font-size:12.5px; font-weight:600; padding:8px 16px; border-radius:999px; box-shadow:0 12px 24px -10px rgba(29,53,87,.4); white-space:nowrap; }

.nh-values, .nh-steps, .nh-pourqui{ max-width:1180px; margin:0 auto; padding:56px 40px; }
.nh-h2{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:clamp(26px,3vw,38px); letter-spacing:-.01em; color:var(--nuit); margin:0 0 12px; text-align:center; }
.nh-h2-sub{ font-size:16px; line-height:1.6; color:var(--muted); max-width:900px; margin:0 auto 38px; text-align:center; }

.nh-cards{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.nh-card{ background:var(--white); border:1px solid var(--line); border-radius:18px; padding:26px; box-shadow:0 20px 40px -32px rgba(29,53,87,.35); }
.nh-card-ico{ display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--fond-2); color:var(--bleu); margin-bottom:16px; }
.nh-card h3{ font-family:'Bricolage Grotesque',sans-serif; font-weight:600; font-size:18px; color:var(--nuit); margin:0 0 8px; }
.nh-card p{ font-size:14.5px; line-height:1.55; color:var(--muted); margin:0; }

.nh-steps-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.nh-step{ position:relative; background:var(--white); border:1px solid var(--line); border-radius:18px; padding:24px 22px; }
.nh-step-num{ position:absolute; top:18px; right:20px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:30px; color:var(--clair); line-height:1; }
.nh-step-ico{ color:var(--bleu); margin-bottom:14px; }
.nh-step h3{ font-family:'Bricolage Grotesque',sans-serif; font-weight:600; font-size:16.5px; color:var(--nuit); margin:0 0 8px; }
.nh-step p{ font-size:14px; line-height:1.5; color:var(--muted); margin:0; }

.nh-pourqui{ text-align:center; }
.nh-tags{ display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
.nh-tag{ background:var(--white); border:1px solid var(--line); color:var(--nuit); font-weight:500; font-size:15px; padding:11px 20px; border-radius:999px; }

.nh-final{ max-width:1180px; margin:0 auto; padding:30px 40px 70px; }
.nh-final-card{ position:relative; overflow:hidden; background:var(--nuit); color:#EAF1F8; border-radius:24px; padding:54px 40px; text-align:center; }
.nh-final-card::after{ content:""; position:absolute; top:-60px; right:-40px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle,rgba(154,200,235,.3),transparent 70%); }
.nh-final-title{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:clamp(26px,3vw,36px); color:#fff; margin:0 0 12px; position:relative; }
.nh-final-sub{ font-size:16px; color:rgba(234,241,248,.75); margin:0 0 26px; position:relative; }
.nh-cta-big{ font-size:17px; padding:16px 30px; position:relative; }

.nh-footer{ border-top:1px solid var(--line); padding:26px 40px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; font-size:13px; color:var(--muted); max-width:1180px; margin:0 auto; }

@media (max-width:900px){
  .nh-header{ padding:14px 18px; }
  .nh-nav a:not(.nh-nav-cta){ display:none; }
  .nh-hero{ grid-template-columns:1fr; padding:40px 18px 30px; gap:46px; }
  .nh-hero-preview{ order:-1; }
  .nh-values, .nh-steps, .nh-pourqui{ padding:40px 18px; }
  .nh-cards, .nh-steps-grid{ grid-template-columns:1fr; }
  .nh-final{ padding:20px 18px 50px; }
  .nh-final-card{ padding:40px 24px; }
}

.nh-fleet{ max-width:1180px; margin:0 auto; padding:56px 40px; }
.nh-fleet-grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
.nh-vehicle{ background:var(--white); border:1px solid var(--line); border-radius:18px; padding:22px; box-shadow:0 20px 40px -32px rgba(29,53,87,.35); }
.nh-vehicle-cap{ display:inline-flex; align-items:baseline; gap:5px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:26px; color:var(--bleu); margin-bottom:12px; }
.nh-vehicle-cap small{ font-family:'Inter',sans-serif; font-weight:500; font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; }
.nh-vehicle h3{ font-family:'Bricolage Grotesque',sans-serif; font-weight:600; font-size:16px; color:var(--nuit); margin:0 0 8px; }
.nh-vehicle p{ font-size:13.5px; line-height:1.5; color:var(--muted); margin:0 0 12px; }
.nh-vehicle-equip{ font-size:11.5px; color:var(--bleu-d); font-weight:500; }
@media (max-width:900px){ .nh-fleet-grid{ grid-template-columns:1fr 1fr; } .nh-fleet{ padding:40px 18px; } }
`;
