"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, ArrowRight, ShieldCheck, Clock, Headphones, MessageCircle } from "lucide-react";
import Link from "next/link";

/*
  ┌──────────────────────────────────────────────────────────────────────┐
  │  NEOTRAVEL — Chat connecté au vrai agent n8n                           │
  │  À placer dans app/chat/page.tsx                                       │
  │                                                                        │
  │  Connexion réelle (reprise du composant d'Alexandre) :                 │
  │  - on envoie { sessionId, chatInput } au webhook n8n                   │
  │  - n8n répond en NDJSON (plusieurs lignes JSON) ou en JSON simple      │
  │  - on extrait le texte à afficher selon le format reçu                 │
  │                                                                        │
  │  IMPORTANT : la carte de droite est maintenant générique (nombre       │
  │  d'échanges, statut) car on ne contrôle plus l'ordre des questions     │
  │  posées par l'agent réel (contrairement à la version simulée).         │
  └──────────────────────────────────────────────────────────────────────┘
*/

const N8N_WEBHOOK_URL =
  "https://adelmotte7.app.n8n.cloud/webhook/4c212e1b-c8ac-482f-b552-278da8eb2985/chat";

type Message = { auteur: "agent" | "client"; texte: string };

const MESSAGE_ACCUEIL =
  "Bonjour, je suis votre conseiller NeoTravel. Décrivez-moi en quelques mots votre projet de transport de groupe.";

