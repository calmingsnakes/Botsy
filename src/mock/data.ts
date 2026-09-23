import type * as T from "../lib/types";
import { BRAND } from "../brand";

// Deterministic pseudo-random so the demo looks the same on every load.
let seed = 42;
export const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = <X,>(arr: X[]) => arr[Math.floor(rnd() * arr.length)];
const daysAgo = (d: number, h = 10) => new Date(Date.now() - d * 86400000 - (24 - h) * 3600000 + Math.floor(rnd() * 3600000)).toISOString();

export const ORG: T.Org = { id: "org_demo", name: "Panadería La Espiga (demo)", plan: "crecimiento", monthly_conversation_budget: 3000, overage_allowed: false, rfc: "PES010203ABC", billing_email: "ana@laespiga.mx" };
export const USER = { id: "usr_ana", name: "Ana Rodríguez", email: "ana@laespiga.mx" };

export const BOTS: T.Bot[] = [
  { id: "bot_recepcion", org_id: ORG.id, name: "Espi — Recepción 24/7", service_code: "SVC-01", status: "active", model: "claude-haiku-4-5", provider: "anthropic", language: "es-MX", published_version: 7, kpi_name: "resolución sin humano", kpi_target: 0.6, kpi_current: 0.68, created_at: daysAgo(60) },
  { id: "bot_pedidos", org_id: ORG.id, name: "Pedidos y devoluciones", service_code: "SVC-02", status: "active", model: "claude-sonnet-5", provider: "anthropic", language: "es-MX", published_version: 3, kpi_name: "WISMO resuelto sin humano", kpi_target: 0.7, kpi_current: 0.74, created_at: daysAgo(30) },
  { id: "bot_induccion", org_id: ORG.id, name: "Inducción de nuevos panaderos", service_code: "SVC-14", status: "draft", model: "claude-sonnet-5", provider: "anthropic", language: "es-MX", published_version: 0, kpi_name: "aprobados en semana 1", kpi_target: 0.9, kpi_current: 0, created_at: daysAgo(3) },
];

export const DM: Record<string, T.MasterDocument> = {
  bot_recepcion: {
    identity: { name: "Espi", company: "Panadería La Espiga", persona: "recepcionista virtual", locale: "español de México" },
    objective: "Atender preguntas de clientes 24/7, tomar pedidos para recoger y agendar pasteles personalizados sin intervención humana.",
    scope: { in: ["horarios y sucursales", "menú y precios", "pedidos para recoger", "pasteles personalizados", "facturación"], out: ["quejas formales", "empleo", "proveedores", "alergias severas (deriva a sucursal)"] },
    tone: { register: "tú", style: "cálido, cercano, con el lenguaje de una panadería de barrio; breve", max_sentences: 4, emojis: true },
    hard_rules: ["Nunca prometas entregas a domicilio: solo recogemos en sucursal.", "Los pasteles personalizados requieren 48 horas de anticipación; nunca aceptes menos.", "No des información nutricional ni de alérgenos: deriva a la sucursal.", "Si preguntan por facturación, pide RFC y correo y di que se envía en 24 horas."],
    escalation: { triggers: ["cliente pide humano", "queja", "pedido mayor a 20 piezas", "enojo"], summary_to: "ana@laespiga.mx", hours: "lunes a domingo 7:00–21:00" },
    data_policy: { may_collect: ["nombre", "teléfono", "RFC (solo facturación)"], never_collect: ["datos de tarjeta", "datos de salud"], privacy_notice_url: "https://laespiga.mx/privacidad" },
    sources: [{ title: "Menú y precios septiembre 2026", priority: 1 }, { title: "Política de pedidos y pasteles", priority: 2 }, { title: "Sucursales y horarios", priority: 3 }],
    kpi: { name: "resolución sin humano", target: 0.6 },
  },
  bot_pedidos: {
    identity: { name: "Espi Pedidos", company: "Panadería La Espiga", persona: "asistente de pedidos en línea", locale: "español de México" },
    objective: "Informar el estatus de pedidos en línea y gestionar devoluciones según la política vigente.",
    scope: { in: ["estatus de pedido", "devoluciones y cambios", "problemas con el pedido"], out: ["pedidos nuevos", "facturación"] },
    tone: { register: "tú", style: "resolutivo y empático", max_sentences: 4, emojis: false },
    hard_rules: ["Solo acepta devoluciones dentro de 24 horas con ticket.", "Nunca prometas reembolsos en efectivo: son en monedero.", "Confirma el número de pedido antes de dar cualquier estatus."],
    escalation: { triggers: ["cliente pide humano", "producto en mal estado", "enojo"], summary_to: "pedidos@laespiga.mx", hours: "lunes a sábado 8:00–20:00" },
    data_policy: { may_collect: ["número de pedido", "nombre", "teléfono"], never_collect: ["datos de tarjeta"], privacy_notice_url: "https://laespiga.mx/privacidad" },
    sources: [{ title: "Política de devoluciones", priority: 1 }, { title: "Integración con tienda en línea", priority: 2 }],
    kpi: { name: "WISMO resuelto sin humano", target: 0.7 },
  },
  bot_induccion: {
    identity: { name: "Maestro Panadero", company: "Panadería La Espiga", persona: "instructor de inducción", locale: "español de México" },
    objective: "Inducir a nuevos panaderos en higiene, procesos y cultura de La Espiga con cuestionarios y registro.",
    scope: { in: ["higiene y seguridad alimentaria", "procesos de producción", "cultura y valores", "cuestionarios"], out: ["nómina", "quejas laborales", "decisiones disciplinarias"] },
    tone: { register: "tú", style: "didáctico y motivador; una pregunta a la vez", max_sentences: 5, emojis: false },
    hard_rules: ["Aclara que la inducción no sustituye la capacitación obligatoria ni constancias DC-3.", "No respondas preguntas de nómina: deriva a RH."],
    escalation: { triggers: ["empleado pide humano", "reporte de acoso o accidente"], summary_to: "rh@laespiga.mx", hours: "lunes a viernes 9:00–18:00" },
    data_policy: { may_collect: ["nombre", "número de empleado"], never_collect: ["datos de salud", "datos sensibles"], privacy_notice_url: "https://laespiga.mx/privacidad-empleados" },
    sources: [{ title: "Manual de higiene", priority: 1 }, { title: "Procesos de producción", priority: 2 }],
    kpi: { name: "aprobados en semana 1", target: 0.9 },
  },
};

