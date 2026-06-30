"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const N8N_WEBHOOK_URL =
  "https://adelmotte7.app.n8n.cloud/webhook/4c212e1b-c8ac-482f-b552-278da8eb2985/chat";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "user-12345678", chatInput: text }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const raw = await response.text();
      let botText = raw;

      try {
        // Tente d'abord de parser comme NDJSON (streaming n8n)
        const lines = raw.split("\n").filter((l) => l.trim() !== "");
        const parsed = lines.map((l) => JSON.parse(l) as { type?: string; content?: string; output?: string; text?: string; message?: string });

        const items = parsed.filter((obj) => obj.type === "item" && obj.content !== undefined);
        if (items.length > 0) {
          botText = items.map((obj) => obj.content).join("");
        } else {
          // Pas de items streaming, on prend le premier objet lisible
          const first = parsed[0];
          botText = first?.output ?? first?.text ?? first?.message ?? raw;
        }
      } catch {
      }

      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'envoi.";
      setMessages((prev) => [...prev, { role: "bot", text: message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le chatbot"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-700"
      >
        {open ? (
          /* icone X */
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* icone chat */
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.852L3 20l1.09-3.272C3.4 15.56 3 13.832 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Fenetre du chatbot */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden sm:w-96">
          {/* En-tete */}
          <div className="flex items-center gap-2 bg-zinc-900 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.852L3 20l1.09-3.272C3.4 15.56 3 13.832 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Assistant NeoTravel</p>
              <p className="text-xs text-zinc-400">Posez votre question</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "360px", minHeight: "200px" }}>
            {messages.length === 0 && (
              <p className="text-center text-sm text-zinc-400">
                Bonjour ! Comment puis-je vous aider ?
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white rounded-br-sm"
                      : "bg-zinc-100 text-zinc-900 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Saisie */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-zinc-200 px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre message..."
              disabled={loading}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40"
              aria-label="Envoyer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
