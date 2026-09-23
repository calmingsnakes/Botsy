import type { Api } from "./api";
import type * as T from "./types";
import { MockApi } from "./mock-api";

/**
 * Talks to the Worker (Botsy-docs/apps/api). Endpoints not yet implemented server-side fall back to MockApi so the
 * dashboard stays usable while the backend grows. Auth: Supabase JWT stored in localStorage by the login flow.
 */
export class HttpApi implements Api {
  readonly mode = "http" as const;
  private fallback = new MockApi();
  constructor(private baseUrl: string, private token: () => string | null, private fetchImpl: typeof fetch = fetch) {}

  private async req<X>(path: string, init: RequestInit = {}): Promise<X> {
    const t = this.token();
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}), ...(init.headers ?? {}) } });
    if (!res.ok) { const e = await res.json().catch(() => ({ message: res.statusText })); throw new Error(e.message ?? "Error"); }
    return res.json();
  }
  private orgId = "";
  async me() {
    const r = await this.req<{ user: { id: string; email: string; name: string }; orgs: T.OrgSummary[] }>("/v1/me");
    const first = r.orgs[0];
    this.orgId = first?.id ?? "";
    const org: T.Org = first
      ? { id: first.id, name: first.name, plan: first.plan, monthly_conversation_budget: 0, overage_allowed: false }
      : { id: "", name: "", plan: "inicio", monthly_conversation_budget: 0, overage_allowed: false };
    return { user: r.user, org, role: first?.role ?? ("viewer" as T.OrgRole), orgs: r.orgs };
  }
  async createOrg(name: string) {
    const o = await this.req<{ id: string; name: string; slug: string; plan: T.PlanTier }>("/v1/orgs", { method: "POST", body: JSON.stringify({ name }) });
    this.orgId = o.id;
    return { id: o.id, name: o.name, plan: o.plan, role: "owner" as const };
  }
  bots() { return this.req<T.Bot[]>("/v1/bots"); }
  async bot(id: string) { return (await this.bots()).find((b) => b.id === id)!; }
  updateBot(id: string, patch: Partial<T.Bot>) { return this.req<void>(`/v1/bots/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); }
  masterDocument(botId: string) { return this.req<{ draft: T.MasterDocument; versions: T.DmVersion[] }>(`/v1/bots/${botId}/master-document`); }
  async saveMasterDocument(botId: string, draft: T.MasterDocument) { await this.req(`/v1/bots/${botId}/master-document`, { method: "PUT", body: JSON.stringify({ draft }) }); }
  async publish(botId: string, reason?: string) { return (await this.req<{ version: number }>(`/v1/bots/${botId}/publish`, { method: "POST", body: JSON.stringify({ reason }) })).version; }
  sources(botId: string) { return this.req<T.KnowledgeSource[]>(`/v1/bots/${botId}/sources`); }
  addSource(botId: string, s: { kind: string; title: string; text: string }) { return this.req<T.KnowledgeSource>(`/v1/bots/${botId}/sources`, { method: "POST", body: JSON.stringify(s) }); }
  async deleteSource(botId: string, id: string) { await this.req(`/v1/bots/${botId}/sources/${id}`, { method: "DELETE" }); }
  channels(botId: string) { return this.fallback.channels(botId); }
  updateChannel(botId: string, id: string, patch: Partial<T.Channel>) { return this.fallback.updateChannel(botId, id, patch); }
  proposeChange(botId: string, instruction: string) { return this.req<T.ChangeRequest>(`/v1/bots/${botId}/change-requests`, { method: "POST", body: JSON.stringify({ instruction }) }); }
  decideChange(botId: string, id: string, accepted: number[]) { return this.req<{ status: T.ChangeRequest["status"]; version?: number }>(`/v1/bots/${botId}/change-requests/${id}/decide`, { method: "POST", body: JSON.stringify({ accepted }) }); }
  changeRequests(botId?: string) { return this.fallback.changeRequests(botId); }
  conversations(f: Parameters<Api["conversations"]>[0]) { const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])); return this.req<{ items: T.Conversation[]; total: number }>(`/v1/conversations?${q}`); }
  conversation(id: string) { return this.req<T.Conversation & { messages: T.Message[] }>(`/v1/conversations/${id}`); }
  async simulate(botId: string, history: { role: "user" | "assistant"; content: string }[]) {
    const last = history[history.length - 1];
    const res = await this.fetchImpl(`${this.baseUrl}/v1/chat`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.token()}` }, body: JSON.stringify({ bot_id: botId, channel: "web", text: last.content }) });
    if (!res.ok || !res.body) throw new Error("No se pudo simular");
    return res.body.pipeThrough(new TextDecoderStream());
  }
  usage(days = 30) { return this.req<T.UsageSummary>(`/v1/usage?org_id=${this.orgId}&days=${days}`); }
  async xray(botId?: string) { const x = await this.req<Omit<T.XRay, "insights">>(`/v1/usage/xray?org_id=${this.orgId}${botId ? `&bot_id=${botId}` : ""}`); return { ...x, insights: [] }; }
  resolveUnanswered(id: string, answer: string) { return this.fallback.resolveUnanswered(id, answer); }
  alerts() { return this.fallback.alerts(); }
  ackAlert(id: string) { return this.fallback.ackAlert(id); }
  changelog() { return this.fallback.changelog(); }
  members() { return this.req<T.Member[]>(`/v1/orgs/${this.orgId}/members`); }
  async invite(email: string, role: T.OrgRole) { await this.req(`/v1/orgs/${this.orgId}/invites`, { method: "POST", body: JSON.stringify({ email, role }) }); }
  async updateMember(userId: string, role: T.OrgRole) { await this.req(`/v1/orgs/${this.orgId}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }); }
  async removeMember(userId: string) { await this.req(`/v1/orgs/${this.orgId}/members/${userId}`, { method: "DELETE" }); }
  audit(limit?: number) { return this.fallback.audit(limit); }
  invoices() { return this.fallback.invoices(); }
  checkout(plan: T.PlanTier) { return this.req<{ url: string }>("/v1/billing/checkout", { method: "POST", body: JSON.stringify({ org_id: this.orgId, plan }) }); }
  portal() { return this.req<{ url: string }>("/v1/billing/portal", { method: "POST", body: JSON.stringify({ org_id: this.orgId }) }); }
  dataRequests() { return this.fallback.dataRequests(); }
  createDataRequest(r: { type: T.DataRequest["type"]; requester_ref: string }) { return this.fallback.createDataRequest(r); }
  retention() { return this.fallback.retention(); }
  saveRetention(p: T.RetentionPolicy) { return this.fallback.saveRetention(p); }
  apiKeys() { return this.fallback.apiKeys(); }
  createApiKey(k: { name: string; bot_id?: string; allowed_origins: string[] }) { return this.fallback.createApiKey(k); }
  revokeApiKey(id: string) { return this.fallback.revokeApiKey(id); }
  exportAll() { return this.fallback.exportAll(); }
  templates() { return this.req<{ plantillas: T.PlantillaResumen[]; aviso_reglas: string; limites: { bytes_por_fuente: number; fuentes_por_bot: number } }>("/v1/templates"); }
  template(id: string) { return this.req<T.PlantillaDetalle>(`/v1/templates/${id}`); }
  createBotFromTemplate(plantillaId: string, r: T.RespuestasCuestionario) {
    return this.req<{ bot: T.Bot; estado: string }>(`/v1/templates/${plantillaId}/bot`, { method: "POST", body: JSON.stringify({ ...r, org_id: this.orgId, plantilla_id: plantillaId }) });
  }
  restoreVersion(botId: string, version: number) {
    return this.req<{ version: number; restaurada: number }>(`/v1/bots/${botId}/master-document/restore`, { method: "POST", body: JSON.stringify({ version }) });
  }
}