export const VERSIONS: Record<string, T.DmVersion[]> = {
  bot_recepcion: [7, 6, 5, 4, 3, 2, 1].map((v) => ({ version: v, reason: ["Pasteles personalizados: 48 h en vez de 24 h", "Nueva sucursal Coyoacán", "Precios de septiembre", "Sin entregas a domicilio", "Tono con emojis", "Horario domingo", "Versión inicial"][7 - v], published_at: daysAgo((8 - v) * 7), published_by: "Ana Rodríguez" })),
  bot_pedidos: [3, 2, 1].map((v) => ({ version: v, reason: ["Reembolsos en monedero", "Ventana de 24 h", "Versión inicial"][3 - v], published_at: daysAgo((4 - v) * 9), published_by: "Ana Rodríguez" })),
  bot_induccion: [],
};

export const SOURCES: T.KnowledgeSource[] = [
  { id: "src_menu", bot_id: "bot_recepcion", kind: "xlsx", title: "Menú y precios septiembre 2026.xlsx", status: "ready", chunk_count: 14, sample_questions: ["¿Cuánto cuesta la concha?", "¿Tienen pan sin azúcar?", "¿Qué pasteles manejan?"], priority: 1, created_at: daysAgo(12) },
  { id: "src_pol", bot_id: "bot_recepcion", kind: "pdf", title: "Política de pedidos y pasteles.pdf", status: "ready", chunk_count: 6, sample_questions: ["¿Con cuánta anticipación pido un pastel?", "¿Hacen entregas a domicilio?", "¿Puedo cancelar un pedido?"], priority: 2, created_at: daysAgo(40) },
  { id: "src_suc", bot_id: "bot_recepcion", kind: "url", title: "laespiga.mx/sucursales", status: "ready", chunk_count: 3, sample_questions: ["¿A qué hora abren en Coyoacán?", "¿Dónde están?", "¿Abren domingos?"], priority: 3, created_at: daysAgo(20) },
  { id: "src_foto", bot_id: "bot_recepcion", kind: "pdf", title: "Promociones octubre (escaneado).pdf", status: "failed", error: "No pude leer este PDF porque es una imagen. Sube la versión en Word o toma foto con la app de Notas.", chunk_count: 0, sample_questions: [], priority: 100, created_at: daysAgo(1) },
  { id: "src_dev", bot_id: "bot_pedidos", kind: "docx", title: "Política de devoluciones.docx", status: "ready", chunk_count: 4, sample_questions: ["¿Puedo devolver un pastel?", "¿Cómo me reembolsan?", "¿Cuánto tiempo tengo?"], priority: 1, created_at: daysAgo(28) },
  { id: "src_hig", bot_id: "bot_induccion", kind: "pdf", title: "Manual de higiene.pdf", status: "processing", chunk_count: 0, sample_questions: [], priority: 1, created_at: daysAgo(0) },
];

export const CHANNELS: T.Channel[] = [
  { id: "ch_web", bot_id: "bot_recepcion", type: "web", enabled: true, ai_disclosure_confirmed: true, privacy_notice_url: "https://laespiga.mx/privacidad", config: { allowed_origins: ["https://laespiga.mx"] } },
  { id: "ch_wa", bot_id: "bot_recepcion", type: "whatsapp", enabled: true, ai_disclosure_confirmed: true, privacy_notice_url: "https://laespiga.mx/privacidad", config: { phone_number: "+52 55 1234 5678" } },
  { id: "ch_voice", bot_id: "bot_recepcion", type: "voice", enabled: false, ai_disclosure_confirmed: false, config: {} },
  { id: "ch_web2", bot_id: "bot_pedidos", type: "web", enabled: true, ai_disclosure_confirmed: true, privacy_notice_url: "https://laespiga.mx/privacidad", config: { allowed_origins: ["https://tienda.laespiga.mx"] } },
  { id: "ch_email", bot_id: "bot_pedidos", type: "email", enabled: false, ai_disclosure_confirmed: false, config: { inbound_address: "pedidos@laespiga.mx" } },
];

const TOPICS = ["horarios", "precios", "pasteles personalizados", "pedido para recoger", "facturación", "entrega a domicilio", "estatus de pedido", "devolución", "sucursal nueva", "alérgenos", "empleo", "promociones"];
const STATUSES: T.ConversationStatus[] = ["resolved_by_bot", "resolved_by_bot", "resolved_by_bot", "resolved_by_bot", "escalated", "resolved_by_human", "abandoned", "open"];

