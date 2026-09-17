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
  constructor(private baseUrl: string, private token: () => string | null) {}

  private async req<X>(path: string, init: RequestInit = {}): Promise<X> {
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...(this.token() ? { authorization: `Bearer ${this.token()}` } : {}), ...(init.headers ?? {}) } });
    if (!res.ok) { const e = await res.json().catch(() => ({ message: res.statusText })); throw new Error(e.message ?? "Error"); }
    return res.json();
  }
  private orgId = "";
  async me() { const m = await this.fallback.me(); this.orgId = m.org.id; return m; }
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
    const res = await fetch(`${this.baseUrl}/v1/chat`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.token()}` }, body: JSON.stringify({ bot_id: botId, channel: "web", text: last.content }) });
    if (!res.ok || !res.body) throw new Error("No se pudo simular");
    return res.body.pipeThrough(new TextDecoderStream());
  }
  usage(days = 30) { return this.req<T.UsageSummary>(`/v1/usage?org_id=${this.orgId}&days=${days}`); }
  async xray(botId?: string) { const x = await this.req<Omit<T.XRay, "insights">>(`/v1/usage/xray?org_id=${this.orgId}${botId ? `&bot_id=${botId}` : ""}`); return { ...x, insights: [] }; }
  resolveUnanswered(id: string, answer: string) { return this.fallback.resolveUnanswered(id, answer); }
  alerts() { return this.fallback.alerts(); }
  ackAlert(id: string) { return this.fallback.ackAlert(id); }
  changelog() { return this.fallback.changelog(); }
  members() { return this.fallback.members(); }
  invite(email: string, role: T.OrgRole) { return this.fallback.invite(email, role); }
  updateMember(userId: string, role: T.OrgRole) { return this.fallback.updateMember(userId, role); }
  removeMember(userId: string) { return this.fallback.removeMember(userId); }
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
}
