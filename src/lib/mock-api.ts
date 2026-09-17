import type { Api } from "./api";
import type * as T from "./types";
import * as D from "../mock/data";

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const clone = <X,>(x: X): X => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();

/** In-memory implementation used by the public demo (GitHub Pages). State resets on reload. */
export class MockApi implements Api {
  readonly mode = "mock" as const;
  private _bots = clone(D.BOTS);
  private dm = clone(D.DM);
  private versions = clone(D.VERSIONS);
  private _sources = clone(D.SOURCES);
  private _channels = clone(D.CHANNELS);
  private _conversations = clone(D.CONVERSATIONS);
  private _alerts = clone(D.ALERTS);
  private _members = clone(D.MEMBERS);
  private _audit = clone(D.AUDIT);
  private _xray = clone(D.XRAY);
  private _changelog = clone(D.CHANGELOG);
  private crs = clone(D.CHANGE_REQUESTS);
  private dataRequestsList = clone(D.DATA_REQUESTS);
  private retentionPolicy = clone(D.RETENTION);
  private keys = clone(D.API_KEYS);

  private log(action: string, object_type?: string, object_id?: string, details?: Record<string, unknown>) {
    this._audit.unshift({ id: this._audit.length + 1, actor: D.USER.name, actor_type: "user", action, object_type, object_id, details, ip: "189.203.1.10", created_at: now() });
  }

  async me() { await wait(100); return { user: D.USER, org: clone(D.ORG), role: "owner" as const }; }
  async bots() { await wait(); return clone(this._bots); }
  async bot(id: string) { await wait(100); const b = this._bots.find((x) => x.id === id); if (!b) throw new Error("Bot no encontrado"); return clone(b); }
  async updateBot(id: string, patch: Partial<T.Bot>) { await wait(); Object.assign(this._bots.find((b) => b.id === id)!, patch); this.log("bot.update", "bot", id, patch as any); }
  async masterDocument(botId: string) { await wait(); return { draft: clone(this.dm[botId]), versions: clone(this.versions[botId] ?? []) }; }
  async saveMasterDocument(botId: string, draft: T.MasterDocument) { await wait(); this.dm[botId] = clone(draft); }
  async publish(botId: string, reason?: string) {
    await wait(600);
    const bot = this._bots.find((b) => b.id === botId)!;
    const v = bot.published_version + 1;
    bot.published_version = v;
    if (bot.status === "draft") bot.status = "active";
    (this.versions[botId] ??= []).unshift({ version: v, reason: reason ?? "Publicación manual", published_at: now(), published_by: D.USER.name });
    this._changelog.unshift({ id: `cl_${botId}_${v}`, bot_id: botId, bot_name: bot.name, version: v, reason: reason ?? "Publicación manual", actor: D.USER.name, at: now(), changes: 1 });
    this.log("bot.publish", "bot", botId, { version: v, reason });
    return v;
  }
  async sources(botId: string) { await wait(); return clone(this._sources.filter((s) => s.bot_id === botId)); }
  async addSource(botId: string, s: { kind: string; title: string; text: string }) {
    await wait(300);
    const src: T.KnowledgeSource = { id: `src_${Date.now()}`, bot_id: botId, kind: s.kind, title: s.title, status: "processing", chunk_count: 0, sample_questions: [], priority: 100, created_at: now() };
    this._sources.push(src);
    // Simulate "Leyendo → Entendiendo → Listo" with sample questions (usability strategy 1)
    setTimeout(() => {
      const words = s.text.split(/\s+/).filter(Boolean);
      src.status = "ready"; src.chunk_count = Math.max(1, Math.ceil(words.length / 300));
      src.sample_questions = [`¿Qué dice ${s.title.replace(/\.[a-z]+$/i, "")} sobre ${words[3] ?? "esto"}?`, "¿Cuál es el proceso completo?", "¿Qué pasa si no aplica?"];
      this.log("source.index", "knowledge_source", src.id, { chunks: src.chunk_count });
    }, 2500);
    return clone(src);
  }
  async deleteSource(_botId: string, id: string) { await wait(); this._sources = this._sources.filter((s) => s.id !== id); this.log("source.delete", "knowledge_source", id); }
  async channels(botId: string) { await wait(); return clone(this._channels.filter((c) => c.bot_id === botId)); }
  async updateChannel(_botId: string, id: string, patch: Partial<T.Channel>) { await wait(); Object.assign(this._channels.find((c) => c.id === id)!, patch); this.log("channel.update", "channel", id, patch as any); }