export const CONVERSATIONS: T.Conversation[] = Array.from({ length: 48 }, (_, i) => {
  const bot = i % 3 === 2 ? "bot_pedidos" : "bot_recepcion";
  const topic = pick(TOPICS);
  const status = pick(STATUSES);
  const confidence: T.Confidence = topic === "alérgenos" || topic === "empleo" || topic === "promociones" ? "red" : topic === "entrega a domicilio" ? "yellow" : "green";
  const turns = 2 + Math.floor(rnd() * 5);
  return {
    id: `conv_${String(i + 1).padStart(3, "0")}`, bot_id: bot, channel_type: pick(["web", "whatsapp", "whatsapp", "web"] as T.ChannelType[]), status, confidence, topic,
    sentiment: (status === "escalated" ? "negative" : pick(["positive", "neutral", "neutral", "positive"])) as T.Conversation["sentiment"], resolved_by_bot: status === "resolved_by_bot",
    turns, total_cost_usd: Number((turns * 0.0045).toFixed(4)), started_at: daysAgo(Math.floor(i / 2), 8 + (i % 12)),
    escalated_at: status === "escalated" ? daysAgo(Math.floor(i / 2), 9 + (i % 12)) : undefined,
    handoff_summary: status === "escalated" ? `Cliente pregunta por ${topic}; ya se le explicó la política y pide hablar con una persona. Sentimiento: molesto. Teléfono capturado.` : undefined,
    end_user_ref: `u${(1000 + i * 37) % 9999}`,
  };
}).sort((a, b) => b.started_at.localeCompare(a.started_at));

export function messagesFor(c: T.Conversation): T.Message[] {
  const base = new Date(c.started_at).getTime();
  const t = (s: number) => new Date(base + s * 1000).toISOString();
  const dm = DM[c.bot_id];
  const greeting = `Hola, soy ${dm.identity.name}, el asistente virtual de ${dm.identity.company}. Soy una inteligencia artificial. Puedo ayudarte con ${dm.scope.in.slice(0, 3).join(", ")} y en cualquier momento puedes escribir "humano" para que te atienda una persona.`;
  const scripts: Record<string, [string, string, string?][]> = {
    "pasteles personalizados": [["Hola, quiero un pastel para el sábado con foto de mi hija", "¡Qué bonito! 🎂 Los pasteles personalizados los preparamos con 48 horas de anticipación, así que para el sábado necesito tu pedido hoy antes de las 6 pm. ¿De cuántas personas y qué sabor te gustaría?", "Política de pedidos y pasteles.pdf"], ["Para 20 personas, de tres leches", "Perfecto: pastel de tres leches para 20 personas con foto impresa comestible, $890. Lo recoges el sábado en la sucursal que elijas desde las 9 am. ¿Me compartes tu nombre y teléfono para apartarlo?", "Menú y precios septiembre 2026.xlsx"]],
    "entrega a domicilio": [["¿Hacen entregas a domicilio?", "Por ahora no hacemos entregas a domicilio; todos los pedidos se recogen en sucursal. 🙂 Tenemos 4 sucursales: Roma, Condesa, Del Valle y Coyoacán. ¿Te queda alguna cerca?", "Política de pedidos y pasteles.pdf"]],
    "alérgenos": [["¿La concha tiene nuez? Mi hijo es alérgico", "Para alergias prefiero que te lo confirmen directamente en la sucursal, donde pueden revisar los ingredientes del día; no quiero darte un dato incorrecto. ¿Te paso el teléfono de la sucursal más cercana o prefieres que te atienda una persona ahora?"]],
    "devolución": [["Mi pedido 4471 llegó con el pastel aplastado", "Lamento mucho eso. Confirmo: pedido 4471. Como fue hoy y tienes tu ticket, aplica cambio o devolución en monedero dentro de las 24 horas. ¿Prefieres que te lo repongamos hoy mismo en sucursal o abono a monedero?", "Política de devoluciones.docx"], ["Quiero hablar con alguien, esto es inaceptable", "Entiendo tu molestia y tienes razón en querer una solución rápida. Te paso con una persona del equipo ahora mismo; ya le envié el resumen para que no tengas que repetir nada."]],
  };
  const script = scripts[c.topic ?? ""] ?? [["Hola, ¿a qué hora abren?", "¡Hola! Abrimos de 7:00 a 21:00 todos los días en nuestras 4 sucursales. ¿Te ayudo con algo más? 🥐", "laespiga.mx/sucursales"]];
  const out: T.Message[] = [{ id: 1, role: "assistant", content: greeting, created_at: t(0) }];
  let id = 2;
  script.forEach(([u, a, src], i) => {
    out.push({ id: id++, role: "user", content: u, created_at: t(20 + i * 60) });
    out.push({ id: id++, role: "assistant", content: a, sources: src ? [{ source_id: "src", title: src }] : [], confidence: src ? "green" : c.confidence, hard_rule_triggered: c.topic === "entrega a domicilio" ? 1 : c.topic === "alérgenos" ? 3 : undefined, tokens_in: 2400 + Math.floor(rnd() * 800), tokens_out: 90 + Math.floor(rnd() * 80), model: BOTS.find((b) => b.id === c.bot_id)?.model, cost_usd: 0.0045, latency_ms: 900 + Math.floor(rnd() * 900), created_at: t(24 + i * 60) });
  });
  if (c.status === "escalated") out.push({ id: id++, role: "human_agent", content: "Hola, soy Ana de La Espiga. Ya vi tu caso; te repongo el pastel hoy sin costo. ¿A qué sucursal pasas?", created_at: t(400) });
  return out;
}

