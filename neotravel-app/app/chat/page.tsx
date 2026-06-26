"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send, MapPin, CalendarDays, Users, Sparkles, ArrowRight,
  Check, ShieldCheck, Clock, Headphones, type LucideIcon,
} from "lucide-react";
import Link from "next/link";

// n8n a colle ici l'URL du webhook 
const N8N_WEBHOOK_URL = ""; // ex : "https://xxxx.app.n8n.cloud/webhook/neotravel"

type Message = { auteur: "agent" | "client"; texte: string };
type Etape = { cle: string; question: string; icone: LucideIcon; label: string };

const ETAPES: Etape[] = [
  { cle: "besoin",      question: "Bonjour, je suis votre conseiller NeoTravel. Décrivez-moi en quelques mots votre projet de transport de groupe.", icone: Sparkles, label: "Votre projet" },
  { cle: "depart",      question: "Avec plaisir. Depuis quelle ville partez-vous ?", icone: MapPin, label: "Départ" },
  { cle: "destination", question: "Et quelle est votre destination ?", icone: MapPin, label: "Destination" },
  { cle: "date",        question: "À quelle date souhaitez-vous voyager ?", icone: CalendarDays, label: "Date" },
  { cle: "passagers",   question: "Combien de personnes voyageront ?", icone: Users, label: "Passagers" },
  { cle: "specifique",  question: "Enfin, avez-vous un besoin particulier ? (accès PMR, transport médicalisé, options…) Sinon, écrivez « non ».", icone: Sparkles, label: "Besoin particulier" },
];