  async proposeChange(botId: string, instruction: string): Promise<T.ChangeRequest> {
    await wait(1400);
    const dm = this.dm[botId];
    const lower = instruction.toLowerCase();
    const proposal: T.ProposedChange[] = [];
    const num = instruction.match(/(\d+)\s*(h|horas|días|dias|%|pesos|\$)/i);
    // Heuristic "agent": find the most similar hard rule / scope item and propose the change; real API uses the LLM.
    const target = dm.hard_rules.map((r, i) => ({ r, i, score: r.toLowerCase().split(" ").filter((w) => w.length > 4 && lower.includes(w)).length })).sort((a, b) => b.score - a.score)[0];
    if (target && target.score > 0) {
      const after = num ? target.r.replace(/\d+\s*(horas|h|días|dias)/i, `${num[1]} ${num[2]}`) : `${target.r} (actualizado: ${instruction})`;
      proposal.push({ target: `dm.hard_rules[${target.i}]`, before: target.r, after, reason: "La instrucción modifica esta regla dura." });
      const src = this._sources.find((s) => s.bot_id === botId && s.status === "ready");
      if (src) proposal.push({ target: `source:${src.id}#3`, before: target.r.replace(/^Nunca|^Los/, "Nota:"), after: after.replace(/^Nunca|^Los/, "Nota:"), reason: `El documento "${src.title}" contiene el dato anterior.` });
    } else if (/no (ofrecemos|vendemos|hacemos)/.test(lower)) {
      const item = instruction.split(/no (ofrecemos|vendemos|hacemos)/i).pop()?.trim() ?? "eso";
      proposal.push({ target: "dm.scope.out", before: "", after: item, reason: "Se agrega a lo que el bot no atiende." });
      proposal.push({ target: "dm.hard_rules", before: "", after: `No ofrezcas ni prometas ${item}.`, reason: "Regla dura para evitar promesas." });
    } else if (/horario|abrimos|cerramos/.test(lower)) {
      proposal.push({ target: "dm.escalation.hours", before: dm.escalation.hours, after: instruction.replace(/^.*?(lunes|de |a partir)/i, "$1"), reason: "Nuevo horario de atención humana." });
    } else {
      proposal.push({ target: "dm.hard_rules", before: "", after: instruction.replace(/^ya\s+/i, ""), reason: "No encontré una regla existente relacionada; propongo agregarla como regla nueva. Revisa la redacción." });
    }
    const cr: T.ChangeRequest = { id: `cr_${Date.now()}`, bot_id: botId, instruction, proposal, status: "pending", created_at: now(), requested_by: D.USER.name };
    this.crs.unshift(cr);
    return clone(cr);
  }

  async decideChange(botId: string, id: string, accepted: number[]) {
    await wait(700);
    const cr = this.crs.find((c) => c.id === id)!;
    const dm = this.dm[botId];
    cr.proposal.forEach((p, i) => {
      p.accepted = accepted.includes(i);
      if (!p.accepted || !p.target.startsWith("dm.")) return;
      const path = p.target.slice(3);
      const m = path.match(/^hard_rules\[(\d+)\]$/);
      if (m) dm.hard_rules[Number(m[1])] = p.after;
      else if (path === "hard_rules") dm.hard_rules.push(p.after);
      else if (path === "scope.out") dm.scope.out.push(p.after);
      else if (path === "escalation.hours") dm.escalation.hours = p.after;
    });
    const status: T.ChangeRequest["status"] = accepted.length === 0 ? "rejected" : accepted.length === cr.proposal.length ? "approved" : "partially_approved";
    cr.status = status; cr.decided_at = now();
    let version: number | undefined;
    if (accepted.length) { version = await this.publish(botId, cr.instruction); cr.resulting_version = version; }
    this.log(`change_request.${status}`, "change_request", id, { accepted, version });
    return { status, version };
  }
  async changeRequests(botId?: string) { await wait(); return clone(botId ? this.crs.filter((c) => c.bot_id === botId) : this.crs); }