export const USAGE_SERIES: T.UsageDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.now() - (29 - i) * 86400000);
  const dow = d.getDay();
  const conv = Math.round((dow === 0 || dow === 6 ? 55 : 95) + rnd() * 30 + i * 0.8);
  return { day: d.toISOString().slice(0, 10), conversations: conv, tokens_in: conv * 11800, tokens_out: conv * 820, cost_mxn: Number((conv * 0.31).toFixed(2)) };
});

export const XRAY: T.XRay = {
  topics: [
    { topic: "horarios", conversations: 412, resolution_rate: 0.97, negative_rate: 0.01 },
    { topic: "precios", conversations: 388, resolution_rate: 0.93, negative_rate: 0.02 },
    { topic: "pasteles personalizados", conversations: 301, resolution_rate: 0.81, negative_rate: 0.06 },
    { topic: "pedido para recoger", conversations: 276, resolution_rate: 0.88, negative_rate: 0.03 },
    { topic: "estatus de pedido", conversations: 240, resolution_rate: 0.79, negative_rate: 0.09 },
    { topic: "entrega a domicilio", conversations: 198, resolution_rate: 0.7, negative_rate: 0.22 },
    { topic: "facturación", conversations: 121, resolution_rate: 0.66, negative_rate: 0.05 },
    { topic: "devolución", conversations: 84, resolution_rate: 0.52, negative_rate: 0.31 },
    { topic: "alérgenos", conversations: 61, resolution_rate: 0.1, negative_rate: 0.12 },
    { topic: "promociones", conversations: 44, resolution_rate: 0.05, negative_rate: 0.08 },
    { topic: "empleo", conversations: 27, resolution_rate: 0, negative_rate: 0.02 },
  ],
  unanswered: [
    { id: "uq1", bot_id: "bot_recepcion", question: "¿Tienen promociones en octubre?", occurrences: 31, suggested_answer: "Sube el PDF de promociones en formato texto (el escaneado no se pudo leer).", created_at: daysAgo(2) },
    { id: "uq2", bot_id: "bot_recepcion", question: "¿Hacen envíos a Cancún / fuera de CDMX?", occurrences: 19, created_at: daysAgo(5) },
    { id: "uq3", bot_id: "bot_recepcion", question: "¿Están contratando?", occurrences: 14, suggested_answer: "Agrega una regla: 'Para empleo, envía CV a rh@laespiga.mx'.", created_at: daysAgo(6) },
    { id: "uq4", bot_id: "bot_pedidos", question: "¿Puedo cambiar la dirección de mi pedido?", occurrences: 9, created_at: daysAgo(3) },
    { id: "uq5", bot_id: "bot_recepcion", question: "¿Tienen opciones veganas?", occurrences: 7, created_at: daysAgo(1) },
  ],
  insights: [
    "El 22 % de las conversaciones negativas son por 'entrega a domicilio': 198 clientes pidieron algo que no ofreces. Considera aliarte con una app de entregas o comunicar 'solo recoger' en el sitio.",
    "'Promociones' es tu pregunta sin respuesta #1 (31 veces). El PDF escaneado no se pudo leer; con la versión en texto resolverías ~30 conversaciones/mes.",
    "Devoluciones tiene la peor resolución (52 %): el bot escala correctamente, pero los clientes llegan molestos. Revisa el proceso de entrega de la tienda en línea.",
    "Picos de conversaciones sábados 10–12 h: coincide con pasteles personalizados. Un recordatorio de 48 h en el sitio bajaría escalamientos.",
  ],
};

export const ALERTS: T.Alert[] = [
  { id: "al1", bot_id: "bot_recepcion", severity: "warning", kind: "budget_80", title: "Llevas 82 % de tus conversaciones del mes", body: "2 460 de 3 000. Al 100 % el bot pausará, salvo que permitas excedentes (MXN 2.40 c/u).", created_at: daysAgo(0, 9) },
  { id: "al2", bot_id: "bot_recepcion", severity: "critical", kind: "angry_customer", title: "Cliente molesto escalado — pedido 4471", body: "Pastel dañado; pide humano. Resumen listo en la conversación.", created_at: daysAgo(0, 11) },
  { id: "al3", bot_id: "bot_recepcion", severity: "info", kind: "unanswered_spike", title: "Tema nuevo sin respuesta: promociones de octubre", body: "31 clientes preguntaron esta semana. ¿Quieres contestar ahora?", created_at: daysAgo(1) },
  { id: "al4", severity: "info", kind: "weekly_report", title: "Tu Rayos X semanal está listo", body: "Resolución 68 % (+4 pts), 612 conversaciones, 2 temas nuevos.", created_at: daysAgo(2), acknowledged_at: daysAgo(2) },
  { id: "al5", bot_id: "bot_recepcion", severity: "warning", kind: "source_failed", title: "No pude leer 'Promociones octubre (escaneado).pdf'", body: "Es una imagen. Sube la versión en Word o toma foto con la app de Notas.", created_at: daysAgo(1) },
];

export const MEMBERS: T.Member[] = [
  { user_id: "usr_ana", display_name: "Ana Rodríguez", email: "ana@laespiga.mx", role: "owner", mfa: true, last_login: daysAgo(0, 8), status: "active" },
  { user_id: "usr_luis", display_name: "Luis Herrera", email: "luis@laespiga.mx", role: "admin", mfa: true, last_login: daysAgo(1), status: "active" },
  { user_id: "usr_mar", display_name: "Mariana Soto", email: "mariana@laespiga.mx", role: "editor", mfa: false, last_login: daysAgo(4), status: "active" },
  { user_id: "usr_cont", display_name: "Despacho contable", email: "contador@ejemplo.mx", role: "viewer", mfa: false, status: "invited" },
];