export default function NeoTravelLanding() {
  const [messages, setMessages] = useState<Message[]>([{ auteur: "agent", texte: ETAPES[0].question }]);
  const [saisie, setSaisie] = useState<string>("");
  const [etape, setEtape] = useState<number>(0);
  const [donnees, setDonnees] = useState<Record<string, string>>({});
  const [termine, setTermine] = useState<boolean>(false);
  const [enReflexion, setEnReflexion] = useState<boolean>(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, enReflexion]);

  const remplis = Object.keys(donnees).length;

  // ⬇️ LE CŒUR À REMPLACER PLUS TARD ⬇️ (agent simulé)
  async function sendToAgent(texteUtilisateur: string): Promise<string> {
    setEnReflexion(true);

    // ---- VERSION SIMULÉE (à supprimer une fois n8n branché) ----
    await attendre(650);
    const etapeActuelle = ETAPES[etape];
    setDonnees((d) => ({ ...d, [etapeActuelle.cle]: texteUtilisateur }));
    const prochaine = etape + 1;
    let reponseAgent: string;
    if (prochaine < ETAPES.length) {
      reponseAgent = ETAPES[prochaine].question;
      setEtape(prochaine);
    } else {
      reponseAgent = "Parfait, j'ai tout ce qu'il me faut. Je prépare votre devis personnalisé.";
      setTermine(true);
    }
    setEnReflexion(false);
    return reponseAgent;

    /* ---- VERSION RÉELLE n8n (à activer quand l'URL existe) ----
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texteUtilisateur, historique: messages }),
      });
      const data = await res.json();
      setEnReflexion(false);
      return data.reponse as string; // adapte selon ce que renvoie ton workflow n8n
    } catch (e) {
      setEnReflexion(false);
      return "Désolé, une erreur est survenue. Réessayez dans un instant.";
    }
    */
  }

  async function envoyer(): Promise<void> {
    const texte = saisie.trim();
    if (!texte || enReflexion) return;
    setMessages((m) => [...m, { auteur: "client", texte }]);
    setSaisie("");
    const reponse = await sendToAgent(texte);
    setMessages((m) => [...m, { auteur: "agent", texte: reponse }]);
  }

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
  }

  return (
    <div className="nt-root">
      <style>{CSS}</style>
        <header className="nt-header">
        <Link href="/" className="nt-logo">
            <span className="nt-logo-mark">✦</span> Neo<span className="nt-logo-bold">travel</span>
            <span className="nt-logo-since">depuis 2010</span>
        </Link>
        <nav className="nt-nav">
            <Link href="/" className="nt-nav-cta">← Accueil</Link>
        </nav>
        </header>
      <main className="nt-main">
        <section className="nt-left">
          <p className="nt-eyebrow"><span className="nt-eyebrow-line" />Transport de groupe sur mesure</p>
          <h1 className="nt-title">Dites-nous où vous allez. <span className="nt-title-accent">On s&apos;occupe du reste.</span></h1>
          <p className="nt-sub">
            Pas de formulaire interminable. Décrivez votre besoin comme à un conseiller :
            notre assistant comprend, complète et prépare votre devis.
          </p>

          <div className="nt-chat" role="log" aria-live="polite">
            <div className="nt-chat-head">
              <span className="nt-dot" /> Conseiller NeoTravel <span className="nt-chat-status">en ligne</span>
            </div>
            <div className="nt-chat-stream">
              {messages.map((m, i) => (
                <div key={i} className={`nt-msg nt-msg-${m.auteur}`}>
                  {m.auteur === "agent" && <span className="nt-ava">✦</span>}
                  <p>{m.texte}</p>
                </div>
              ))}
              {enReflexion && (
                <div className="nt-msg nt-msg-agent">
                  <span className="nt-ava">✦</span>
                  <p className="nt-typing"><span></span><span></span><span></span></p>
                </div>
              )}
              <div ref={finRef} />
            </div>

            {termine ? (
              <button className="nt-cta-final">Recevoir mon devis <ArrowRight size={18} /></button>
            ) : (
              <div className="nt-inputbar">
                <input
                  className="nt-input"
                  value={saisie}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaisie(e.target.value)}
                  onKeyDown={surTouche}
                  placeholder={ETAPES[etape] ? hintFor(ETAPES[etape].cle) : "Votre réponse…"}
                  aria-label="Votre message"
                />
                <button className="nt-send" onClick={envoyer} aria-label="Envoyer" disabled={enReflexion}>
                  <Send size={17} />
                </button>
              </div>
            )}
          </div>

          <div className="nt-trust">
            <span><ShieldCheck size={15} /> Réseau d&apos;autocaristes vérifiés</span>
            <span><Clock size={15} /> Réponse sous 24 h</span>
            <span><Headphones size={15} /> Conseil humain</span>
          </div>
        </section>

        <aside className="nt-summary">
          <div className="nt-card">
            <div className="nt-card-glow" />
            <div className="nt-card-top">
              <div>
                <span className="nt-card-eyebrow">Votre demande</span>
                <span className="nt-card-title">{donnees.besoin || "Transport de groupe"}</span>
              </div>
              <span className="nt-card-icon"><Users size={18} /></span>
            </div>

            <div className="nt-progress">
              <div className="nt-progress-bar" style={{ width: `${(remplis / ETAPES.length) * 100}%` }} />
            </div>
            <span className="nt-progress-label">{remplis}/{ETAPES.length} champs renseignés</span>

            <div className="nt-card-rows">
              {ETAPES.map((e, i) => {
                const Icone = e.icone;
                const valeur = donnees[e.cle];
                const actif = i === etape && !termine;
                return (
                  <div key={e.cle} className={`nt-row ${valeur ? "rempli" : ""} ${actif ? "actif" : ""}`}>
                    <span className="nt-row-ico">{valeur ? <Check size={15} /> : <Icone size={15} />}</span>
                    <div className="nt-row-body">
                      <span className="nt-row-label">{e.label}</span>
                      <span className="nt-row-val">{valeur || (actif ? "En attente de votre réponse…" : "—")}</span>
                    </div>
                    {actif && <span className="nt-row-pulse" />}
                  </div>
                );
              })}
            </div>

            <div className="nt-card-foot">
              <div className="nt-card-meta">
                <div>
                  <span className="nt-meta-label">Référence</span>
                  <span className="nt-meta-val">#NEO-2026-0847</span>
                </div>
                <div className="nt-meta-right">
                  <span className="nt-meta-label">Statut</span>
                  <span className={`nt-badge ${termine ? "ok" : ""}`}>{termine ? "Complète" : "En cours"}</span>
                </div>
              </div>
              <p className="nt-card-note">
                {termine ? "Calcul du devis en cours." : "La carte se complète au fil de la conversation."}
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function hintFor(cle: string): string {
  const h: Record<string, string> = {
    besoin: "Ex : sortie scolaire pour 45 collégiens…",
    depart: "Ville de départ…",
    destination: "Ville d'arrivée…",
    date: "Ex : 15 juillet 2026…",
    passagers: "Nombre de personnes…",
    specifique: "Un besoin particulier, ou « non »…",
  };
  return h[cle] || "Votre réponse…";
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@500&display=swap');

.nt-root{
  --nuit:#1D3557; --nuit-2:#16273F; --bleu:#5784BA; --bleu-d:#446A9B;
  --clair:#B6D8F2; --ciel:#9AC8EB; --rose:#F4CFDF; --rose-d:#C98CA8;
  --fond:#F6F8FB; --fond-2:#ECF2F8; --white:#FFFFFF; --line:#DDE5EE;
  --ink:#1D3557; --muted:#6A7A90;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink); min-height:100vh;
  background:
    radial-gradient(900px 440px at 90% -10%, rgba(154,200,235,.30), transparent 60%),
    radial-gradient(700px 420px at -8% 115%, rgba(244,207,223,.28), transparent 60%),
    var(--fond);
  box-sizing:border-box;
}
.nt-root *{ box-sizing:border-box; }

.nt-header{
  background:var(--nuit); color:#EAF1F8;
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 40px;
}
.nt-logo{ display:flex; align-items:center; gap:9px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:20px; }
.nt-logo-mark{ color:var(--ciel); }
.nt-logo-bold{ color:#fff; margin-left:-4px; }
.nt-logo-since{ font-family:'Spline Sans Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:rgba(234,241,248,.5); border:1px solid rgba(234,241,248,.2); padding:3px 7px; border-radius:6px; margin-left:8px; }
.nt-nav{ display:flex; gap:26px; align-items:center; font-size:14px; color:rgba(234,241,248,.8); }
.nt-nav span{ cursor:pointer; transition:color .15s; }
.nt-nav span:hover{ color:#fff; }
.nt-nav-cta{ border:none; background:var(--ciel); color:var(--nuit) !important; font-weight:600; font-size:14px; font-family:inherit; padding:9px 18px; border-radius:999px; cursor:pointer; }
.nt-nav-cta:hover{ background:#B6D8F2; }

.nt-main{
  max-width:1180px; margin:0 auto; padding:52px 40px 64px;
  display:grid; grid-template-columns:1.5fr 1fr; gap:46px; align-items:start;
}

.nt-eyebrow{ display:flex; align-items:center; gap:10px; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--bleu-d); font-weight:600; margin:0 0 16px; }
.nt-eyebrow-line{ width:26px; height:2px; background:var(--bleu); display:inline-block; }
.nt-title{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; line-height:1.03; font-size:clamp(36px,4.6vw,58px); letter-spacing:-.02em; color:var(--nuit); margin:0 0 18px; }
.nt-title-accent{ color:var(--bleu); }
.nt-sub{ font-size:16.5px; line-height:1.6; color:var(--muted); max-width:500px; margin:0 0 28px; }

.nt-chat{ background:var(--white); border:1px solid var(--line); border-radius:20px; box-shadow:0 30px 60px -34px rgba(29,53,87,.4); overflow:hidden; display:flex; flex-direction:column; }
.nt-chat-head{ display:flex; align-items:center; gap:9px; padding:14px 20px; border-bottom:1px solid var(--line); font-size:13.5px; font-weight:500; color:var(--nuit); background:var(--fond-2); }
.nt-dot{ width:8px; height:8px; border-radius:50%; background:#3FA37E; box-shadow:0 0 0 3px rgba(63,163,126,.18); }
.nt-chat-status{ margin-left:auto; font-size:12px; color:var(--muted); font-weight:400; }

.nt-chat-stream{ padding:20px; display:flex; flex-direction:column; gap:14px; max-height:380px; min-height:250px; overflow-y:auto; }
.nt-msg{ display:flex; align-items:flex-end; gap:8px; max-width:84%; }
.nt-msg p{ margin:0; padding:12px 15px; border-radius:16px; font-size:14.5px; line-height:1.5; }
.nt-msg-agent{ align-self:flex-start; }
.nt-msg-agent p{ background:var(--fond-2); color:var(--ink); border-bottom-left-radius:5px; }
.nt-msg-client{ align-self:flex-end; }
.nt-msg-client p{ background:var(--nuit); color:#EAF1F8; border-bottom-right-radius:5px; }
.nt-ava{ width:28px; height:28px; border-radius:50%; background:var(--nuit); color:var(--ciel); display:grid; place-items:center; font-size:13px; flex-shrink:0; }
.nt-msg p{ animation:rise .34s ease both; }
@keyframes rise{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:none;} }

.nt-typing{ display:flex !important; gap:5px; align-items:center; }
.nt-typing span{ width:7px; height:7px; border-radius:50%; background:var(--muted); opacity:.5; animation:blink 1.2s infinite; }
.nt-typing span:nth-child(2){ animation-delay:.2s; } .nt-typing span:nth-child(3){ animation-delay:.4s; }
@keyframes blink{ 0%,60%,100%{transform:translateY(0);opacity:.4;} 30%{transform:translateY(-4px);opacity:.9;} }

.nt-inputbar{ display:flex; gap:10px; padding:13px; border-top:1px solid var(--line); }
.nt-input{ flex:1; border:1px solid var(--line); border-radius:13px; padding:13px 15px; font-size:15px; font-family:inherit; color:var(--ink); background:var(--fond); outline:none; }
.nt-input:focus{ border-color:var(--bleu); box-shadow:0 0 0 3px rgba(87,132,186,.2); background:#fff; }
.nt-send{ border:none; background:var(--bleu); color:#fff; width:48px; border-radius:13px; display:grid; place-items:center; cursor:pointer; transition:background .15s; }
.nt-send:hover{ background:var(--bleu-d); } .nt-send:disabled{ opacity:.5; cursor:default; }

.nt-cta-final{ margin:13px; padding:16px; border:none; border-radius:14px; cursor:pointer; background:var(--bleu); color:#fff; font-weight:600; font-size:16px; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:9px; animation:rise .4s ease both; }
.nt-cta-final:hover{ background:var(--bleu-d); }

.nt-trust{ display:flex; gap:22px; flex-wrap:wrap; margin-top:18px; font-size:13px; color:var(--muted); }
.nt-trust span{ display:inline-flex; align-items:center; gap:7px; }
.nt-trust svg{ color:var(--bleu); }

.nt-summary{ position:sticky; top:26px; }
.nt-card{ position:relative; background:var(--nuit); color:#E7EEF6; border-radius:22px; padding:24px; box-shadow:0 30px 60px -34px rgba(29,53,87,.6); overflow:hidden; }
.nt-card-glow{ position:absolute; top:-50px; right:-50px; width:160px; height:160px; border-radius:50%; background:radial-gradient(circle, rgba(154,200,235,.35), transparent 70%); }
.nt-card-top{ display:flex; justify-content:space-between; align-items:flex-start; position:relative; }
.nt-card-eyebrow{ display:block; font-family:'Spline Sans Mono',monospace; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:rgba(231,238,246,.55); margin-bottom:4px; }
.nt-card-title{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:19px; color:#fff; }
.nt-card-icon{ width:38px; height:38px; border-radius:11px; background:rgba(154,200,235,.14); color:var(--ciel); display:grid; place-items:center; flex-shrink:0; }

.nt-progress{ height:5px; border-radius:99px; background:rgba(231,238,246,.14); margin:18px 0 8px; overflow:hidden; }
.nt-progress-bar{ height:100%; border-radius:99px; background:var(--ciel); transition:width .5s ease; }
.nt-progress-label{ font-family:'Spline Sans Mono',monospace; font-size:11px; color:rgba(231,238,246,.55); }

.nt-card-rows{ display:flex; flex-direction:column; margin:14px 0 4px; }
.nt-row{ position:relative; display:flex; gap:12px; align-items:center; padding:11px 4px; border-bottom:1px solid rgba(231,238,246,.08); opacity:.5; transition:opacity .35s; }
.nt-row.rempli, .nt-row.actif{ opacity:1; }
.nt-row.actif{ background:rgba(154,200,235,.08); border-radius:10px; padding:11px 10px; border-bottom-color:transparent; }
.nt-row.actif .nt-row-val{ color:var(--ciel); font-style:italic; }
.nt-row-ico{ display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:rgba(231,238,246,.08); color:rgba(231,238,246,.6); flex-shrink:0; }
.nt-row.rempli .nt-row-ico{ background:rgba(63,163,126,.2); color:#7FD8B4; }
.nt-row.actif .nt-row-ico{ background:rgba(154,200,235,.16); color:var(--ciel); }
.nt-row-body{ display:flex; flex-direction:column; min-width:0; }
.nt-row-label{ font-family:'Spline Sans Mono',monospace; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:rgba(231,238,246,.5); }
.nt-row-val{ font-size:14.5px; color:#EAF1F8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.nt-row-pulse{ position:absolute; right:10px; width:7px; height:7px; border-radius:50%; background:var(--rose); box-shadow:0 0 0 0 rgba(244,207,223,.6); animation:pulse 1.6s infinite; }
@keyframes pulse{ 0%{box-shadow:0 0 0 0 rgba(244,207,223,.5);} 70%{box-shadow:0 0 0 8px rgba(244,207,223,0);} 100%{box-shadow:0 0 0 0 rgba(244,207,223,0);} }

.nt-card-foot{ margin-top:14px; padding-top:16px; border-top:1px dashed rgba(231,238,246,.22); }
.nt-card-meta{ display:flex; justify-content:space-between; align-items:flex-start; }
.nt-meta-right{ text-align:right; }
.nt-meta-label{ display:block; font-family:'Spline Sans Mono',monospace; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:rgba(231,238,246,.5); margin-bottom:3px; }
.nt-meta-val{ font-family:'Spline Sans Mono',monospace; font-size:13px; color:#fff; }
.nt-badge{ display:inline-block; font-size:11.5px; font-weight:600; padding:4px 11px; border-radius:999px; background:rgba(244,207,223,.18); color:var(--rose); }
.nt-badge.ok{ background:rgba(63,163,126,.22); color:#7FD8B4; }
.nt-card-note{ margin:12px 0 0; font-size:12px; color:rgba(231,238,246,.55); text-align:center; font-style:italic; }

@media (max-width:900px){
  .nt-main{ grid-template-columns:1fr; gap:26px; padding:30px 18px 50px; }
  .nt-header{ padding:14px 18px; }
  .nt-nav span{ display:none; }
  .nt-logo-since{ display:none; }
  .nt-summary{ position:static; order:-1; }
}
@media (prefers-reduced-motion:reduce){
  .nt-msg p,.nt-cta-final{ animation:none; } .nt-typing span,.nt-row-pulse{ animation:none; }
}

.nt-root a{ text-decoration:none; color:inherit; }
`;
