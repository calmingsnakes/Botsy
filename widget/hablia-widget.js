/* hablia-widget.js — Hablia floating chat widget. No dependencies, shadow-DOM isolated.
   Usage: <script src="…/hablia-widget.js" data-bot="<bot_id>" data-key="bk_live_…"
          [data-api="https://…/v1"] [data-accent="#5b4fe0"] [data-title="Asistente"]></script> */
(function () {
  const S = document.currentScript;
  if (!S) return;
  const botId = S.dataset.bot, key = S.dataset.key;
  const api = (S.dataset.api || "https://hablia-api.artmedinas.workers.dev/v1").replace(/\/$/, "");
  const accent = S.dataset.accent || "#2f2ea8";
  const title = S.dataset.title || "Asistente";
  if (!botId || !key) { console.warn("[hablia] faltan data-bot o data-key"); return; }

  const host = document.createElement("div");
  host.id = "hablia-widget-host";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
  <style>
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .bubble { position: fixed; right: 20px; bottom: 20px; width: 58px; height: 58px; border-radius: 50%;
      background: ${accent}; color: #fff; border: 0; cursor: pointer; box-shadow: 0 6px 24px rgba(0,0,0,.25);
      display: flex; align-items: center; justify-content: center; z-index: 2147483000; transition: transform .15s; }
    .bubble:hover { transform: scale(1.06); }
    .bubble svg { width: 26px; height: 26px; }
    .panel { position: fixed; right: 20px; bottom: 90px; width: min(360px, calc(100vw - 24px));
      height: min(520px, calc(100vh - 120px)); background: #fff; border-radius: 14px; z-index: 2147483001;
      box-shadow: 0 12px 48px rgba(0,0,0,.28); display: none; flex-direction: column; overflow: hidden; }
    :host(.open) .panel { display: flex; }
    .hdr { background: ${accent}; color: #fff; padding: 12px 14px; display: flex; align-items: center; gap: 8px; }
    .hdr b { font-size: 14px; flex: 1; }
    .hdr .x { background: transparent; border: 0; color: #fff; font-size: 18px; cursor: pointer; padding: 2px 6px; }
    .msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f7f7fb; }
    .m { max-width: 85%; padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }
    .m.user { align-self: flex-end; background: ${accent}; color: #fff; border-bottom-right-radius: 4px; }
    .m.bot { align-self: flex-start; background: #fff; color: #23232a; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
    .m.sys { align-self: center; background: #e9e7fb; color: #3d3a75; font-size: 12px; border-radius: 8px; }
    .m.err { align-self: flex-start; background: #fdeaea; color: #8a1f1f; font-size: 12.5px; }
    .frm { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e8e8ee; background: #fff; }
    .frm textarea { flex: 1; resize: none; border: 1px solid #d9d9e3; border-radius: 10px; padding: 9px 11px;
      font-size: 13.5px; outline: none; max-height: 90px; }
    .frm textarea:focus { border-color: ${accent}; }
    .frm button { width: 40px; border: 0; border-radius: 10px; background: ${accent}; color: #fff; cursor: pointer; font-size: 16px; }
    .frm button:disabled { opacity: .5; cursor: default; }
    .tag { text-align: center; font-size: 10.5px; color: #9a9aa8; padding: 4px 0 6px; background: #fff; }
  </style>
  <button class="bubble" aria-label="Abrir chat">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a8.38 8.38 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5z"/></svg>
  </button>
  <div class="panel" role="dialog" aria-label="Chat con ${title}">
    <div class="hdr"><b>${title}</b><button class="x" aria-label="Cerrar">×</button></div>
    <div class="msgs" aria-live="polite"></div>
    <form class="frm"><textarea rows="1" placeholder="Escribe tu mensaje…" aria-label="Mensaje"></textarea><button type="submit" aria-label="Enviar">➤</button></form>
    <div class="tag">Con IA · Hablia</div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const bubble = $(".bubble"), panel = $(".panel"), msgs = $(".msgs"),
        form = $(".frm"), input = $("textarea"), sendBtn = $("button[type=submit]");
  const cidKey = "hablia_cid_" + botId;
  const userRef = "web_" + ((localStorage.getItem("hablia_uid") || (localStorage.setItem("hablia_uid", Math.random().toString(36).slice(2, 10)), localStorage.getItem("hablia_uid"))));
  let busy = false;

  bubble.addEventListener("click", () => { host.classList.toggle("open"); if (host.classList.contains("open")) { input.focus(); if (!msgs.children.length) addMsg("bot", "¡Hola! Escribe tu pregunta y con gusto te ayudo."); } });
  $(".x").addEventListener("click", () => host.classList.remove("open"));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 90) + "px"; });

  function addMsg(cls, text) { const d = document.createElement("div"); d.className = "m " + cls; d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = ""; input.style.height = "auto";
    addMsg("user", text);
    const thinking = addMsg("bot", "…");
    try {
      const cid = sessionStorage.getItem(cidKey) || undefined;
      const res = await fetch(api + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key },
        body: JSON.stringify({ bot_id: botId, conversation_id: cid, channel: "web", text, end_user_ref: userRef }),
      });
      if (!res.ok) {
        let msg = "No pudimos responder. Intenta de nuevo.";
        try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (_) {}
        thinking.remove(); addMsg("err", msg);
      } else {
        const newCid = res.headers.get("x-conversation-id"); if (newCid) sessionStorage.setItem(cidKey, newCid);
        const esc = res.headers.get("x-escalate") === "true";
        const greet = res.headers.get("x-greeting");
        if (greet) msgs.insertBefore(Object.assign(document.createElement("div"), { className: "m sys", textContent: decodeURIComponent(greet) }), thinking);
        const reader = res.body.getReader(); const dec = new TextDecoder();
        thinking.textContent = "";
        for (;;) {
          const { done, value } = await reader.read(); if (done) break;
          thinking.textContent += dec.decode(value, { stream: true });
          msgs.scrollTop = msgs.scrollHeight;
        }
        if (esc) addMsg("sys", "Un humano de nuestro equipo verá esta conversación y te contactará pronto.");
      }
    } catch (err) {
      thinking.remove(); addMsg("err", "Error de conexión con el asistente. Revisa tu internet e intenta otra vez.");
    } finally {
      if (thinking.parentNode && !thinking.textContent.trim()) thinking.remove();
      busy = false; sendBtn.disabled = false; input.focus();
    }
  });
})();