export const AUDIT: T.AuditEntry[] = [
  { id: 1, actor: "Ana Rodríguez", actor_type: "user", action: "bot.publish", object_type: "bot", object_id: "bot_recepcion", details: { version: 7, reason: "Pasteles personalizados: 48 h" }, ip: "189.203.1.10", created_at: daysAgo(1) },
  { id: 2, actor: "Ana Rodríguez", actor_type: "user", action: "change_request.approved", object_type: "change_request", object_id: "cr_1", details: { accepted: [0, 1] }, ip: "189.203.1.10", created_at: daysAgo(1) },
  { id: 3, actor: "Mariana Soto", actor_type: "user", action: "source.index", object_type: "knowledge_source", object_id: "src_menu", details: { chunks: 14 }, ip: "201.141.5.22", created_at: daysAgo(12) },
  { id: 4, actor: "sistema", actor_type: "system", action: "subscription.updated", object_type: "subscription", details: { plan: "crecimiento", status: "active" }, created_at: daysAgo(15) },
  { id: 5, actor: "Luis Herrera", actor_type: "user", action: "member.invite", object_type: "member", object_id: "usr_cont", details: { role: "viewer" }, ip: "201.141.5.22", created_at: daysAgo(20) },
  { id: 6, actor: "Ana Rodríguez", actor_type: "user", action: "conversation.export", object_type: "conversation", object_id: "conv_004", details: { sha256: "3f9a…c21e" }, ip: "189.203.1.10", created_at: daysAgo(3) },
  { id: 7, actor: "Ana Rodríguez", actor_type: "user", action: "api_key.create", object_type: "api_key", object_id: "key_web", details: { scopes: ["chat"] }, ip: "189.203.1.10", created_at: daysAgo(40) },
  { id: 8, actor: `soporte@${BRAND.toLowerCase()}`, actor_type: "platform_admin", action: "support.access", object_type: "org", details: { reason: "Ticket #231: revisar indexación fallida", notified_owner: true }, created_at: daysAgo(1) },
];

export const INVOICES: T.Invoice[] = [
  { id: "in_003", amount_mxn: 6990 * 1.16, status: "paid", period_start: daysAgo(15).slice(0, 10), period_end: daysAgo(-15).slice(0, 10), pdf_url: "#", cfdi_uuid: "A1B2C3D4-…-0009" },
  { id: "in_002", amount_mxn: 6990 * 1.16 + 412 * 2.4 * 1.16, status: "paid", period_start: daysAgo(45).slice(0, 10), period_end: daysAgo(15).slice(0, 10), pdf_url: "#", cfdi_uuid: "A1B2C3D4-…-0008" },
  { id: "in_001", amount_mxn: 1490 * 1.16, status: "paid", period_start: daysAgo(75).slice(0, 10), period_end: daysAgo(45).slice(0, 10), pdf_url: "#", cfdi_uuid: "A1B2C3D4-…-0007" },
];

export const DATA_REQUESTS: T.DataRequest[] = [
  { id: "dr1", type: "access", requester_ref: "u4471 (correo verificado)", status: "in_progress", due_at: daysAgo(-14), created_at: daysAgo(6) },
  { id: "dr2", type: "cancellation", requester_ref: "u2210", status: "completed", due_at: daysAgo(-2), created_at: daysAgo(25) },
];

export const RETENTION: T.RetentionPolicy = { transcript_days: 365, redact_pii_before_llm: true, store_sensitive: false, voice_recordings: false };

export const API_KEYS: T.ApiKey[] = [
  { id: "key_web", bot_id: "bot_recepcion", name: "Widget laespiga.mx", key_prefix: "bk_live_7f3a", scopes: ["chat"], allowed_origins: ["https://laespiga.mx"], last_used_at: daysAgo(0, 12), created_at: daysAgo(40) },
  { id: "key_tienda", bot_id: "bot_pedidos", name: "Widget tienda en línea", key_prefix: "bk_live_c91d", scopes: ["chat"], allowed_origins: ["https://tienda.laespiga.mx"], last_used_at: daysAgo(0, 11), created_at: daysAgo(28) },
];

export const CHANGELOG: T.ChangelogEntry[] = [
  ...VERSIONS.bot_recepcion.map((v) => ({ id: `cl_r${v.version}`, bot_id: "bot_recepcion", bot_name: "Espi — Recepción 24/7", version: v.version, reason: v.reason ?? "", actor: v.published_by ?? "", at: v.published_at, changes: 1 + (v.version % 3) })),
  ...VERSIONS.bot_pedidos.map((v) => ({ id: `cl_p${v.version}`, bot_id: "bot_pedidos", bot_name: "Pedidos y devoluciones", version: v.version, reason: v.reason ?? "", actor: v.published_by ?? "", at: v.published_at, changes: 1 + (v.version % 2) })),
].sort((a, b) => b.at.localeCompare(a.at));

export const CHANGE_REQUESTS: T.ChangeRequest[] = [
  { id: "cr_1", bot_id: "bot_recepcion", instruction: "Ya cambió la política: los pasteles personalizados ahora necesitan 48 horas, no 24", status: "approved", created_at: daysAgo(1), decided_at: daysAgo(1), resulting_version: 7, requested_by: "Ana Rodríguez", proposal: [
    { target: "dm.hard_rules[1]", before: "Los pasteles personalizados requieren 24 horas de anticipación; nunca aceptes menos.", after: "Los pasteles personalizados requieren 48 horas de anticipación; nunca aceptes menos.", reason: "La instrucción cambia el plazo de 24 a 48 horas.", accepted: true },
    { target: "source:src_pol#12", before: "Pedidos de pasteles personalizados: mínimo 24 horas de anticipación.", after: "Pedidos de pasteles personalizados: mínimo 48 horas de anticipación.", reason: "El documento de políticas mencionaba el plazo anterior.", accepted: true },
  ] },
];