  async conversations(f: { bot_id?: string; status?: string; confidence?: string; q?: string; limit?: number; offset?: number }) {
    await wait();
    let items = this._conversations;
    if (f.bot_id) items = items.filter((c) => c.bot_id === f.bot_id);
    if (f.status) items = items.filter((c) => c.status === f.status);
    if (f.confidence) items = items.filter((c) => c.confidence === f.confidence);
    if (f.q) items = items.filter((c) => (c.topic ?? "").includes(f.q!.toLowerCase()) || c.id.includes(f.q!));
    const offset = f.offset ?? 0;
    return { items: clone(items.slice(offset, offset + (f.limit ?? 50))), total: items.length };
  }
  async conversation(id: string) { await wait(150); const c = this._conversations.find((x) => x.id === id); if (!c) throw new Error("Conversación no encontrada"); return { ...clone(c), messages: D.messagesFor(c) }; }

  async simulate(botId: string, history: { role: "user" | "assistant"; content: string }[]) {
    const dm = this.dm[botId];
    const last = history.filter((m) => m.role === "user").pop()?.content.toLowerCase() ?? "";
    let reply: string;
    if (/humano|persona|agente/.test(last)) reply = `Claro, te paso con una persona del equipo ahora mismo. Ya le envié un resumen de lo que hablamos para que no repitas nada. Horario de atención humana: ${dm.escalation.hours}.`;
    else if (/domicilio|env[ií]o/.test(last)) reply = "Por ahora no hacemos entregas a domicilio; todos los pedidos se recogen en sucursal. 🙂 ¿Te queda cerca Roma, Condesa, Del Valle o Coyoacán?  ⟶ [Regla dura #1 aplicada]";
    else if (/pastel/.test(last)) reply = `¡Con gusto! 🎂 Los pasteles personalizados los preparamos con ${dm.hard_rules[1].match(/\d+/)?.[0] ?? "48"} horas de anticipación. ¿Para cuántas personas y qué sabor te gustaría?  ⟶ [Fuente: Política de pedidos y pasteles.pdf]`;
    else if (/precio|cuesta|concha/.test(last)) reply = "La concha cuesta $18, el cuernito $22 y la rebanada de pastel $65. ¿Te aparto algo para recoger?  ⟶ [Fuente: Menú y precios septiembre 2026.xlsx]";
    else if (/aler|nuez|gluten/.test(last)) reply = "Para alergias prefiero que te lo confirmen directamente en la sucursal, donde revisan los ingredientes del día; no quiero darte un dato incorrecto. ¿Te paso con una persona?  ⟶ [Regla dura #3 aplicada]";
    else if (/hora|abren|cierran/.test(last)) reply = "Abrimos de 7:00 a 21:00 todos los días en nuestras 4 sucursales. 🥐  ⟶ [Fuente: laespiga.mx/sucursales]";
    else reply = `Soy ${dm.identity.name}, ${dm.identity.persona} de ${dm.identity.company}. Puedo ayudarte con ${dm.scope.in.slice(0, 3).join(", ")}. ¿Qué necesitas?  ⟶ [Sin fuente: pregunta guardada en "sin respuesta"]`;
    const words = reply.split(" ");
    return new ReadableStream<string>({
      async start(ctrl) { for (const w of words) { await wait(28); ctrl.enqueue(w + " "); } ctrl.close(); },
    });
  }