export default function NeoTravelChat() {
  const [messages, setMessages] = useState<Message[]>([{ auteur: "agent", texte: MESSAGE_ACCUEIL }]);
  const [saisie, setSaisie] = useState<string>("");
  const [enReflexion, setEnReflexion] = useState<boolean>(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Un identifiant unique par visite, pour que n8n garde le fil de la conversation
  const [sessionId, setSessionId] = useState<string>(() => "user-" + Math.random().toString(36).slice(2, 10));
  const [reference] = useState<string>(() => "NEO-2026-" + Math.floor(1000 + Math.random() * 9000));

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, enReflexion]);

  const echanges = messages.filter((m) => m.auteur === "client").length;

  // ── Appel réel à l'agent n8n ──────────────────────────────────────────
  async function sendToAgent(texteUtilisateur: string): Promise<string> {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, chatInput: texteUtilisateur }),
      });

      if (!response.ok) throw new Error(`Erreur serveur : ${response.status}`);

      const raw = await response.text();
      let botText = raw;

      try {
        // n8n peut répondre en NDJSON (une ligne JSON par morceau de réponse)
        const lignes = raw.split("\n").filter((l) => l.trim() !== "");
        const parsed = lignes.map(
          (l) => JSON.parse(l) as { type?: string; content?: string; output?: string; text?: string; message?: string }
        );
        const items = parsed.filter((o) => o.type === "item" && o.content !== undefined);
        if (items.length > 0) {
          botText = items.map((o) => o.content).join("");
        } else {
          const first = parsed[0];
          botText = first?.output ?? first?.text ?? first?.message ?? raw;
        }
      } catch {
        // Pas du NDJSON : on garde le texte brut tel quel
      }

      return botText;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi.";
      return `Désolé, une erreur est survenue (${msg}). Réessayez dans un instant.`;
    }
  }

  async function envoyer(): Promise<void> {
    const texte = saisie.trim();
    if (!texte || enReflexion) return;
    setMessages((m) => [...m, { auteur: "client", texte }]);
    setSaisie("");
    setEnReflexion(true);
    const reponse = await sendToAgent(texte);
    setMessages((m) => [...m, { auteur: "agent", texte: reponse }]);
    setEnReflexion(false);
  }

  function nouvelleConversation(): void {
    setSessionId("user-" + Math.random().toString(36).slice(2, 10));
    setMessages([{ auteur: "agent", texte: MESSAGE_ACCUEIL }]);
    setSaisie("");
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
          <button className="nt-nav-cta" onClick={nouvelleConversation}>Nouvelle conversation</button>
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

            <div className="nt-inputbar">
              <input
                className="nt-input"
                value={saisie}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaisie(e.target.value)}
                onKeyDown={surTouche}
                placeholder="Écrivez votre réponse…"
                aria-label="Votre message"
                disabled={enReflexion}
              />
              <button className="nt-send" onClick={envoyer} aria-label="Envoyer" disabled={enReflexion || !saisie.trim()}>
                <Send size={17} />
              </button>
            </div>
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
                <span className="nt-card-eyebrow">Suivi de votre demande</span>
                <span className="nt-card-title">Transport de groupe</span>
              </div>
              <span className="nt-card-icon"><MessageCircle size={18} /></span>
            </div>

            <div className="nt-card-rows">
              <div className="nt-row rempli">
                <span className="nt-row-ico">💬</span>
                <div className="nt-row-body">
                  <span className="nt-row-label">Échanges</span>
                  <span className="nt-row-val">{echanges} message{echanges > 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="nt-row rempli">
                <span className="nt-row-ico">🤖</span>
                <div className="nt-row-body">
                  <span className="nt-row-label">Assistant</span>
                  <span className="nt-row-val">{enReflexion ? "En train d'écrire…" : "À votre écoute"}</span>
                </div>
              </div>
            </div>

            <div className="nt-card-foot">
              <div className="nt-card-meta">
                <div>
                  <span className="nt-meta-label">Référence</span>
                  <span className="nt-meta-val">#{reference}</span>
                </div>
                <div className="nt-meta-right">
                  <span className="nt-meta-label">Statut</span>
                  <span className="nt-badge">En cours</span>
                </div>
              </div>
              <p className="nt-card-note">Votre devis sera calculé dès que l&apos;assistant aura toutes les informations.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Inter:wght@400;500;600&family=Spline+Sans+Mono:wght@500&display=swap');

.nt-root{
  --nuit:#1D3557; --bleu:#5784BA; --bleu-d:#446A9B; --ciel:#9AC8EB; --clair:#B6D8F2;
  --rose:#F4CFDF; --fond:#F6F8FB; --fond-2:#ECF2F8; --white:#FFFFFF; --line:#DDE5EE;
  --ink:#1D3557; --muted:#6A7A90;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink); min-height:100vh;
  background:
    radial-gradient(900px 440px at 90% -10%, rgba(154,200,235,.30), transparent 60%),
    radial-gradient(700px 420px at -8% 115%, rgba(244,207,223,.28), transparent 60%),
    var(--fond);
  box-sizing:border-box;
}
.nt-root *{ box-sizing:border-box; }
.nt-root a{ text-decoration:none; color:inherit; }

.nt-header{ background:var(--nuit); color:#EAF1F8; display:flex; align-items:center; justify-content:space-between; padding:16px 40px; }
.nt-logo{ display:flex; align-items:center; gap:9px; font-family:'Bricolage Grotesque',sans-serif; font-weight:700; font-size:20px; }
.nt-logo-mark{ color:var(--ciel); }
.nt-logo-bold{ color:#fff; margin-left:-4px; }
.nt-logo-since{ font-family:'Spline Sans Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:rgba(234,241,248,.5); border:1px solid rgba(234,241,248,.2); padding:3px 7px; border-radius:6px; margin-left:8px; }
.nt-nav{ display:flex; gap:18px; align-items:center; }
.nt-nav-cta{ border:none; background:var(--ciel); color:var(--nuit) !important; font-weight:600; font-size:14px; font-family:inherit; padding:9px 18px; border-radius:999px; cursor:pointer; }
.nt-nav-cta:hover{ background:var(--clair); }

.nt-main{ max-width:1180px; margin:0 auto; padding:52px 40px 64px; display:grid; grid-template-columns:1.5fr 1fr; gap:46px; align-items:start; }

.nt-eyebrow{ display:flex; align-items:center; gap:10px; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--bleu-d); font-weight:600; margin:0 0 16px; }
.nt-eyebrow-line{ width:26px; height:2px; background:var(--bleu); display:inline-block; }
.nt-title{ font-family:'Bricolage Grotesque',sans-serif; font-weight:700; line-height:1.03; font-size:clamp(36px,4.6vw,58px); letter-spacing:-.02em; color:var(--nuit); margin:0 0 18px; }
.nt-title-accent{ color:var(--bleu); }
.nt-sub{ font-size:16.5px; line-height:1.6; color:var(--muted); max-width:500px; margin:0 0 28px; }

.nt-chat{ background:var(--white); border:1px solid var(--line); border-radius:20px; box-shadow:0 30px 60px -34px rgba(29,53,87,.4); overflow:hidden; display:flex; flex-direction:column; }
.nt-chat-head{ display:flex; align-items:center; gap:9px; padding:14px 20px; border-bottom:1px solid var(--line); font-size:13.5px; font-weight:500; color:var(--nuit); background:var(--fond-2); }
.nt-dot{ width:8px; height:8px; border-radius:50%; background:#3FA37E; box-shadow:0 0 0 3px rgba(63,163,126,.18); }
.nt-chat-status{ margin-left:auto; font-size:12px; color:var(--muted); font-weight:400; }

.nt-chat-stream{ padding:20px; display:flex; flex-direction:column; gap:14px; max-height:420px; min-height:280px; overflow-y:auto; }
.nt-msg{ display:flex; align-items:flex-end; gap:8px; max-width:84%; }
.nt-msg p{ margin:0; padding:12px 15px; border-radius:16px; font-size:14.5px; line-height:1.5; white-space:pre-wrap; }
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
.nt-input:disabled{ opacity:.6; }
.nt-send{ border:none; background:var(--bleu); color:#fff; width:48px; border-radius:13px; display:grid; place-items:center; cursor:pointer; transition:background .15s; flex-shrink:0; }
.nt-send:hover{ background:var(--bleu-d); } .nt-send:disabled{ opacity:.5; cursor:default; }

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

.nt-card-rows{ display:flex; flex-direction:column; margin:18px 0 4px; }
.nt-row{ position:relative; display:flex; gap:12px; align-items:center; padding:13px 4px; border-bottom:1px solid rgba(231,238,246,.08); }
.nt-row-ico{ display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:rgba(154,200,235,.14); font-size:14px; flex-shrink:0; }
.nt-row-body{ display:flex; flex-direction:column; min-width:0; }
.nt-row-label{ font-family:'Spline Sans Mono',monospace; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:rgba(231,238,246,.5); }
.nt-row-val{ font-size:14.5px; color:#EAF1F8; }

.nt-card-foot{ margin-top:14px; padding-top:16px; border-top:1px dashed rgba(231,238,246,.22); }
.nt-card-meta{ display:flex; justify-content:space-between; align-items:flex-start; }
.nt-meta-right{ text-align:right; }
.nt-meta-label{ display:block; font-family:'Spline Sans Mono',monospace; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:rgba(231,238,246,.5); margin-bottom:3px; }
.nt-meta-val{ font-family:'Spline Sans Mono',monospace; font-size:13px; color:#fff; }
.nt-badge{ display:inline-block; font-size:11.5px; font-weight:600; padding:4px 11px; border-radius:999px; background:rgba(244,207,223,.18); color:var(--rose); }
.nt-card-note{ margin:12px 0 0; font-size:12px; color:rgba(231,238,246,.55); text-align:center; font-style:italic; }

@media (max-width:900px){
  .nt-main{ grid-template-columns:1fr; gap:26px; padding:30px 18px 50px; }
  .nt-header{ padding:14px 18px; }
  .nt-summary{ position:static; order:-1; }
}
@media (prefers-reduced-motion:reduce){
  .nt-msg p{ animation:none; } .nt-typing span{ animation:none; }
}
`;