// ---------------------------------------------------------------- plantillas de bot (demo)
// Espejo reducido de apps/api/src/templates: lo suficiente para que el asistente se vea y
// se navegue completo en modo demo, sin duplicar las bases de conocimiento.
export const AVISO_REGLAS =
  "Estas reglas no se pueden quitar. Son el contrato entre tu bot y la ley, tu margen y tus clientes: " +
  "cada una existe por algo que ya le costó caro a alguien. Puedes agregar las tuyas, y en edición " +
  "avanzada puedes cambiar cómo se redactan, pero no eliminarlas.";

export const PLANTILLAS_DEMO: T.PlantillaResumen[] = [
  { id: "servicio-cliente", agente: "Renata Ochoa", titulo: "Servicio a cliente", svc: "SVC-02", guardrails: "intermedio", canales: ["web", "whatsapp"], para_quien: "Empresas que venden producto, servicio o ambos y reciben dudas de pedidos, garantías y devoluciones." },
  { id: "recepcionista", agente: "Paulina Vega", titulo: "Recepcionista virtual", svc: "SVC-01", guardrails: "basico", canales: ["web", "whatsapp"], para_quien: "Negocios que agendan citas o visitas y quieren dejar de perder llamadas fuera de horario." },
  { id: "soporte-tecnico-email", agente: "Iván Moreno", titulo: "Soporte técnico por correo", svc: "SVC-03", guardrails: "intermedio", canales: ["email"], para_quien: "Empresas con mesa de servicio que reciben tickets por correo y quieren resolver el nivel 1 sin tocarlos." },
  { id: "servicio-cliente-email", agente: "Sofía Palma", titulo: "Servicio a cliente por correo", svc: "SVC-03", guardrails: "intermedio", canales: ["email"], para_quien: "Empresas cuyo buzón administrativo se llena de dudas de facturas, pedidos y datos fiscales." },
  { id: "faq-interno", agente: "Marisol Beltrán", titulo: "FAQ interno para empleados", svc: "SVC-10", guardrails: "basico", canales: ["web_interna", "whatsapp"], para_quien: "Empresas con procedimientos escritos que nadie encuentra: el SOP, pero que contesta." },
  { id: "onboarding-empleados", agente: "Emilio Cantú", titulo: "Onboarding de nuevos empleados", svc: "SVC-14", guardrails: "avanzado", canales: ["web_interna", "whatsapp"], para_quien: "Empresas que contratan seguido y quieren que los primeros 30 días no dependan de que alguien tenga tiempo." },
  { id: "onboarding-clientes", agente: "Andrea Lugo", titulo: "Onboarding de nuevos clientes", svc: "SVC-04", guardrails: "intermedio", canales: ["web", "email"], para_quien: "Empresas con un servicio que requiere arranque: los primeros 14 días deciden si el cliente se queda." },
];

