import type * as T from "../lib/types";

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
  { user_id: "usr_ana", display_name: "Ana Rodríguez", email: "ana@laespiga.mx", role: "owner", mfa: true, last_login: daysAgo(0, 8) },
  { user_id: "usr_luis", display_name: "Luis Herrera", email: "luis@laespiga.mx", role: "admin", mfa: true, last_login: daysAgo(1) },
  { user_id: "usr_mar", display_name: "Mariana Soto", email: "mariana@laespiga.mx", role: "editor", mfa: false, last_login: daysAgo(4) },
  { user_id: "usr_cont", display_name: "Despacho contable", email: "contador@ejemplo.mx", role: "viewer", mfa: false, last_login: daysAgo(12) },
];

export const AUDIT: T.AuditEntry[] = [
  { id: 1, actor: "Ana Rodríguez", actor_type: "user", action: "bot.publish", object_type: "bot", object_id: "bot_recepcion", details: { version: 7, reason: "Pasteles personalizados: 48 h" }, ip: "189.203.1.10", created_at: daysAgo(1) },
  { id: 2, actor: "Ana Rodríguez", actor_type: "user", action: "change_request.approved", object_type: "change_request", object_id: "cr_1", details: { accepted: [0, 1] }, ip: "189.203.1.10", created_at: daysAgo(1) },
  { id: 3, actor: "Mariana Soto", actor_type: "user", action: "source.index", object_type: "knowledge_source", object_id: "src_menu", details: { chunks: 14 }, ip: "201.141.5.22", created_at: daysAgo(12) },
  { id: 4, actor: "sistema", actor_type: "system", action: "subscription.updated", object_type: "subscription", details: { plan: "crecimiento", status: "active" }, created_at: daysAgo(15) },
  { id: 5, actor: "Luis Herrera", actor_type: "user", action: "member.invite", object_type: "member", object_id: "usr_cont", details: { role: "viewer" }, ip: "201.141.5.22", created_at: daysAgo(20) },
  { id: 6, actor: "Ana Rodríguez", actor_type: "user", action: "conversation.export", object_type: "conversation", object_id: "conv_004", details: { sha256: "3f9a…c21e" }, ip: "189.203.1.10", created_at: daysAgo(3) },
  { id: 7, actor: "Ana Rodríguez", actor_type: "user", action: "api_key.create", object_type: "api_key", object_id: "key_web", details: { scopes: ["chat"] }, ip: "189.203.1.10", created_at: daysAgo(40) },
  { id: 8, actor: "soporte@{{BRAND}}", actor_type: "platform_admin", action: "support.access", object_type: "org", details: { reason: "Ticket #231: revisar indexación fallida", notified_owner: true }, created_at: daysAgo(1) },
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