  async usage(days = 30) {
    await wait();
    const series = D.USAGE_SERIES.slice(-days);
    const totals = series.reduce((a, r) => ({ conversations: a.conversations + r.conversations, cost_mxn: a.cost_mxn + r.cost_mxn, tokens_in: a.tokens_in + r.tokens_in, tokens_out: a.tokens_out + r.tokens_out }), { conversations: 0, cost_mxn: 0, tokens_in: 0, tokens_out: 0 });
    return { series: clone(series), totals, period: { used: 2460, included: 3000, overage_price_mxn: 2.4, start: series[Math.max(0, series.length - 15)].day, end: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10), plan: "crecimiento" as const, extra_seats: 1 } };
  }
  async xray(botId?: string) { await wait(300); const x = clone(this._xray); if (botId) x.unanswered = x.unanswered.filter((u) => u.bot_id === botId); return x; }
  async resolveUnanswered(id: string, answer: string) { await wait(); this._xray.unanswered = this._xray.unanswered.filter((u) => u.id !== id); this.log("unanswered.resolve", "unanswered_question", id, { answer }); }
  async alerts() { await wait(); return clone(this._alerts); }
  async ackAlert(id: string) { await wait(100); const a = this._alerts.find((x) => x.id === id); if (a) a.acknowledged_at = now(); }
  async changelog() { await wait(); return clone(this._changelog); }
  async members() { await wait(); return clone(this._members); }
  async invite(email: string, role: T.OrgRole) { await wait(); this._members.push({ user_id: `usr_${Date.now()}`, display_name: email.split("@")[0], email, role, mfa: false }); this.log("member.invite", "member", email, { role }); }
  async updateMember(userId: string, role: T.OrgRole) { await wait(); this._members.find((m) => m.user_id === userId)!.role = role; this.log("member.update", "member", userId, { role }); }
  async removeMember(userId: string) { await wait(); this._members = this._members.filter((m) => m.user_id !== userId); this.log("member.remove", "member", userId); }
  async audit(limit = 100) { await wait(); return clone(this._audit.slice(0, limit)); }
  async invoices() { await wait(); return clone(D.INVOICES); }
  async checkout(plan: T.PlanTier) { await wait(); return { url: `#/facturacion?demo_checkout=${plan}` }; }
  async portal() { await wait(); return { url: "#/facturacion?demo_portal=1" }; }
  async dataRequests() { await wait(); return clone(this.dataRequestsList); }
  async createDataRequest(r: { type: T.DataRequest["type"]; requester_ref: string }) {
    await wait();
    const dr: T.DataRequest = { id: `dr_${Date.now()}`, type: r.type, requester_ref: r.requester_ref, status: "received", due_at: new Date(Date.now() + 28 * 86400000).toISOString(), created_at: now() };
    this.dataRequestsList.unshift(dr); this.log("data_request.create", "data_request", dr.id, r);
    return clone(dr);
  }
  async retention() { await wait(); return clone(this.retentionPolicy); }
  async saveRetention(p: T.RetentionPolicy) { await wait(); this.retentionPolicy = clone(p); this.log("retention.update", "org", D.ORG.id, p as any); }
  async apiKeys() { await wait(); return clone(this.keys); }
  async createApiKey(k: { name: string; bot_id?: string; allowed_origins: string[] }) {
    await wait();
    const key = `bk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 18)}`;
    const row: T.ApiKey = { id: `key_${Date.now()}`, bot_id: k.bot_id, name: k.name, key_prefix: key.slice(0, 12), scopes: ["chat"], allowed_origins: k.allowed_origins, created_at: now() };
    this.keys.push(row); this.log("api_key.create", "api_key", row.id, { scopes: row.scopes });
    return { key, ...row };
  }
  async revokeApiKey(id: string) { await wait(); this.keys = this.keys.filter((k) => k.id !== id); this.log("api_key.revoke", "api_key", id); }
  async exportAll() {
    await wait(500);
    const payload = { exported_at: now(), org: D.ORG, bots: this._bots, master_documents: this.dm, sources: this._sources, conversations: this._conversations.map((c) => ({ ...c, messages: D.messagesFor(c) })), changelog: this._changelog, audit: this._audit };
    return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  }
}