const REGLAS_DEMO: Record<string, T.ReglaExplicada[]> = {
  "servicio-cliente": [
    { regla: "Nunca prometas una fecha de entrega distinta al rango publicado para esa zona.", tipo: "compromiso", porque: "Una fecha dicha por escrito es exigible. Si tu bot promete el martes y la paquetería entrega el jueves, la queja es contra ti y procede. El rango publicado sí lo puedes sostener." },
    { regla: "Las licencias y claves digitales no admiten devolución ni cambio una vez enviadas; dilo con claridad.", tipo: "compromiso", porque: "La condición la pone el fabricante, no tú: una vez generada la clave, ya la pagaste. Si el bot deja la puerta abierta, el costo de esa licencia lo absorbes tú." },
    { regla: "Nunca ofrezcas ni insinúes descuentos, condonaciones o excepciones a la política.", tipo: "compromiso", porque: "Un descuento que ofrece el bot es un descuento que vas a tener que honrar, y sale directo de tu margen. Las excepciones las autoriza una persona que puede ver el caso completo." },
    { regla: "No diagnostiques fallas técnicas: si el cliente describe un problema de funcionamiento, canaliza a soporte.", tipo: "operativa", porque: "Un diagnóstico equivocado manda al cliente a comprar la refacción que no era. El costo de ese error es tuyo y la confianza perdida también." },
    { regla: "Si el cliente pide hablar con una persona, escala de inmediato sin insistir en resolverlo tú.", tipo: "legal", porque: "Un agente de IA tiene que ofrecer salida a un humano en cualquier momento. Además, insistir cuando alguien ya pidió una persona es lo que más molesta." },
  ],
  recepcionista: [
    { regla: "Nunca agendes fuera del horario publicado ni en domingo.", tipo: "operativa", porque: "Una cita agendada a una hora en la que no hay nadie es un cliente plantado en tu puerta. Ese error cuesta más que la cita." },
    { regla: "Cierra toda cita repitiendo por escrito fecha, hora, dirección y nombre de quien atiende.", tipo: "operativa", porque: "La confirmación por escrito es lo único que elimina el 'yo entendí otra cosa'. Es la diferencia entre un malentendido y una cita cumplida." },
    { regla: "No inventes disponibilidad: si no puedes confirmar el espacio, di que se confirma dentro del horario hábil.", tipo: "operativa", porque: "Prometer un espacio que no existe genera doble agenda. Decir 'te confirmo' cuesta una hora de espera; agendar mal cuesta un cliente." },
    { regla: "No des precios ni tiempos de entrega, aunque te insistan.", tipo: "compromiso", porque: "Un precio dicho por el bot es un precio que el cliente va a exigir, aunque haya cambiado el tipo de cambio o el producto sea sobre pedido." },
  ],
  "soporte-tecnico-email": [
    { regla: "Nunca pidas contraseñas ni códigos de verificación, por ningún motivo.", tipo: "seguridad", porque: "Pedir contraseñas es exactamente lo que hace el phishing. Si tu soporte lo hace alguna vez, entrenas a tus clientes a dárselas a cualquiera que las pida." },
    { regla: "Ante cualquier señal de pérdida de datos, ransomware o intrusión, escala de inmediato.", tipo: "seguridad", porque: "En un incidente de seguridad, cada minuto de pasos improvisados destruye evidencia y puede propagar el cifrado a los respaldos. Aquí la respuesta correcta es detenerse, no ayudar." },
    { regla: "No prometas tiempos de resolución distintos al SLA de la póliza del cliente.", tipo: "compromiso", porque: "El SLA está en el contrato. Prometer menos tiempo del contratado crea una expectativa que no puedes sostener y que el cliente sí puede reclamar." },
    { regla: "Si el equipo está fuera de garantía y la falla es de hardware, dilo antes de proponer cualquier trabajo.", tipo: "compromiso", porque: "Decirlo al final, después de que el cliente ya invirtió tiempo, es la queja clásica de una mesa de servicio. Decirlo al principio se percibe como honestidad." },
  ],
  "servicio-cliente-email": [
    { regla: "No compartas estado de cuenta ni datos fiscales sin que el correo venga de una dirección registrada.", tipo: "legal", porque: "Mandar datos financieros a quien no es el titular es una vulneración de datos personales, con obligación de notificar y riesgo de sanción. Verificar el remitente cuesta un segundo." },
    { regla: "Nunca solicites ni aceptes datos de tarjeta por correo; dirige siempre al portal de pago.", tipo: "seguridad", porque: "El correo no es un canal seguro y queda guardado en varios servidores. Aceptar un número de tarjeta por ahí te vuelve responsable de un dato que no deberías tener nunca." },
    { regla: "No negocies plazos de pago, descuentos ni condonación de intereses: se escala siempre.", tipo: "compromiso", porque: "Es dinero. Un plazo concedido por el bot es flujo que dejas de tener, y quien decide eso necesita ver la línea de crédito y el historial completo." },
    { regla: "No des asesoría fiscal ni contable; sugiere consultar a su contador.", tipo: "legal", porque: "Si tu bot aconseja mal en materia fiscal y el cliente actúa, te vuelves parte del problema. No es tu materia ni tu licencia." },
  ],
  "faq-interno": [
    { regla: "Nunca des información de sueldo, nómina o situación contractual de ninguna persona.", tipo: "legal", porque: "Los datos de nómina son datos personales protegidos. Y aunque quien pregunta sea el titular, el canal correcto es recursos humanos: por chat no hay forma de verificar quién escribe." },
    { regla: "Nunca compartas datos de un cliente concreto: para eso está el portal, con sus permisos.", tipo: "legal", porque: "Tus clientes te confiaron sus datos bajo un contrato. El portal tiene permisos por área; un bot que contesta a cualquiera no los tiene." },
    { regla: "No opines sobre desempeño, conflictos ni decisiones de personal.", tipo: "legal", porque: "Una opinión del bot sobre una persona puede terminar citada en un conflicto laboral. No hay versión de esto que salga bien." },
    { regla: "Si la respuesta no está en los documentos internos, dilo y di a quién preguntar; no la deduzcas.", tipo: "operativa", porque: "Una política deducida es una política inventada, y se propaga: la persona la repite como si fuera oficial. Decir 'no está escrito' es información útil, no una falla." },
  ],
  "onboarding-empleados": [
    { regla: "Nunca pidas documentos con datos sensibles por chat: dirige al portal de recursos humanos.", tipo: "legal", porque: "Una identificación en un chat queda guardada en el teléfono de quien la mandó, en el historial y en los respaldos. El portal existe para que esos documentos vivan en un solo lugar controlado." },
    { regla: "No des información de sueldo, bonos ni prestaciones más allá del contrato firmado.", tipo: "legal", porque: "Lo que el bot diga sobre prestaciones puede interpretarse como oferta. Si no coincide con el contrato, gana la interpretación más favorable al trabajador." },
    { regla: "Registra el avance del checklist, pero nunca califiques, evalúes ni compares a la persona.", tipo: "legal", porque: "Una evaluación automatizada de una persona tiene implicaciones laborales serias y puede usarse en su contra. Registrar que completó un paso no es lo mismo que calificarla." },
    { regla: "Ninguna respuesta tuya sustituye la constancia DC-3 que emite un agente capacitador ante la STPS.", tipo: "legal", porque: "La constancia DC-3 sólo la emite un agente capacitador registrado. Si alguien cree que el bot lo certificó, tu empresa queda sin la capacitación que la ley exige y sin saberlo." },
  ],
  "onboarding-clientes": [
    { regla: "Nunca prometas tiempos de respuesta distintos al SLA de la póliza contratada.", tipo: "compromiso", porque: "El SLA es lo que el cliente pagó. Prometer más rápido en el arranque crea la expectativa con la que te va a medir todo el año." },
    { regla: "No configures nada ni des instrucciones técnicas: si necesita algo hecho, se agenda con soporte.", tipo: "operativa", porque: "Una instrucción técnica sin haber visto el equipo rompe cosas, y el arranque es justo cuando el cliente está decidiendo si confía en ti." },
    { regla: "Sé explícito sobre lo que la póliza no cubre en cuanto el tema aparezca.", tipo: "compromiso", porque: "El reclamo más caro es el del cliente que descubre a los tres meses que algo no estaba incluido. Decirlo el primer día se percibe como claridad; después, como letra chiquita." },
    { regla: "Si el arranque se atrasó respecto al plan, no lo minimices: dilo y escala.", tipo: "operativa", porque: "Minimizar un retraso es lo que convierte un retraso en una cancelación. El cliente ya sabe que va tarde; lo que mide es si tú lo reconoces." },
  ],
};

