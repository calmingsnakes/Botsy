// Landing behaviour: 3 demo bots (Worker if reachable, scripted otherwise), animated Master Document diff, services by persona.
import { BRAND } from "../src/brand";
import { DEMO_BOTS, scriptedReply } from "./demo-chat";

const API_URL = import.meta.env.VITE_API_URL || "";
const MAX_TURNS = 8;

document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = BRAND));
document.title = `${BRAND} · Agentes de IA en español para tu negocio`;

// ---------- live counter (honest: demos + own support). Real value comes from the Worker when available.
async function counter() {
  let n = 0;
  try { if (API_URL) { const r = await fetch(`${API_URL}/v1/demo/stats`); if (r.ok) n = (await r.json()).conversations ?? 0; } } catch { /* offline */ }
  if (!n) n = Number(localStorage.getItem("demo_conversations") ?? 0);
  document.querySelectorAll("[data-counter]").forEach((el) => (el.textContent = new Intl.NumberFormat("es-MX").format(n)));
}
counter();

// ---------- demo chat
const tabsEl = document.querySelector(".demo-tabs");
const msgsEl = document.getElementById("msgs");
const startersEl = document.getElementById("starters");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const note = document.getElementById("demo-note");
let current = "nube-contable";
let history = [];
let session = Math.random().toString(36).slice(2);
let live = false;

if (API_URL) fetch(`${API_URL}/health`).then((r) => { live = r.ok; }).catch(() => (live = false));

function render() {
  tabsEl.innerHTML = Object.values(DEMO_BOTS).map((b) => `<button role="tab" aria-selected="${b.id === current}" class="${b.id === current ? "active" : ""}" data-bot="${b.id}">${b.tab}</button>`).join("");
  const bot = DEMO_BOTS[current];
  history = [{ role: "assistant", content: bot.greeting }];
  session = Math.random().toString(36).slice(2);
  paint();
  startersEl.innerHTML = bot.starters.map((s) => `<button type="button">${s}</button>`).join("");
  note.textContent = `${bot.note} · ${MAX_TURNS} mensajes por sesión.`;
}
function paint(typing = false) {
  msgsEl.innerHTML = history.map((m) => `<div class="m ${m.role}">${escapeHtml(m.content)}</div>`).join("") + (typing ? `<div class="typing">escribiendo…</div>` : "");
  msgsEl.scrollTop = msgsEl.scrollHeight;
}
const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

tabsEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { current = b.dataset.bot; render(); } });
startersEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { input.value = b.textContent; form.requestSubmit(); } });
document.querySelectorAll("[data-open-demo]").forEach((b) => b.addEventListener("click", () => { current = b.dataset.openDemo; render(); document.getElementById("demo").scrollIntoView({ behavior: "smooth" }); }));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const userTurns = history.filter((m) => m.role === "user").length;
  if (userTurns >= MAX_TURNS) { history.push({ role: "system", content: "Fin de la demo. ¿Quieres verlo con tus propios documentos? Agenda un piloto abajo." }); paint(); return; }
  history.push({ role: "user", content: text });
  input.value = "";
  paint(true);
  localStorage.setItem("demo_conversations", String(Number(localStorage.getItem("demo_conversations") ?? 0) + (userTurns === 0 ? 1 : 0)));
  counter();
  let reply = "";
  if (live) {
    try {
      const res = await fetch(`${API_URL}/v1/demo/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bot: current, session, messages: history.filter((m) => m.role !== "system") }) });
      if (res.ok && res.body) {
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        history.push({ role: "assistant", content: "" });
        while (true) { const { value, done } = await reader.read(); if (done) break; history[history.length - 1].content += value; paint(); }
        return;
      }
      if (res.status === 429) { const j = await res.json(); history.push({ role: "system", content: j.message }); paint(); return; }
    } catch { /* fall back to scripted */ }
  }
  reply = scriptedReply(current, text, history);
  history.push({ role: "assistant", content: "" });
  for (const w of reply.split(" ")) { await new Promise((r) => setTimeout(r, 26)); history[history.length - 1].content += w + " "; paint(); }
});
render();

// ---------- Master Document diff animation (signature element)
const instruction = "Ya cambió la política de devoluciones: ahora son 30 días, no 15";
const typed = document.getElementById("dm-typed");
const diff = document.getElementById("dm-diff");
const done = document.getElementById("dm-done");
let played = false;
function playDm() {
  if (played) return; played = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { typed.textContent = instruction; diff.hidden = false; return; }
  let i = 0;
  const t = setInterval(() => { typed.textContent = instruction.slice(0, ++i); if (i >= instruction.length) { clearInterval(t); setTimeout(() => (diff.hidden = false), 500); } }, 32);
}
new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && playDm(), { threshold: 0.4 }).observe(document.getElementById("dm-demo"));
document.getElementById("dm-approve").addEventListener("click", () => { diff.hidden = true; done.hidden = false; });

// ---------- services by persona (subset of the 20 in compendio 02)
const SERVICES = {
  p1: [["SVC-01", "Recepcionista virtual 24/7", "Horarios, servicios, precios, recados y agenda. No pierdes ni un mensaje a las 11 pm.", 1490], ["SVC-05", "Calificador de leads", "Pregunta lo justo, agenda la visita y entrega la ficha a tu asesor.", 2990], ["SVC-07", "Postventa y retroalimentación", "Conversa con tus clientes después de la entrega y detecta a los que están en riesgo.", 1990], ["SVC-08", "Recordatorios y cobranza amable", "Pagos y documentos pendientes con lenguaje conforme a la ley.", 1990], ["SVC-06", "Cotizador conversacional", "Lee tu lista de precios y arma cotizaciones en PDF.", 2990], ["SVC-09", "Agenda de citas por voz", "Un número que contesta, agenda y confirma. Anuncia que es IA.", 3990]],
  p2: [["SVC-03", "Soporte por correo nivel 1", "Clasifica, responde con tu documentación y escala lo sensible con resumen.", 4990], ["SVC-02", "Estatus de pedido y devoluciones", "Conectado a tu tienda y paquetería; aplica tu política sin discutir.", 3990], ["SVC-04", "Asistente de onboarding", "Guía paso a paso dentro de tu producto y detecta dónde se atoran.", 3490], ["SVC-18", "Rayos X mensual", "Informe ejecutivo con hallazgos y recomendaciones sobre cualquier bot.", 2490], ["SVC-11", "TI nivel 0", "Contraseñas, accesos y VPN; crea el ticket cuando no puede.", 2990]],
  p3: [["SVC-14", "Inducción de nuevo ingreso", "Cultura, políticas y cuestionario de comprensión con registro.", 3490], ["SVC-12", "Entrenador de rol: atención", "Simula clientes difíciles, califica con rúbrica y reporta al supervisor.", 4990], ["SVC-13", "Entrenador de rol: ventas", "Objeciones, negociación y cumplimiento normativo, por texto o voz.", 5990], ["SVC-10", "FAQ interno para empleados", "Prestaciones, procesos y políticas; te dice dónde falla la comunicación interna.", 2490]],
  p4: [["SVC-15", "Entrenador de brigadas", "Incendio, sismo, derrame, primeros auxilios con tu contenido; registro de práctica.", 6990], ["SVC-16", "Simulacro guiado y bitácora", "Guion, cronómetro, lista de asistencia e informe como evidencia.", 3990], ["SVC-17", "Actualizador de protocolos", "Cambia una norma y notifica a cada persona afectada hasta que confirme.", 2990]],
};
const servicesEl = document.getElementById("services");
function paintServices(p) {
  servicesEl.innerHTML = SERVICES[p].map(([c, n, d, price]) => `<article><span class="code">${c}</span><h3>${n}</h3><p>${d}</p><div class="price">$${price.toLocaleString("es-MX")} <span>/mes + IVA</span></div></article>`).join("");
}
document.querySelector(".persona-tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll(".persona-tabs button").forEach((x) => x.classList.toggle("active", x === b)); paintServices(b.dataset.p); });
paintServices("p1");

// ---------- pilot form (demo: no backend yet)
document.getElementById("pilot-form").addEventListener("submit", (e) => { e.preventDefault(); e.target.innerHTML = `<p style="grid-column:1/-1;font-weight:600">¡Gracias! Te escribimos en menos de 4 horas hábiles. (Demo: el formulario se conectará a Brevo/Worker.)</p>`; });