const DISPARADORES_DEMO: Record<string, string[]> = {
  "servicio-cliente": ["el cliente pide una persona", "reclamación por producto dañado", "molestia evidente", "pedido retrasado", "petición de descuento"],
  recepcionista: ["el cliente pide una persona", "quiere algo fuera de los tipos de cita", "urgencia", "reclamación"],
  "soporte-tecnico-email": ["pérdida de datos", "ransomware o intrusión", "servidor caído", "el usuario pide una persona", "dos respuestas sin avanzar"],
  "servicio-cliente-email": ["petición de plazo o descuento", "aclaración de un cargo", "correo no registrado", "el cliente pide una persona"],
  "faq-interno": ["duda de nómina o contrato", "conflicto entre personas", "solicitud de excepción", "pide hablar con recursos humanos"],
  "onboarding-empleados": ["tema de sueldo o contrato", "problema personal o de salud", "conflicto", "no recibió su equipo a tiempo"],
  "onboarding-clientes": ["arranque con más de 3 días de retraso", "pide algo fuera de su póliza", "insatisfacción", "el cliente pide una persona"],
};

const KPI_DEMO: Record<string, { name: string; target: number }> = {
  "servicio-cliente": { name: "resolución sin humano", target: 0.62 },
  recepcionista: { name: "citas agendadas sin intervención humana", target: 0.7 },
  "soporte-tecnico-email": { name: "tickets resueltos en el primer correo", target: 0.45 },
  "servicio-cliente-email": { name: "correos resueltos sin escalar", target: 0.55 },
  "faq-interno": { name: "consultas resueltas sin escalar a un compañero", target: 0.75 },
  "onboarding-empleados": { name: "empleados que completan el checklist en 30 días", target: 0.85 },
  "onboarding-clientes": { name: "clientes que levantan su primer ticket en 14 días", target: 0.8 },
};

const OBJETIVO_DEMO: Record<string, string> = {
  "servicio-cliente": "Resolver dudas de pedidos, garantías, devoluciones y facturación distinguiendo entre producto físico, digital y servicio, y escalar con resumen lo que requiere una persona.",
  recepcionista: "Agendar, confirmar y reagendar citas sin errores, tomar recados completos fuera de horario y dirigir a cada persona con quien corresponde.",
  "soporte-tecnico-email": "Resolver incidentes comunes en el primer correo, recabar lo que un técnico necesitaría y escalar con un resumen que no obligue a releer el hilo.",
  "servicio-cliente-email": "Responder en el primer correo las dudas administrativas y comerciales, y escalar a administración lo que implique dinero o identidad.",
  "faq-interno": "Contestar en segundos cualquier duda de procedimiento interno citando el documento que la respalda, para que nadie interrumpa a un compañero por algo que ya está escrito.",
  "onboarding-empleados": "Llevar a la persona nueva por sus primeros 30 días verificando comprensión y dejando registro del avance.",
  "onboarding-clientes": "Llevar al cliente nuevo desde la firma hasta que sabe usar el servicio solo, y detectar temprano cuando algo no va según el plan.",
};

/** Arma el detalle de una plantilla para el cuestionario en modo demo. */
export function detallePlantilla(p: T.PlantillaResumen): T.PlantillaDetalle {
  const [nombre, ...ap] = p.agente.split(" ");
  const reglas = REGLAS_DEMO[p.id] ?? [];
  return {
    ...p,
    agente: { nombre, apellido: ap.join(" ") },
    parametros: ["nombre del agente", "empresa", "objetivo", "registro", "correo de escalamiento", "horario", "aviso de privacidad", "KPI"],
    starters: ["¿Cuál es tu horario?", "Necesito ayuda con un pedido", "Quiero hablar con una persona", "¿Dónde están ubicados?"],
    fragmentos_sugeridos: 9,
    reglas_explicadas: reglas,
    aviso_reglas: AVISO_REGLAS,
    dm: {
      identity: { name: p.agente, company: ORG.name, persona: p.titulo.toLowerCase(), locale: "español de México" },
      objective: OBJETIVO_DEMO[p.id] ?? "",
      scope: { in: ["lo que está en tus documentos"], out: ["cotizaciones a la medida", "asesoría profesional"] },
      tone: { register: "tú", style: "cálido, claro y breve", max_sentences: 5, emojis: false },
      hard_rules: reglas.map((r) => r.regla),
      escalation: { triggers: DISPARADORES_DEMO[p.id] ?? [], summary_to: "avisos@ejemplo.mx", hours: "lunes a viernes 9:00–18:00" },
      data_policy: { may_collect: ["nombre", "correo", "teléfono"], never_collect: ["contraseñas", "datos de tarjeta", "CURP", "datos de salud"], privacy_notice_url: "https://ejemplo.mx/privacidad" },
      sources: [{ title: "Tus documentos", priority: 1 }],
      kpi: KPI_DEMO[p.id] ?? { name: "resolución sin humano", target: 0.6 },
    },
  };
}
